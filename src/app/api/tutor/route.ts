import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { searchContent } from "@/lib/content";
import { answerQuestion } from "@/lib/gemini";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/tutor
 * Body: { question: string, courseId: string, lang?: string }
 * → content-grounded answer in the target language.
 * The client speaks the answer (Web Speech) or calls /api/tts for audio.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const limit = rateLimit(`tutor:${user.id}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: { question?: string; courseId?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const question = (body.question ?? "").trim();
  const courseId = body.courseId ?? "";
  const lang = body.lang ?? "en";
  if (!question || !courseId) {
    return NextResponse.json({ error: "question and courseId required" }, { status: 400 });
  }

  try {
    // Retrieve only from modules this user has unlocked (gated in the content layer).
    const hits = await searchContent({ query: question, courseId, matchCount: 5 });
    const answer = await answerQuestion({
      question,
      chunks: hits.map((h) => h.content),
      lang,
    });
    return NextResponse.json({ answer, sources: hits.length });
  } catch (err: any) {
    if (err?.message === "UNAUTHENTICATED")
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    console.error("tutor error", err);
    return NextResponse.json({ error: "tutor_failed" }, { status: 500 });
  }
}
