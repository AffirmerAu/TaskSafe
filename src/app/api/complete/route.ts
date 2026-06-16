import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { lessonId, courseId, correct, total, passed, lang } = body;

  const { error } = await supabase.from("completions").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      correct_answers: correct,
      total_questions: total,
      passed,
      language: lang,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
