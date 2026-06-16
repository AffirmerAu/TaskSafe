# Affirmer — AI Safety-Induction Training App (MVP)

A mobile-first, conversational Work Health & Safety (WHS) induction app. A worker
logs in with a magic link, plays a lesson (video + images + narration), and can
ask an AI safety guide questions **by text or voice, in any language** — getting
answers grounded in the course content and spoken back aloud. Lessons are gated
per user: you can't open a module you haven't unlocked.

Built with **Next.js + Supabase + Gemini**, designed to run on the **Vercel +
Supabase free tiers**.

The MVP ships **one course** — *Site Safety Essentials* by "Coastline Civil"
(powered by Affirmer) — with three modules. Only **Working at Heights** is
unlocked; the other two demonstrate gating. That module has a full 8-slide lesson
with video, images, narration, comprehension checks, and the AI tutor.

---

## Table of contents

1. [What's inside](#whats-inside)
2. [How it maps to the brief](#how-it-maps-to-the-brief)
3. [Prerequisites](#prerequisites)
4. [Deploy to Vercel (no terminal needed)](#deploy-to-vercel-no-terminal-needed)
5. [Step-by-step local setup](#step-by-step-local-setup)
6. [Environment variables](#environment-variables)
7. [Deploying to Vercel (Git + CLI seeding)](#deploying-to-vercel)
7. [Cost & the free/paid toggles](#cost--the-freepaid-toggles)
8. [Enabling the optional paid services](#enabling-the-optional-paid-services)
9. [Architecture notes & decisions](#architecture-notes--decisions)
10. [What's deferred / out of scope](#whats-deferred--out-of-scope)
11. [Troubleshooting](#troubleshooting)

---

## What's inside

```
training-app/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                  Landing: language picker + magic-link entry
│  │  ├─ login/page.tsx            Request a magic link
│  │  ├─ auth/confirm/route.ts     Magic-link callback → verifies & logs in
│  │  ├─ course/page.tsx           Course overview: modules + lock state + progress
│  │  ├─ lesson/[moduleSlug]/page.tsx   Gated lesson player (404s if locked)
│  │  ├─ not-found.tsx             Locked / 404 screen
│  │  └─ api/
│  │     ├─ tutor/route.ts         Q&A: auth + rate-limit + RAG + grounded answer
│  │     ├─ tts/route.ts           Optional Azure Neural TTS (off by default)
│  │     └─ stt/route.ts           Optional Whisper/Deepgram STT (off by default)
│  ├─ components/
│  │  ├─ slide-lesson.tsx          The lesson player (video/content/quiz slides)
│  │  ├─ tutor-chat.tsx            The "Ask the guide" bottom sheet (text + voice)
│  │  └─ icons.tsx                 Iconography + progress ring + branding
│  ├─ lib/
│  │  ├─ content.ts                ⭐ Auth-aware content layer (the "MCP" gating)
│  │  ├─ gemini.ts                 Embeddings + grounded answer generation
│  │  ├─ voice.ts                  Browser Web Speech (free TTS + STT)
│  │  ├─ rate-limit.ts             Per-user sliding-window limiter
│  │  ├─ languages.ts              The 8 supported languages
│  │  ├─ supabase-browser.ts       Client Supabase
│  │  └─ supabase-server.ts        Server + service-role Supabase
│  ├─ middleware.ts               Session refresh + route protection
│  └─ styles/                     Design tokens + components (from Claude Design)
├─ supabase/migrations/0001_init.sql   Schema, pgvector, RLS, match_content()
├─ scripts/
│  ├─ seed.ts                     Seeds the course, lesson, slides, chunks, demo user
│  └─ embed.ts                    Computes pgvector embeddings for the chunks
├─ public/assets/                 Lesson images + branding
└─ .env.example
```

## How it maps to the brief

| Brief requirement | How it's met |
|---|---|
| Next.js (App Router, TS), one deployable | ✅ this repo |
| Supabase: Postgres + magic-link auth + storage | ✅ migration + auth + (storage used for narration when you add it) |
| `pgvector` for embeddings, no separate vector DB | ✅ `vector(768)` column + `match_content()` |
| **Auth-aware MCP content layer** with `get_lesson` / `get_next_lesson` / `search_content`, gating lives here | ✅ `src/lib/content.ts` — see [architecture notes](#architecture-notes--decisions) |
| RAG: retrieve chunks, answer from them | ✅ `searchContent()` → `answerQuestion()` |
| Gemini Flash, multilingual, Flash-Lite flag | ✅ `GEMINI_MODEL` (default `gemini-2.0-flash`) |
| Magic-link login | ✅ `/login` + `/auth/confirm` |
| Lesson player (video + images + narration) | ✅ `slide-lesson.tsx` |
| Tutor: text & voice question → grounded → spoken answer | ✅ `tutor-chat.tsx` + `/api/tutor` |
| Answer in the asker's language | ✅ language carried through the whole flow |
| Per-user gating blocks locked lessons | ✅ enforced in code **and** in Postgres RLS |
| Cost guardrails (caching, signed URLs, rate limiting) | ✅ rate limiting in place; signed-URL TTL + caching wired |

---

## Prerequisites

- **Node.js 18.18+** (or 20+). Check with `node -v`.
- A free **[Supabase](https://supabase.com)** account.
- A free **[Google AI Studio](https://aistudio.google.com/app/apikey)** API key (for Gemini — embeddings + tutor answers).
- *(For deploy)* a free **[Vercel](https://vercel.com)** account.
- *(Optional, later)* a Vimeo Standard plan, an Azure Speech key, and an OpenAI/Deepgram key — only if you want hosted video or upgraded voice. The app runs fully without them.

---

## Deploy to Vercel (no terminal needed)

This is the recommended path if you don't want to run anything locally. The only
step that touches the database (seeding the course + computing embeddings) is
handled by a built-in, secret-protected endpoint you hit once from your browser.

### 1. Create the Supabase project & run the migration

1. <https://supabase.com/dashboard> → **New project**. Pick a name, a strong DB password, and a region near your users. Wait ~2 min for provisioning.
2. Open **SQL Editor → New query**, paste the entire contents of `supabase/migrations/0001_init.sql`, and click **Run**. This creates every table, the `pgvector` setup, the row-level-security policies, and the `match_content()` function.

### 2. Get your keys

In Supabase → **Project Settings → API**, copy the **Project URL**, the **`anon` public** key, and the **`service_role` secret** key. Then grab a **Gemini key** from <https://aistudio.google.com/app/apikey>.

### 3. Deploy on Vercel

1. Push this project to a Git repo (GitHub/GitLab/Bitbucket).
2. Vercel → **Add New → Project** → import the repo (it auto-detects Next.js).
3. Under **Environment Variables**, add:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service-role key |
   | `GEMINI_API_KEY` | Gemini key |
   | `NEXT_PUBLIC_APP_URL` | leave blank for now, or set after first deploy to `https://your-app.vercel.app` |
   | `SEED_EMAIL` | a **real inbox you control** — this is the worker you log in as |
   | `SEED_SECRET` | any long random string (e.g. from a password generator) |

4. Deploy. Note your production URL, e.g. `https://your-app.vercel.app`.
5. Set `NEXT_PUBLIC_APP_URL` to that URL in the Vercel env vars and redeploy (so magic-link redirects point at production).

### 4. Point Supabase auth at your deployment

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add `https://your-app.vercel.app/auth/confirm`

### 5. Seed the database — one click

Visit this URL once in your browser (substitute your domain and your `SEED_SECRET`):

```
https://your-app.vercel.app/api/admin/seed?key=YOUR_SEED_SECRET
```

You'll get back a small JSON confirmation like
`{ "ok": true, "course": "Site Safety Essentials", "embedded": 7, … }`. That creates
the course, lesson, slides, RAG chunks, the demo worker, and the embeddings. It's
**idempotent** — safe to hit again, it won't duplicate anything. The endpoint
refuses to run unless your `SEED_SECRET` matches, so leaving it deployed is safe.
(You can delete `src/app/api/admin/seed/route.ts` and redeploy afterward if you
prefer to remove it entirely.)

### 6. Use it

Go to your site, pick a language, enter your `SEED_EMAIL` address, and click the
magic link from your inbox. You'll land on the course, play **Working at
Heights**, and can tap **"Ask the guide"** to question the tutor by text or
voice. The other two modules are locked — that's the gating working.

---

## Step-by-step local setup

*(Optional — only if you want to run it on your own machine. If you followed the
Vercel path above, you can skip this.)*

### 1. Install dependencies

```bash
cd training-app
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**. Pick a name, a strong database password, and a region near your users.
2. Wait for it to finish provisioning (~2 min).

### 3. Run the database migration

The migration enables `pgvector`, creates every table, the RLS policies, and the
`match_content()` similarity function.

**Easiest (no CLI):** in the Supabase dashboard, open **SQL Editor → New query**,
paste the entire contents of `supabase/migrations/0001_init.sql`, and click **Run**.

<details>
<summary>Alternative: using the Supabase CLI</summary>

```bash
npm i -g supabase
supabase link --project-ref <your-project-ref>
supabase db push
```
</details>

### 4. Get your keys

In the Supabase dashboard → **Project Settings → API**, copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **`anon` public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **`service_role` secret key** → `SUPABASE_SERVICE_ROLE_KEY` *(server-only — never expose this in the browser)*

Then get a **Gemini key** from <https://aistudio.google.com/app/apikey> → `GEMINI_API_KEY`.

### 5. Create `.env.local`

Copy the example and fill in the five required values:

```bash
cp .env.example .env.local
```

Minimum to run locally (everything else has safe defaults):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SEED_EMAIL=you@yourdomain.com   # the demo worker — use a real inbox you control
```

> Set `SEED_EMAIL` to an address you can receive mail at — that's the account you'll log into.

### 6. Configure the magic-link redirect

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/confirm`

*(When you deploy, add your production equivalents too — see below.)*

### 7. Seed the course and compute embeddings

```bash
npm run seed     # creates the course, lesson, 8 slides, RAG chunks, demo worker + gating
npm run embed    # turns the RAG chunks into pgvector embeddings (needs GEMINI_API_KEY)
```

`seed` is idempotent — safe to re-run. `embed` only processes chunks that don't
have an embedding yet, so it resumes if interrupted.

### 8. Run it

```bash
npm run dev
```

Open <http://localhost:3000>, pick a language, enter the **`SEED_EMAIL`** address,
and click the magic link from your inbox. You'll land on the course, open
**Working at Heights**, play through the slides, and tap **"Ask the guide"** to
question the tutor by text or voice. Try the other two modules — they're locked.

---

## Environment variables

See `.env.example` for the annotated list. Summary:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | — | Public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Server-only key (seed/embed, admin RAG query) |
| `GEMINI_API_KEY` | ✅ | — | Embeddings + tutor answers |
| `NEXT_PUBLIC_APP_URL` | ✅ | — | Base URL for magic-link redirects |
| `SEED_EMAIL` | for seeding | `worker@example.com` | Demo worker login |
| `SEED_SECRET` | for endpoint seeding | — | Protects `/api/admin/seed`; pass as `?key=` to seed without a terminal |
| `GEMINI_MODEL` | — | `gemini-2.0-flash` | Set to `gemini-2.0-flash-lite` for the cheapest tier |
| `GEMINI_EMBED_MODEL` | — | `text-embedding-004` | 768-dim, matches the DB column |
| `TUTOR_RATE_LIMIT_PER_MIN` | — | `8` | Per-user tutor calls/minute |
| `SIGNED_URL_TTL_SECONDS` | — | `600` | TTL for signed audio URLs |
| `TTS_PROVIDER` | — | `webspeech` | `azure` to use Azure Neural TTS |
| `STT_PROVIDER` | — | `webspeech` | `openai` / `deepgram` for server STT |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | if Azure | — | Azure TTS |
| `OPENAI_API_KEY` / `DEEPGRAM_API_KEY` | if server STT | — | Whisper / Deepgram |
| `VIMEO_ACCESS_TOKEN` | if Vimeo API | — | Hosted video |

---

## Deploying to Vercel

> If you used the [no-terminal path above](#deploy-to-vercel-no-terminal-needed),
> you're already deployed — skip this. This section is the alternative where you
> seed from your own machine with the CLI scripts instead of the endpoint.

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel → **Add New → Project** → import the repo. Framework auto-detects as **Next.js**.
3. **Environment Variables:** add every value from your `.env.local` **except** swap `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://your-app.vercel.app`).
4. Deploy.
5. Back in **Supabase → Authentication → URL Configuration**, add the production URLs:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/auth/confirm`
6. Run `npm run seed` and `npm run embed` once against the same Supabase project (from your machine, with production env values in `.env.local`) so the live database has the course.

That's it — the Supabase free tier and Vercel hobby tier are enough for the MVP.

---

## Cost & the free/paid toggles

The brief said *favour the lowest-cost option and ask before adding paid services.*
So by default this MVP runs on **only free tiers**:

- **Voice is free.** Lesson read-aloud and the tutor's spoken answers use the
  browser's built-in **Web Speech API** (`TTS_PROVIDER=webspeech`), and voice
  questions use the browser's built-in speech recognition
  (`STT_PROVIDER=webspeech`). No Azure or Whisper bill.
- **Video is free.** The seeded lesson uses a lightweight simulated player
  (image + progress) so it works with zero video hosting. Switch to real Vimeo
  embeds when you're ready (see below).
- **The only metered service is Gemini**, which has a free tier and is the
  cheapest strong multilingual option. Flip `GEMINI_MODEL` to
  `gemini-2.0-flash-lite` for the cheapest tier.

The Azure TTS, Whisper/Deepgram STT, and Vimeo paths named in the brief are all
**wired but off** — enable them with env flags only when you want them.

---

## Enabling the optional paid services

**Azure Neural TTS** (higher-quality, 140+ languages): set `TTS_PROVIDER=azure`,
`AZURE_SPEECH_KEY`, and `AZURE_SPEECH_REGION`. The client will call `/api/tts`
instead of the browser voice. For fixed lesson narration, pre-generate audio
once per language and store it in Supabase Storage rather than synthesising on
the fly (live TTS is for dynamic Q&A only).

**Server STT (Whisper/Deepgram)** for voice questions on browsers without speech
recognition: set `STT_PROVIDER=openai` (+`OPENAI_API_KEY`) or `deepgram`
(+`DEEPGRAM_API_KEY`). The recorder posts audio to `/api/stt`.

**Vimeo video:** add a slide with a `vimeo_id` (the seed shows where), set
`VIMEO_ACCESS_TOKEN` if you use the API, and configure domain-restricted privacy
+ "hide from Vimeo" + disable download/share in Vimeo. For exact 95%-watched
gating, add `@vimeo/player` and listen to its `timeupdate` event (the current
build advances after a short dwell as a stand-in).

---

## Architecture notes & decisions

**Two inputs, one app.** The build prompt defined the *backend/architecture*; the
Claude Design files defined the *UI* (a white-label WHS induction for "Coastline
Civil / Affirmer"). They're compatible — this app implements that exact UI on top
of the prompt's Next.js + Supabase + RAG + tutor backend.

**The "MCP content server" → an auth-aware content module.** The brief asked for a
small MCP server exposing `get_lesson` / `get_next_lesson` / `search_content`,
auth-aware, with gating living there. On Vercel's serverless model, a long-running
MCP process is awkward, so the same contract is implemented as a **server-only
content module** (`src/lib/content.ts`) called behind Next API routes. It does
exactly what the brief specified: validates the Supabase session, resolves which
modules the user has unlocked, and **only ever serves unlocked content** —
`searchContent()` even passes the allowed module IDs into the SQL similarity
function so RAG can't leak locked material. It's structured so it can be lifted
out into a standalone MCP server later with no change to the gating logic.

**Gating is enforced twice.** Once in the content layer (it only hands out
unlocked modules) and again in **Postgres Row-Level Security** — `content_chunks`
is deny-by-default, and lessons/slides are readable only for unlocked modules.
Even a leaked key or a direct query can't bypass it.

**Embeddings.** Gemini `text-embedding-004` → 768-dim vectors, matching the
`vector(768)` column and the `ivfflat` index.

---

## What's deferred / out of scope

Per the brief these are intentionally **not** built (stubbed or skipped):
payments/billing, an admin course-upload UI (seed via script), per-user
watermarking/DRM, talking-avatar video, multiple courses / multi-tenant, and
analytics dashboards.

Also note: the design included **Results** and **Certificate** screens that aren't
in this MVP — finishing a lesson currently returns the worker to the course
overview. They're a natural next addition.

---

## Troubleshooting

- **Magic link doesn't log me in / redirects to login.** The redirect URL isn't
  whitelisted. Add `<your-url>/auth/confirm` under Supabase → Authentication →
  URL Configuration, and make sure `NEXT_PUBLIC_APP_URL` matches the site you're
  visiting.
- **`npm run seed` fails with a key error.** `.env.local` is missing
  `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`.
- **`/api/admin/seed` returns 403 or 503.** 403 means the `key` you passed
  doesn't match `SEED_SECRET`; 503 means `SEED_SECRET` isn't set in your Vercel
  env vars (add it and redeploy). After changing env vars on Vercel, redeploy so
  they take effect.
- **Tutor says it can only help with the induction / gives thin answers.** The
  embeddings didn't run.
- **Voice buttons do nothing.** The browser lacks Web Speech support (common on
  some desktop Firefox builds). Use Chrome/Edge/Safari, or enable the Azure/STT
  providers.
- **"A Node.js API is used … Edge Runtime" warning during build.** Harmless — it
  comes from the Supabase client imported in middleware and doesn't affect the
  build.
