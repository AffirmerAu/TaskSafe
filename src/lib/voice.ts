"use client";

// Free, in-browser Text-to-Speech and Speech-to-Text. No keys, no cost.
// If you enable Azure/Whisper server-side later, swap speak()/listen() to hit
// /api/tts and /api/stt — the call sites don't change.

const BCP47: Record<string, string> = {
  en: "en-AU",
  zh: "zh-CN",
  vi: "vi-VN",
  ar: "ar-SA",
  es: "es-ES",
  tl: "fil-PH",
  pa: "pa-IN",
  hi: "hi-IN",
};

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, lang = "en") {
  if (!ttsSupported() || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = BCP47[lang] ?? "en-AU";
  u.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang?.toLowerCase().startsWith((BCP47[lang] ?? "en").slice(0, 2)));
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

type SR = any;
export function sttSupported() {
  return (
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
}

/** Start a one-shot recognition. Returns a stop() function. */
export function listen(
  lang: string,
  onResult: (text: string) => void,
  onEnd?: () => void
): () => void {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) {
    onEnd?.();
    return () => {};
  }
  const rec: SR = new Ctor();
  rec.lang = BCP47[lang] ?? "en-AU";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
  rec.onerror = () => onEnd?.();
  rec.onend = () => onEnd?.();
  rec.start();
  return () => rec.stop();
}
