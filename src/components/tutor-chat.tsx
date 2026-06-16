"use client";

import { useRef, useState } from "react";
import { Icon, BotAvatar } from "@/components/icons";
import { speak, stopSpeaking, listen, sttSupported } from "@/lib/voice";

type Msg = { role: "user" | "bot"; text: string };

export default function TutorChat({
  courseId,
  lang,
  open,
  onClose,
}: {
  courseId: string;
  lang: string;
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Ask me anything about this induction. You can type or tap the mic and speak.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const stopRec = useRef<() => void>(() => {});
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, courseId, lang }),
      });
      const data = await res.json();
      const answer =
        res.ok && data.answer
          ? data.answer
          : data.error === "rate_limited"
          ? "Let's slow down a moment — try again in a few seconds."
          : "Sorry, I couldn't answer that just now.";
      setMessages((m) => [...m, { role: "bot", text: answer }]);
      if (res.ok && data.answer) speak(answer, lang);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Network error — please try again." }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
      );
    }
  };

  const toggleMic = () => {
    if (recording) {
      stopRec.current();
      setRecording(false);
      return;
    }
    stopSpeaking();
    setRecording(true);
    stopRec.current = listen(
      lang,
      (text) => {
        setRecording(false);
        ask(text);
      },
      () => setRecording(false)
    );
  };

  if (!open) return null;

  return (
    <div className="tutor-overlay" onClick={onClose}>
      <div className="tutor-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="tutor-head">
          <BotAvatar size="sm" />
          <div className="tutor-head__t">
            <b>Affirmer Guide</b>
            <span>Answers from this course</span>
          </div>
          <button className="appbar__back" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="tutor-thread" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={"tutor-msg tutor-msg--" + m.role}>
              {m.role === "bot" && <BotAvatar size="sm" />}
              <div className="tutor-bubble">{m.text}</div>
            </div>
          ))}
          {busy && (
            <div className="tutor-msg tutor-msg--bot">
              <BotAvatar size="sm" />
              <div className="tutor-bubble tutor-bubble--typing">…</div>
            </div>
          )}
        </div>

        <div className="tutor-composer">
          {sttSupported() && (
            <button
              className="mic"
              data-rec={recording ? 1 : 0}
              onClick={toggleMic}
              aria-label="Ask by voice"
            >
              <Icon name="mic" size={20} />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder={recording ? "Listening…" : "Ask a question…"}
            disabled={busy}
          />
          <button
            className="btn btn--primary tutor-send"
            onClick={() => ask(input)}
            disabled={busy || !input.trim()}
            aria-label="Send"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
