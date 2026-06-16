"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, EmployerLogo, PoweredBy } from "@/components/icons";
import { LANGS } from "@/lib/languages";
import { createClient } from "@/lib/supabase-browser";

export default function Landing() {
  const router = useRouter();
  const [code, setCode] = useState("en");
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);
  const [authed, setAuthed] = useState(false);
  const t = LANGS.find((l) => l.code === code) || LANGS[0];

  // If the worker arrived via their magic link, their session is live —
  // pull their name + role to personalise the ID card.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setAuthed(true);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, language")
        .eq("id", user.id)
        .maybeSingle();
      setProfile({
        name: data?.full_name ?? user.email ?? "Worker",
        role: data?.role ?? "Site worker",
      });
      if (data?.language) setCode(data.language);
    });
  }, []);

  const onStart = () => {
    if (authed) router.push("/course");
    else router.push("/login");
  };

  const initials = (profile?.name ?? "DO")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app">
      <div className="scroll">
        <div className="landing">
          <div className="landing__top">
            <EmployerLogo />
          </div>

          <div className="langstrip">
            {LANGS.map((l) => (
              <button
                key={l.code}
                className="langchip"
                data-on={code === l.code ? 1 : 0}
                dir={l.rtl ? "rtl" : "ltr"}
                onClick={() => setCode(l.code)}
              >
                {l.native}
              </button>
            ))}
          </div>

          <div className="landing__hero" dir={t.rtl ? "rtl" : "ltr"} key={code}>
            <div className="landing__eyebrow">Site Induction</div>
            <h1>{t.heading}</h1>
            <p className="landing__lead" dangerouslySetInnerHTML={{ __html: t.lead }} />
          </div>

          <div className="idcard">
            <div className="idcard__av">{initials}</div>
            <div className="idcard__who">
              <b>{profile?.name ?? "Daniel Okafor"}</b>
              <span>{profile?.role ?? "Traffic Controller · Northbridge Site 4"}</span>
            </div>
            <div className="idcard__secure">
              <Icon name="check" size={12} stroke={3} /> {authed ? "Verified" : "Sign in"}
            </div>
          </div>

          <div className="landing__foot">
            <button className="btn btn--primary" onClick={onStart}>
              {t.btn} <Icon name="arrow-right" size={18} stroke={2.4} />
            </button>
            <div className="landing__sec">
              <Icon name="shield" size={13} /> Signed in securely via your link
            </div>
            <PoweredBy />
          </div>
        </div>
      </div>
    </div>
  );
}
