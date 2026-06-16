import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * POST /api/stt  (multipart form-data, field "audio")
 * Transcribes a recorded voice question.
 *
 * Default MVP returns 501 so the client uses the free in-browser
 * SpeechRecognition API. Set STT_PROVIDER=whisper|deepgram to transcribe
 * server-side (e.g. for browsers without Web Speech, like Firefox).
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const provider = process.env.STT_PROVIDER ?? "webspeech";
  if (provider === "webspeech") {
    return NextResponse.json({ error: "stt_disabled", useWebSpeech: true }, { status: 501 });
  }

  const form = await req.formData();
  const audio = form.get("audio") as File | null;
  if (!audio) return NextResponse.json({ error: "audio required" }, { status: 400 });

  try {
    if (provider === "whisper") {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return NextResponse.json({ error: "openai_not_configured" }, { status: 500 });
      const fd = new FormData();
      fd.append("file", audio, "question.webm");
      fd.append("model", "whisper-1");
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: fd,
      });
      const json = await res.json();
      return NextResponse.json({ text: json.text ?? "" });
    }

    if (provider === "deepgram") {
      const key = process.env.DEEPGRAM_API_KEY;
      if (!key) return NextResponse.json({ error: "deepgram_not_configured" }, { status: 500 });
      const buf = Buffer.from(await audio.arrayBuffer());
      const res = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&detect_language=true",
        {
          method: "POST",
          headers: { Authorization: `Token ${key}`, "Content-Type": audio.type || "audio/webm" },
          body: buf,
        }
      );
      const json = await res.json();
      const text = json?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: "unknown_provider" }, { status: 400 });
  } catch (err) {
    console.error("stt error", err);
    return NextResponse.json({ error: "stt_failed" }, { status: 500 });
  }
}
