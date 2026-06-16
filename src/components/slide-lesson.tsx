"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import TutorChat from "@/components/tutor-chat";
import { speak, stopSpeaking } from "@/lib/voice";
import { createClient } from "@/lib/supabase-browser";

export type Slide = {
  id: string;
  position: number;
  kind: "mode" | "video" | "content" | "question" | "doc";
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  media_url: string | null;
  vimeo_id: string | null;
  narration_url: string | null;
  progress_pct: number;
  payload: any;
};

const LANG_LABEL: Record<string, string> = {
  en: "EN", zh: "中文", vi: "VI", ar: "ع", es: "ES", tl: "TL", pa: "ਪੰ", hi: "हि",
};

// ── In-slide read-aloud control (free Web Speech) ───────────────
function ReadAloud({ text, lang, label = "Listen", autoplay = false }: {
  text: string; lang: string; label?: string; autoplay?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (autoplay && text) {
      setPlaying(true);
      speak(text, lang);
      const t = setTimeout(() => setPlaying(false), Math.max(3000, text.length * 70));
      return () => clearTimeout(t);
    }
  }, [autoplay, text, lang]);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) { stopSpeaking(); setPlaying(false); }
    else { speak(text, lang); setPlaying(true); setTimeout(() => setPlaying(false), Math.max(3000, text.length * 70)); }
  };
  return (
    <button className="listen" data-playing={playing ? 1 : 0} onClick={toggle} aria-label="Read aloud">
      <span className="listen__ic"><Icon name={playing ? "pause" : "sound"} size={11} /></span>
      <span className="listen__lbl">{playing ? "Playing" : label}</span>
      <span className="listen__wave">{Array.from({ length: 5 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}</span>
    </button>
  );
}

function ModeToggle({ audio, onSet }: { audio: boolean; onSet: (a: boolean) => void }) {
  return (
    <div className="modetoggle" role="group" aria-label="Learning mode">
      <button data-on={audio ? 1 : 0} onClick={() => onSet(true)}><Icon name="sound" size={14} /> Audio</button>
      <button data-on={!audio ? 1 : 0} onClick={() => onSet(false)}><b>Aa</b> Text</button>
    </div>
  );
}

// ── Simulated player (no Vimeo) — matches the design exactly ─────
function SimVideo({ slide, audioMode, onComplete }: { slide: Slide; audioMode: boolean; onComplete: () => void }) {
  const total = slide.payload?.totalSecs || 134;
  const caps: string[] = slide.payload?.captions || [];
  const [playing, setPlaying] = useState(false);
  const [cc, setCc] = useState(true);
  const [t, setT] = useState(0);
  const fired = useRef(false);
  useEffect(() => { if (audioMode) setPlaying(true); }, [audioMode]);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setT((s) => Math.min(total, s + 3)), 760);
    return () => clearInterval(iv);
  }, [playing, total]);
  const ended = t >= total;
  useEffect(() => { if (ended) { setPlaying(false); if (!fired.current) { fired.current = true; onComplete(); } } }, [ended, onComplete]);
  const capIdx = caps.length ? Math.min(caps.length - 1, Math.floor((t / total) * caps.length)) : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const onTap = () => { if (ended) { setT(0); fired.current = true; setPlaying(true); } else setPlaying((p) => !p); };
  return (
    <div className="lvideo">
      <div className="lvideo__media" style={{ backgroundImage: `url(${slide.media_url})` }} onClick={onTap}>
        <div className="lvideo__scrim" />
        <div className="lvideo__top">
          <span className="lvideo__rec"><span className="recdot" /> {slide.payload?.badge || "True story"}</span>
          <button className="lvideo__cc" data-on={cc ? 1 : 0} onClick={(e) => { e.stopPropagation(); setCc((c) => !c); }}><Icon name="sound" size={12} /> CC</button>
        </div>
        <div className="lvideo__big" data-hidden={playing ? 1 : 0}><Icon name={ended ? "rotate" : "play"} size={30} /></div>
        {caps.length > 0 && <div className="lvideo__cap" data-off={cc ? 0 : 1}><span>{caps[capIdx]}</span></div>}
        <div className="lvideo__bar">
          <button className="lvideo__pp" onClick={(e) => { e.stopPropagation(); onTap(); }}><Icon name={ended ? "rotate" : playing ? "pause" : "play"} size={15} /></button>
          <div className="lvideo__track"><i style={{ width: (t / total) * 100 + "%" }} /></div>
          <span className="lvideo__time">{ended ? <span className="lvideo__done"><Icon name="check" size={12} stroke={3} /> Done</span> : fmt(t)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Real Vimeo embed (privacy params). Enables advance after a dwell. ──
// For exact 95%-watched detection, add @vimeo/player and listen to timeupdate.
function VimeoVideo({ slide, onComplete }: { slide: Slide; onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 8000); // minimum dwell; replace with Player SDK event
    return () => clearTimeout(t);
  }, [onComplete]);
  const src = `https://player.vimeo.com/video/${slide.vimeo_id}?dnt=1&title=0&byline=0&portrait=0&pip=0`;
  return (
    <div className="lvideo">
      <div className="lvideo__media" style={{ background: "#000" }}>
        <iframe
          src={src}
          allow="autoplay; fullscreen; picture-in-picture"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          title={slide.title || "Lesson video"}
        />
      </div>
    </div>
  );
}

