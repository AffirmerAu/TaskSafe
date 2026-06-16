/**
 * Shared seed + embed logic. Pure functions that take a service-role Supabase
 * client — no env loading, no process.exit — so they can run from either the
 * CLI scripts (scripts/seed.ts, scripts/embed.ts) or the one-time admin API
 * route (src/app/api/admin/seed/route.ts) used for Vercel-only deploys.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const IMG = (f: string) => `/assets/${f}`;

const SLIDES = [
  {
    position: 1, kind: "mode", eyebrow: "Welcome", title: "Your safety training",
    body: "How would you like to learn?", media_url: IMG("working-at-heights.jpg"),
    progress_pct: 8, payload: { dark: true },
  },
  {
    position: 2, kind: "video", eyebrow: "Working at Heights",
    title: "A fall that didn't have to happen",
    body: "Watch this short video. Then tap to continue.",
    media_url: IMG("working-at-heights.jpg"), vimeo_id: null, progress_pct: 22,
    payload: {
      badge: "True story", totalSecs: 134,
      captions: [
        "This is a real fall. It happened on a site like yours.",
        "Sam was fixing a light on the walkway.",
        "There were no rails. Sam was not clipped on.",
        "Sam leaned out to reach… and slipped.",
        "A four metre fall. Months off work.",
        "This was easy to stop. Here's how.",
      ],
    },
  },
  {
    position: 3, kind: "content", eyebrow: "Stay safe up high · 1 of 3", title: "Stay off heights",
    body: "Do the job from the ground when you can. This is the safest way.",
    media_url: IMG("fall-clean.jpg"), progress_pct: 38, payload: {},
  },
  {
    position: 4, kind: "content", eyebrow: "2 of 3", title: "Use barriers",
    body: "Put up rails, covers and edge protection to stop a fall.",
    media_url: IMG("fall-clean.jpg"), progress_pct: 52, payload: {},
  },
  {
    position: 5, kind: "content", eyebrow: "3 of 3", title: "Wear a harness",
    body: "Only when 1 and 2 are not possible. Clip on every time.",
    media_url: IMG("fall-clean.jpg"), progress_pct: 65, payload: {},
  },
  {
    position: 6, kind: "question", eyebrow: null, title: null, body: null, progress_pct: 76,
    payload: {
      label: "Question 1",
      text: "What is the <b>safest</b> way to work up high?",
      options: [
        { k: "A", label: "Wear a harness and clip on" },
        { k: "B", label: "Do the job from the ground if you can" },
        { k: "C", label: "Put up a warning sign" },
      ],
      correct: "B",
      okHtml: "That's right. The safest way is to <b>stay off heights</b> — do the job from the ground when you can.",
      noHtml: "Not quite. A harness is the <b>last choice</b>. The safest way is to <b>do the job from the ground</b> when you can.",
    },
  },
  {
    position: 7, kind: "doc", eyebrow: "Site document", title: "Your safety plan",
    body: "Open this any time to check the steps.", progress_pct: 86, payload: {},
  },
  {
    position: 8, kind: "question", eyebrow: null, title: null, body: null, progress_pct: 100,
    payload: {
      label: "Question 2",
      text: "Before you climb, what do you check <b>first</b>?",
      options: [
        { k: "A", label: "My harness and clips are good" },
        { k: "B", label: "If it is raining" },
        { k: "C", label: "Nothing — I just climb up" },
      ],
      correct: "A",
      okHtml: "Exactly right. Check your <b>harness and clips</b> every time before you climb.",
      noHtml: "Always check your <b>harness and clips</b> first. Make sure they are good before you climb.",
      last: true,
    },
  },
];

// Plain-language knowledge the AI tutor retrieves from (RAG).
const CHUNKS = [
  "Working at heights means any work where you could fall and get hurt. The safest way to work at heights is to stay off heights when you can — do the job from the ground.",
  "The hierarchy of control for working at heights: first, do the work from the ground. Second, use passive protection like guardrails, covers and edge protection. A harness is the last choice, used only when the first two are not possible.",
  "Guardrails, edge protection and hole covers are barriers that stop a fall before it happens. Put them up before you start work near an edge or opening.",
  "If you must wear a harness, clip on every time and check the harness and clips before you climb. Make sure the anchor point is rated and secure.",
  "Before climbing, always check your harness and clips first. Look for damage, frayed webbing or broken buckles. If anything looks wrong, do not use it — report it.",
  "A real incident: a worker named Sam was fixing a light on a walkway with no rails and was not clipped on. Sam leaned out, slipped, and fell four metres, resulting in months off work. The fall was preventable with barriers or a harness.",
  "If you are not sure whether it is safe to work at a height, stop and ask your supervisor before you start.",
];

/**
 * Seed the MVP: one course, three modules (only module 1 unlocked), the Working
 * at Heights lesson with its 8 slides, RAG content chunks (no embeddings yet),
 * and a demo worker enrolled with module-1 gating. Idempotent.
 */
