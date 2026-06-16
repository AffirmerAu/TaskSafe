import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "./supabase-server";
import { embed } from "./gemini";

/**
 * ──────────────────────────────────────────────────────────────
 *  CONTENT LAYER  (the "auth-aware MCP content server")
 *
 *  This is the single access-control choke point for course
 *  content. It exposes the same contract the build prompt asked
 *  the MCP server for —
 *      getLesson(id) · getNextLesson(user) · searchContent(query)
 *  — but implemented as a server-only module so it runs natively
 *  on Vercel's serverless runtime. Gating lives HERE: every
 *  function resolves the signed-in user from their Supabase
 *  session (JWT) and refuses to return lessons the user has not
 *  unlocked. RLS in the database is the second line of defence.
 *
 *  To extract this into a standalone MCP server later, wrap these
 *  three functions as MCP tools and validate the same JWT there.
 * ──────────────────────────────────────────────────────────────
 */

export type AuthedUser = { id: string };

async function requireUser(): Promise<{ user: AuthedUser; supabase: SupabaseClient }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { user, supabase };
}

/** Module ids this user is allowed to see (unlocked === true). */
async function unlockedModuleIds(
  supabase: SupabaseClient,
  userId: string,
  courseId?: string
): Promise<string[]> {
  let q = supabase
    .from("module_unlocks")
    .select("module_id, modules!inner(course_id)")
    .eq("user_id", userId)
    .eq("unlocked", true);
  if (courseId) q = q.eq("modules.course_id", courseId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => r.module_id);
}

/** get_lesson(id): returns a lesson + its slides, or null if locked / missing. */
export async function getLesson(lessonId: string) {
  const { user, supabase } = await requireUser();

  // RLS already blocks locked lessons, but we check explicitly for a clean 403.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, position, module_id, modules(id, slug, title, course_id)")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return null;

  const allowed = await unlockedModuleIds(supabase, user.id);
  if (!allowed.includes(lesson.module_id)) return null; // gated

  const { data: slides } = await supabase
    .from("slides")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("position", { ascending: true });

  return { lesson, slides: slides ?? [] };
}

/** get_lesson by module slug — convenience for the lesson route. */
export async function getLessonByModuleSlug(moduleSlug: string) {
  const { user, supabase } = await requireUser();
  const { data: mod } = await supabase
    .from("modules")
    .select("id, slug, title, course_id")
    .eq("slug", moduleSlug)
    .maybeSingle();
  if (!mod) return null;

  const allowed = await unlockedModuleIds(supabase, user.id);
  if (!allowed.includes(mod.id)) return null;

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, position, module_id")
    .eq("module_id", mod.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!lesson) return null;

  const { data: slides } = await supabase
    .from("slides")
    .select("*")
    .eq("lesson_id", lesson.id)
    .order("position", { ascending: true });

  return { module: mod, lesson, slides: slides ?? [] };
}

/** get_next_lesson(user): the first unlocked, not-yet-completed lesson. */
export async function getNextLesson() {
  const { user, supabase } = await requireUser();
  const allowed = await unlockedModuleIds(supabase, user.id);
  if (allowed.length === 0) return null;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, module_id, position, modules(position)")
    .in("module_id", allowed);
  if (!lessons || lessons.length === 0) return null;

  const { data: done } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("completed", true);
  const completed = new Set((done ?? []).map((d) => d.lesson_id));

  const ordered = [...lessons].sort(
    (a: any, b: any) =>
      (a.modules?.position ?? 0) - (b.modules?.position ?? 0) || a.position - b.position
  );
  return ordered.find((l) => !completed.has(l.id)) ?? ordered[0];
}

/**
 * search_content(query): RAG retrieval, scoped to the user's unlocked modules.
 * Embeds the query, then runs cosine similarity in pgvector. content_chunks is
 * RLS-denied to the browser, so we use the admin client AND pass only the
 * explicit allowed module ids — gating is enforced in code, not trusted to the DB.
 */
export async function searchContent(opts: {
  query: string;
  courseId: string;
  matchCount?: number;
}): Promise<{ content: string; lessonId: string | null }[]> {
  const { user, supabase } = await requireUser();
  const allowed = await unlockedModuleIds(supabase, user.id, opts.courseId);
  if (allowed.length === 0) return [];

  const queryEmbedding = await embed(opts.query);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("match_content", {
    query_embedding: queryEmbedding,
    p_course_id: opts.courseId,
    p_module_ids: allowed,
    match_count: opts.matchCount ?? 5,
  });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ content: r.content, lessonId: r.lesson_id }));
}
