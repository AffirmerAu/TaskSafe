"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, EmployerLogo, PoweredBy } from "@/components/icons";
import { LANGS } from "@/lib/languages";
import { createClient } from "@/lib/supabase-browser";

export default function Welcome() {
  const router = useRouter();
  const [name, setName] = useState("there");
  const [lang, setLang] = useState("en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("first_name, full_name, language")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.first_name) setName(data.first_name);
      else if (data?.full_name) setName(data.full_name.split(" ")[0]);
      if (data?.language) setLang(data.language);
    });
  }, [router]);

  const start = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, language: lang }, { onConflict: "id" });
    }
    router.push("/lesson/heights");
  };

  const t = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div className="app">
      <div className="scroll">
        <div className="landing">
          <div className="landing__top">
            <EmployerLogo />
          </div>

          {/* Greeting */}
          <div className="landing__hero">
            <div className="landing__eyebrow">Welcome, {name}</div>
            <h1>You are invited to complete your safety induction</h1>
            <p className="landing__lead">
              Before you start work on site, you need to complete this short safety
              induction. It takes about 6 minutes and covers working at heights.
            </p>
          </div>

          {/* Language picker */}
          <div style={{ padding: "0 22px" }}>
            <div style={{ font: "600 13px/1 var(--font-body)", color: "var(--ink-500)", marginBottom: 10 }}>
              Choose your language
            </div>
            <div className="langstrip" style={{ flexWrap: "wrap", gap: 8 }}>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className="langchip"
                  data-on={lang === l.code ? 1 : 0}
                  dir={l.rtl ? "rtl" : "ltr"}
                  onClick={() => setLang(l.code)}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          {/* What to expect */}
          <div style={{ padding: "20px 22px 0" }}>
            <div style={{
              borderRadius: "var(--r-md)", border: "1.5px solid var(--line)",
              overflow: "hidden",
            }}>
              {[
                { icon: "clock",    text: "6 minutes to complete" },
                { icon: "layers",   text: "3 short knowledge checks" },
                { icon: "award",    text: "Certificate when you pass" },
              ].map(({ icon, text }, idx) => (
                <div key={icon} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px",
                  borderTop: idx > 0 ? "1px solid var(--line)" : undefined,
                  font: "500 14px/1 var(--font-body)", color: "var(--ink-700)",
                }}>
                  <span style={{ color: "var(--accent)" }}>
                    <Icon name={icon} size={18} stroke={2} />
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="landing__foot" style={{ marginTop: 24 }}>
            <button className="btn btn--primary" onClick={start} disabled={saving}>
              {saving ? "Starting…" : t.btn}
              <Icon name="arrow-right" size={18} stroke={2.4} />
            </button>
            <div className="landing__sec">
              <Icon name="shield" size={13} /> Your progress is saved automatically
            </div>
            <PoweredBy />
          </div>
        </div>
      </div>
    </div>
  );
}
