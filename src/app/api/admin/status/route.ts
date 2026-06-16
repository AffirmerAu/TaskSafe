import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only health check for the /setup page. Returns booleans only (no secret
 * values), so it's safe to call without auth. Tells the setup screen which step
 * the user is on: keys present? tables created? seeded? embeddings done?
 */
export async function GET() {
  const env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  };
  const envReady = env.supabaseUrl && env.supabaseAnon && env.serviceRole && env.gemini;

  let schema = false;
  let seeded = false;
  let embedded = false;

  if (env.supabaseUrl && env.serviceRole) {
    try {
      const db = createAdminClient();
      const { data: course, error } = await db
        .from("courses")
        .select("id")
        .eq("slug", "site-safety-essentials")
        .maybeSingle();

      if (error && /relation|does not exist|find the table|schema cache/i.test(error.message)) {
        schema = false;
      } else {
        schema = true;
        seeded = !!course;
        if (course) {
          const { count } = await db
            .from("content_chunks")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id)
            .is("embedding", null);
          // embedded == there are chunks AND none are still missing an embedding
          const { count: total } = await db
            .from("content_chunks")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);
          embedded = (total ?? 0) > 0 && (count ?? 0) === 0;
        }
      }
    } catch {
      schema = false;
    }
  }

  return NextResponse.json({
    env,
    envReady,
    schema,
    seeded,
    embedded,
    secretRequired: !!process.env.SEED_SECRET,
    ready: envReady && schema && seeded && embedded,
  });
}
