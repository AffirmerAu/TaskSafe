import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Map ISO codes → Azure Neural voices. Extend as you add languages.
const AZURE_VOICE: Record<string, string> = {
  en: "en-AU-NatashaNeural",
  zh: "zh-CN-XiaoxiaoNeural",
  vi: "vi-VN-HoaiMyNeural",
  ar: "ar-SA-ZariyahNeural",
  es: "es-ES-ElviraNeural",
  tl: "fil-PH-BlessicaNeural",
  pa: "pa-IN-OjasNeural",
  hi: "hi-IN-SwaraNeural",
};

/**
 * POST /api/tts  Body: { text, lang }
 * Used ONLY for dynamic Q&A answers. Fixed lesson narration is pre-generated
 * once per language and served from Supabase storage (see scripts/narrate.ts note).
 *
 * Default MVP returns 501 so the client falls back to the free Web Speech API.
 * Set TTS_PROVIDER=azure + Azure keys to synthesise server-side.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (process.env.TTS_PROVIDER !== "azure") {
    return NextResponse.json({ error: "tts_disabled", useWebSpeech: true }, { status: 501 });
  }

  const { text, lang = "en" } = await req.json();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const region = process.env.AZURE_SPEECH_REGION;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!region || !key)
    return NextResponse.json({ error: "azure_not_configured" }, { status: 500 });

  const voice = AZURE_VOICE[lang] ?? AZURE_VOICE.en;
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='${lang}' name='${voice}'>${escapeXml(
    text
  )}</voice></speak>`;

  const res = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );
  if (!res.ok) return NextResponse.json({ error: "azure_failed" }, { status: 502 });

  return new NextResponse(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );
}