export async function runSeed(
  db: SupabaseClient,
  opts: { seedEmail: string }
): Promise<{ course: string; seedEmail: string; chunks: number }> {
  // 1) Course
  const { data: course, error: courseErr } = await db
    .from("courses")
    .upsert(
      { slug: "site-safety-essentials", employer_name: "Coastline Civil", title: "Site Safety Essentials", subtitle: "Induction", total_mins: 18 },
      { onConflict: "slug" }
    )
    .select()
    .single();
  if (courseErr || !course) throw new Error(`course insert failed: ${courseErr?.message}`);

  // 2) Modules
  const moduleDefs = [
    { position: 1, slug: "heights", title: "Working at Heights", icon: "hard-hat", lessons: 5, mins: 6, thumb_url: IMG("working-at-heights.jpg") },
    { position: 2, slug: "manual", title: "Manual Handling", icon: "layers", lessons: 4, mins: 5, thumb_url: null },
    { position: 3, slug: "forklift", title: "Forklift Safety", icon: "box", lessons: 4, mins: 7, thumb_url: null },
  ];
  const modules: Record<string, string> = {};
  for (const m of moduleDefs) {
    const { data } = await db
      .from("modules")
      .upsert({ course_id: course.id, ...m }, { onConflict: "course_id,position" })
      .select()
      .single();
    modules[m.slug] = data!.id;
  }

  // 3) Lesson under "heights"
  const { data: lesson } = await db
    .from("lessons")
    .upsert({ module_id: modules["heights"], position: 1, title: "Working at Heights" }, { onConflict: "module_id,position" })
    .select()
    .single();

  // 4) Slides (replace existing for idempotency)
  await db.from("slides").delete().eq("lesson_id", lesson!.id);
  await db.from("slides").insert(SLIDES.map((s) => ({ lesson_id: lesson!.id, ...s })));

  // 5) RAG chunks (embeddings filled by runEmbed)
  await db.from("content_chunks").delete().eq("course_id", course.id);
  await db.from("content_chunks").insert(
    CHUNKS.map((content) => ({
      course_id: course.id,
      module_id: modules["heights"],
      lesson_id: lesson!.id,
      content,
    }))
  );

  // 6) Demo worker + enrolment + gating (only module 1 unlocked)
  let userId: string | undefined;
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email: opts.seedEmail,
    email_confirm: true,
    user_metadata: { full_name: "Daniel Okafor" },
  });
  if (created?.user) userId = created.user.id;
  else if (createErr) {
    const { data: list } = await db.auth.admin.listUsers();
    userId = list?.users.find((u) => u.email === opts.seedEmail)?.id;
  }
  if (!userId) throw new Error("could not create/find demo user");

  await db.from("profiles").upsert({
    id: userId,
    full_name: "Daniel Okafor",
    role: "Traffic Controller · Northbridge Site 4",
    language: "en",
  });
  await db.from("enrollments").upsert({ user_id: userId, course_id: course.id });
  await db.from("module_unlocks").upsert([
    { user_id: userId, module_id: modules["heights"], unlocked: true },
    { user_id: userId, module_id: modules["manual"], unlocked: false },
    { user_id: userId, module_id: modules["forklift"], unlocked: false },
  ]);

  return { course: course.title, seedEmail: opts.seedEmail, chunks: CHUNKS.length };
}

/**
 * Compute embeddings for any content chunks that don't have one yet. Safe to
 * re-run; only touches rows where embedding IS NULL.
 */
export async function runEmbed(
  db: SupabaseClient,
  embed: (text: string) => Promise<number[]>
): Promise<{ embedded: number }> {
  const { data: chunks, error } = await db
    .from("content_chunks")
    .select("id, content")
    .is("embedding", null);
  if (error) throw error;
  if (!chunks || chunks.length === 0) return { embedded: 0 };

  let done = 0;
  for (const chunk of chunks) {
    const vector = await embed(chunk.content);
    const { error: upErr } = await db
      .from("content_chunks")
      .update({ embedding: vector })
      .eq("id", chunk.id);
    if (upErr) throw upErr;
    done += 1;
  }
  return { embedded: done };
}