export default function SlideLesson({
  slides, courseId, lessonId, initialLang,
}: {
  slides: Slide[]; courseId: string; lessonId: string; initialLang: string;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [audioMode, setAudioMode] = useState<boolean | null>(null);
  const [lang, setLang] = useState(initialLang || "en");
  const [videoDone, setVideoDone] = useState(false);
  const [fb, setFb] = useState<{ ok: boolean; html: string } | null>(null);
  const [dir, setDir] = useState("fwd");
  const [tutorOpen, setTutorOpen] = useState(false);

  const slide = slides[i];
  const audio = !!audioMode;
  const showToggle = audioMode !== null;

  const saveProgress = async (idx: number, completed = false) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("progress").upsert(
      { user_id: user.id, lesson_id: lessonId, slide_index: idx, completed, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" }
    );
  };

  const finish = async () => { stopSpeaking(); await saveProgress(slides.length - 1, true); router.push("/course"); };

  const goNext = () => {
    stopSpeaking();
    const next = slides[i + 1];
    if (!next) { finish(); return; }
    if (next.kind === "video") setVideoDone(false);
    setDir("fwd"); setI(i + 1); saveProgress(i + 1);
  };

  const chooseMode = (isAudio: boolean) => { setAudioMode(isAudio); goNext(); };

  const answer = (key: string) => {
    const q = slide.payload;
    const ok = key === q.correct;
    if (q.last && ok) { finish(); return; }
    setFb({ ok, html: ok ? q.okHtml : q.noHtml });
  };
  const clearFb = () => { setFb(null); goNext(); };

  if (!slide) return null;
  const prog = slide.progress_pct ?? Math.round(((i + 1) / slides.length) * 100);

  // ── render media + sheet for current slide ──
  let media: React.ReactNode = null;
  let sheet: React.ReactNode = null;
  let key = slide.kind + i;

  if (fb) {
    media = (
      <div className={"lslide__media lslide__media--fb " + (fb.ok ? "is-ok" : "is-no")}>
        <div className="fbbig"><Icon name={fb.ok ? "check" : "rotate"} size={48} stroke={2.6} /></div>
      </div>
    );
    sheet = (
      <div className="lslide__sheet">
        <div className="lslide__eyebrow" style={{ color: fb.ok ? "var(--safe)" : "var(--caution)" }}>
          {fb.ok ? "Correct" : "Let's check that"}
        </div>
        <div className="lslide__text" dangerouslySetInnerHTML={{ __html: fb.html }} />
        <ReadAloud text={stripHtml(fb.html)} lang={lang} autoplay={audio} />
        <button className="btn btn--primary lslide__btn" onClick={clearFb}>
          Continue <Icon name="arrow-right" size={18} stroke={2.4} />
        </button>
      </div>
    );
    key = "fb" + i;
  } else if (slide.kind === "mode") {
    media = <SlideMedia slide={slide} />;
    sheet = (
      <div className="lslide__sheet">
        <div className="lslide__eyebrow">{slide.eyebrow}</div>
        <div className="lslide__title">{slide.title}</div>
        <div className="lslide__text">{slide.body}</div>
        <div className="modechoice" style={{ marginTop: 14 }}>
          <button className="modechoice__opt modechoice__opt--audio" onClick={() => chooseMode(true)}>
            <span className="modechoice__ic"><Icon name="sound" size={24} /></span>
            <span className="modechoice__t"><b>Listen &amp; speak</b><span>I read it out loud. You talk.</span></span>
          </button>
          <button className="modechoice__opt" onClick={() => chooseMode(false)}>
            <span className="modechoice__ic modechoice__ic--text">Aa</span>
            <span className="modechoice__t"><b>Read &amp; tap</b><span>Read on screen. Tap to answer.</span></span>
          </button>
        </div>
      </div>
    );
  } else if (slide.kind === "video") {
    media = (
      <div className="lslide__media">
        {slide.vimeo_id
          ? <VimeoVideo slide={slide} onComplete={() => setVideoDone(true)} />
          : <SimVideo slide={slide} audioMode={audio} onComplete={() => setVideoDone(true)} />}
      </div>
    );
    sheet = (
      <div className="lslide__sheet lslide__sheet--compact">
        <div className="lslide__eyebrow">{slide.eyebrow}</div>
        <div className="lslide__text">{slide.body}</div>
        <button className="btn btn--primary lslide__btn" disabled={!videoDone} onClick={goNext}>
          <Icon name="check" size={18} stroke={2.6} /> I understand
        </button>
      </div>
    );
  } else if (slide.kind === "content") {
    media = <SlideMedia slide={slide} square />;
    sheet = (
      <div className="lslide__sheet">
        <div className="lslide__eyebrow">{slide.eyebrow}</div>
        <div className="lslide__title">{slide.title}</div>
        <div className="lslide__text">{slide.body}</div>
        <ReadAloud text={[slide.title, slide.body].filter(Boolean).join(". ")} lang={lang} autoplay={audio} />
        <button className="btn btn--primary lslide__btn" onClick={goNext}>
          <Icon name="check" size={18} stroke={2.6} /> I understand
        </button>
      </div>
    );
  } else if (slide.kind === "doc") {
    media = (
      <div className="lslide__media lslide__media--doc">
        <div className="docbig"><Icon name="file" size={46} /><span>PDF · 6 pages</span></div>
      </div>
    );
    sheet = (
      <div className="lslide__sheet">
        <div className="lslide__eyebrow">{slide.eyebrow}</div>
        <div className="lslide__title">{slide.title}</div>
        <div className="lslide__text">{slide.body}</div>
        <ReadAloud text={[slide.title, slide.body].filter(Boolean).join(". ")} lang={lang} autoplay={audio} />
        <button className="btn btn--primary lslide__btn" onClick={goNext}>
          <Icon name="check" size={18} stroke={2.6} /> I understand
        </button>
      </div>
    );
  } else if (slide.kind === "question") {
    const q = slide.payload;
    media = (
      <div className="lslide__media lslide__media--q">
        <div className="qbig">
          <span className="qbig__n">{q.label || "Question"}</span>
          <span className="qbig__t" dangerouslySetInnerHTML={{ __html: q.text }} />
          {audio && <ReadAloud text={stripHtml(q.text)} lang={lang} autoplay label="Hear again" />}
        </div>
      </div>
    );
    sheet = (
      <div className="lslide__sheet">
        <div className="chips">
          {(q.options || []).map((o: { k: string; label: string }) => (
            <button key={o.k} className="chip" onClick={() => answer(o.k)}>
              <span className="chip__k">{o.k}</span><span>{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="appbar" style={{ paddingBottom: 12 }}>
        <button className="appbar__back" onClick={() => router.push("/course")} aria-label="Back"><Icon name="chevron-left" size={20} /></button>
        <div className="appbar__titles">
          <div className="appbar__eyebrow">Working at Heights</div>
          <div className="appbar__title">Lesson</div>
        </div>
        <div className="appbar__lang" onClick={() => setLang(cycleLang(lang))}>
          <Icon name="globe" size={14} /> {LANG_LABEL[lang] || "EN"}
        </div>
      </div>

      <div className="chat__progress">
        {showToggle && <ModeToggle audio={audio} onSet={setAudioMode} />}
        <div className="pbar"><i style={{ width: prog + "%" }} /></div>
        <div className="lbl">{prog}%</div>
      </div>

      <div className="lesson">
        <div className={"lslide lslide--" + dir} key={key}>
          {media}
          {sheet}
        </div>
      </div>

      <button className="askbtn" onClick={() => setTutorOpen(true)}>
        <Icon name="mic" size={16} /> Ask the guide
      </button>
      <TutorChat courseId={courseId} lang={lang} open={tutorOpen} onClose={() => setTutorOpen(false)} />
    </div>
  );
}

function SlideMedia({ slide, square }: { slide: Slide; square?: boolean }) {
  const cls = "lslide__media" + (square ? " lslide__media--square" : "");
  if (slide.media_url) {
    return (
      <div className={cls} style={{ backgroundImage: `url(${slide.media_url})` }}>
        {slide.payload?.dark && <div className="lslide__imgscrim" />}
      </div>
    );
  }
  return <div className={cls + " lslide__media--brand"} />;
}

function stripHtml(s: string) { return (s || "").replace(/<[^>]+>/g, ""); }
function cycleLang(cur: string) {
  const order = ["en", "zh", "vi", "ar"];
  const idx = order.indexOf(cur);
  return order[(idx + 1) % order.length];
}
