-- ============================================================
-- Affirmer Training App — one-time database setup
--
-- HOW TO USE (no technical knowledge needed):
--   1. Open your Supabase project at https://supabase.com/dashboard
--   2. In the left sidebar click "SQL Editor", then "New query"
--   3. Copy EVERYTHING in this file, paste it in, and click "Run"
--   4. You should see "Success". That's it — the tables are ready.
--
-- Safe to run more than once.
-- ============================================================

-- ════════════════════════════════════════════════════════════════
--  Affirmer Training App — schema
--  Postgres + pgvector. Run in Supabase SQL editor or via `supabase db push`.
-- ════════════════════════════════════════════════════════════════

create extension if not exists vector;

-- ── Profiles (1:1 with auth.users) ──────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  full_name   text,
  role        text,                       -- e.g. "Traffic Controller · Northbridge Site 4"
  language    text default 'en',
  created_at  timestamptz default now()
);
-- Add name columns if upgrading from an older schema
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name  text;

-- ── Course catalogue ────────────────────────────────────────────
create table if not exists courses (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  employer_name text not null,            -- white-label employer, e.g. "Coastline Civil"
  title         text not null,            -- "Site Safety Essentials"
  subtitle      text,
  total_mins    int default 18,
  created_at    timestamptz default now()
);

create table if not exists modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  position    int  not null,              -- 1,2,3 …
  slug        text not null,              -- "heights"
  title       text not null,              -- "Working at Heights"
  icon        text default 'hard-hat',
  lessons     int  default 1,
  mins        int  default 6,
  thumb_url   text,
  unique (course_id, position)
);

create table if not exists lessons (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references modules(id) on delete cascade,
  position    int  not null,
  title       text not null,
  unique (module_id, position)
);

-- A slide is one beat of a lesson. `kind` drives how the UI renders it.
-- kind: mode | video | content | question | doc
create table if not exists slides (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  position    int  not null,
  kind        text not null,
  eyebrow     text,
  title       text,
  body        text,
  media_url   text,                       -- image url (Supabase storage or /assets)
  vimeo_id    text,                       -- if set, the video slide embeds Vimeo
  narration_url text,                     -- pre-generated narration audio (storage)
  payload     jsonb default '{}'::jsonb,  -- captions[], question options/correct, etc.
  progress_pct int default 0,             -- the design's per-slide progress value
  unique (lesson_id, position)
);

-- ── Enrolment + per-user gating ─────────────────────────────────
create table if not exists enrollments (
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- Per-user module unlock state. The content layer reads THIS to gate access.
create table if not exists module_unlocks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  module_id   uuid not null references modules(id) on delete cascade,
  unlocked    boolean default false,
  primary key (user_id, module_id)
);

-- ── Progress ────────────────────────────────────────────────────
create table if not exists progress (
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_id   uuid not null references lessons(id) on delete cascade,
  slide_index int  default 0,
  completed   boolean default false,
  updated_at  timestamptz default now(),
  primary key (user_id, lesson_id)
);

-- ── RAG content chunks (pgvector) ───────────────────────────────
-- text-embedding-004 emits 768-dim vectors.
create table if not exists content_chunks (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  module_id   uuid references modules(id) on delete cascade,
  lesson_id   uuid references lessons(id) on delete cascade,
  content     text not null,
  embedding   vector(768),
  created_at  timestamptz default now()
);

create index if not exists content_chunks_embedding_idx
  on content_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Similarity search, scoped to a course and an explicit set of unlocked modules.
-- The content layer passes only the modules the caller is allowed to see.
create or replace function match_content (
  query_embedding vector(768),
  p_course_id     uuid,
  p_module_ids    uuid[],
  match_count     int default 5
) returns table (id uuid, content text, module_id uuid, lesson_id uuid, similarity float)
language sql stable as $$
  select c.id, c.content, c.module_id, c.lesson_id,
         1 - (c.embedding <=> query_embedding) as similarity
  from content_chunks c
  where c.course_id = p_course_id
    and (c.module_id is null or c.module_id = any(p_module_ids))
    and c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ════════════════════════════════════════════════════════════════
--  Row Level Security
--  Belt-and-braces: the content layer also gates in code, but RLS
--  means even a leaked anon key can't read other users' data or
--  locked content.
-- ════════════════════════════════════════════════════════════════
alter table profiles        enable row level security;
alter table enrollments     enable row level security;
alter table module_unlocks  enable row level security;
alter table progress        enable row level security;
alter table courses         enable row level security;
alter table modules         enable row level security;
alter table lessons         enable row level security;
alter table slides          enable row level security;

-- Profile: a user sees/edits only their own row.
create policy "own profile read"  on profiles for select using (auth.uid() = id);
create policy "own profile write" on profiles for update using (auth.uid() = id);

-- Enrollments / unlocks / progress: scoped to the signed-in user.
create policy "own enrollments" on enrollments for select using (auth.uid() = user_id);
create policy "own unlocks"     on module_unlocks for select using (auth.uid() = user_id);
create policy "own progress rw" on progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Courses + modules: readable if the user is enrolled.
create policy "enrolled courses" on courses for select using (
  exists (select 1 from enrollments e where e.course_id = courses.id and e.user_id = auth.uid())
);
create policy "enrolled modules" on modules for select using (
  exists (select 1 from enrollments e where e.course_id = modules.course_id and e.user_id = auth.uid())
);

-- Lessons + slides: readable ONLY if the parent module is unlocked for this user.
create policy "unlocked lessons" on lessons for select using (
  exists (
    select 1 from module_unlocks mu
    where mu.module_id = lessons.module_id and mu.user_id = auth.uid() and mu.unlocked
  )
);
create policy "unlocked slides" on slides for select using (
  exists (
    select 1
    from lessons l
    join module_unlocks mu on mu.module_id = l.module_id
    where l.id = slides.lesson_id and mu.user_id = auth.uid() and mu.unlocked
  )
);

-- content_chunks: deny-by-default. No select policy means the browser/anon key
-- cannot read it directly. The content layer reaches it only via the
-- service-role key AND only after computing the user's unlocked module ids.
alter table content_chunks enable row level security;

-- ── Completions (lesson results) ────────────────────────────────
create table if not exists completions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  lesson_id        uuid references lessons(id)  on delete cascade not null,
  course_id        uuid references courses(id)  on delete cascade not null,
  correct_answers  int  not null default 0,
  total_questions  int  not null default 0,
  passed           boolean not null default false,
  language         text default 'en',
  completed_at     timestamptz default now(),
  unique (user_id, lesson_id)   -- only keep the latest attempt per user/lesson
);
alter table completions enable row level security;
-- Workers can read and write their own completions only
create policy "own completions" on completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
