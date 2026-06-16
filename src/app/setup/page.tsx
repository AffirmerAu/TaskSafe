"use client";

import { useEffect, useState } from "react";
import { Icon, PoweredBy } from "@/components/icons";

type Status = {
  env: { supabaseUrl: boolean; supabaseAnon: boolean; serviceRole: boolean; gemini: boolean };
  envReady: boolean;
  schema: boolean;
  seeded: boolean;
  embedded: boolean;
  secretRequired: boolean;
  ready: boolean;
};

function Check({ ok, children }: { ok: boolean | "pending"; children: React.ReactNode }) {
  const color = ok === true ? "var(--ok, #16a34a)" : ok === "pending" ? "var(--ink-300, #9aa4b2)" : "var(--danger, #dc2626)";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0" }}>
      <span style={{ color, marginTop: 1, flex: "0 0 auto" }}>
        <Icon name={ok === true ? "check" : ok === "pending" ? "clock" : "x"} size={18} stroke={2.6} />
      </span>
      <span style={{ font: "500 14px/1.5 var(--font-body)", color: "var(--ink-900)" }}>{children}</span>
    </div>
  );
}

export default function Setup() {
  const [status, setStatus] = useState<Status | null>(null);
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/status", { cache: "no-store" });
      setStatus(await r.json());
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runSetup = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), key: secret || undefined }),
      });
      const data = await r.json();
      if (data.ok) {
        setMsg({ kind: "ok", text: data.next || "All set!" });
        await load();
      } else {
        setMsg({ kind: "err", text: data.error || "Something went wrong." });
        await load();
      }
    } catch {
      setMsg({ kind: "err", text: "Could not reach the server. Try again in a moment." });
    } finally {
      setBusy(false);
    }
  };

  const envOk = status?.envReady ?? false;
  const schemaOk = status?.schema ?? false;
  const canRun = envOk && schemaOk && !busy && /\S+@\S+\.\S+/.test(email);

  return (
    <div className="app">
      <div className="scroll">
        <div style={{ padding: "32px 22px 40px" }}>
          <div className="landing__eyebrow">Setup</div>
          <h1 style={{ font: "700 26px/1.2 var(--font-head)", margin: "6px 0 6px", color: "var(--ink-900)" }}>
            Get your app ready
          </h1>
          <p className="landing__lead" style={{ margin: 0 }}>
            One quick step to load the training course. This page checks everything for you.
          </p>

          {status?.ready ? (
            <div
              style={{
                marginTop: 22, padding: 18, borderRadius: "var(--r-md)",
                background: "color-mix(in srgb, var(--ok, #16a34a) 10%, white)",
                border: "1.5px solid color-mix(in srgb, var(--ok, #16a34a) 35%, white)",
              }}
            >
              <div style={{ font: "700 16px/1.3 var(--font-head)", color: "var(--ink-900)" }}>
                ✅ Your app is ready
              </div>
              <p style={{ font: "500 14px/1.5 var(--font-body)", color: "var(--ink-700, #4a5568)", margin: "6px 0 14px" }}>
                The course is loaded. Sign in to start the induction.
              </p>
              <a className="btn btn--primary" href="/login">
                Go to login <Icon name="arrow-right" size={18} stroke={2.4} />
              </a>
            </div>
          ) : (
            <>
              <div
                style={{
                  marginTop: 22, padding: "4px 18px", borderRadius: "var(--r-md)",
                  border: "1.5px solid var(--line)", background: "white",
                }}
              >
                <Check ok={status ? envOk : "pending"}>
                  {envOk
                    ? "Connection keys found"
                    : "Add your 4 keys in Vercel (Supabase URL, anon key, service-role key, Gemini key), then redeploy"}
                </Check>
                <div style={{ height: 1, background: "var(--line)" }} />
                <Check ok={status ? schemaOk : "pending"}>
                  {schemaOk
                    ? "Database tables created"
                    : "Open the Supabase SQL Editor, paste the contents of setup.sql, and click Run"}
                </Check>
                <div style={{ height: 1, background: "var(--line)" }} />
                <Check ok={status ? status.seeded && status.embedded : "pending"}>
                  {status?.seeded && status?.embedded
                    ? "Course loaded"
                    : "Course not loaded yet — use the button below"}
                </Check>
              </div>

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ font: "600 13px/1 var(--font-body)", color: "var(--ink-700, #4a5568)" }}>
                  Email you'll log in with
                </label>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    height: 52, borderRadius: "var(--r-md)", border: "1.5px solid var(--line)",
                    padding: "0 16px", font: "500 16px/1 var(--font-body)", color: "var(--ink-900)", outline: "none",
                  }}
                />

                {status?.secretRequired && (
                  <>
                    <label style={{ font: "600 13px/1 var(--font-body)", color: "var(--ink-700, #4a5568)", marginTop: 4 }}>
                      Setup password (your SEED_SECRET)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      style={{
                        height: 52, borderRadius: "var(--r-md)", border: "1.5px solid var(--line)",
                        padding: "0 16px", font: "500 16px/1 var(--font-body)", color: "var(--ink-900)", outline: "none",
                      }}
                    />
                  </>
                )}

                <button className="btn btn--primary" onClick={runSetup} disabled={!canRun}>
                  {busy ? "Setting up…" : "Set up my app"}
                  {!busy && <Icon name="arrow-right" size={18} stroke={2.4} />}
                </button>
                {!envOk && status && (
                  <p style={{ font: "500 12.5px/1.5 var(--font-body)", color: "var(--ink-500, #6b7280)", margin: 0 }}>
                    Finish the steps above first. After adding keys in Vercel, redeploy and refresh this page.
                  </p>
                )}
              </div>
            </>
          )}

          {msg && (
            <div
              style={{
                marginTop: 16, padding: 14, borderRadius: "var(--r-md)",
                font: "500 13.5px/1.5 var(--font-body)",
                color: msg.kind === "ok" ? "var(--ink-900)" : "var(--danger, #dc2626)",
                background: msg.kind === "ok"
                  ? "color-mix(in srgb, var(--ok, #16a34a) 8%, white)"
                  : "color-mix(in srgb, var(--danger, #dc2626) 8%, white)",
                border: `1.5px solid ${msg.kind === "ok" ? "color-mix(in srgb, var(--ok,#16a34a) 30%, white)" : "color-mix(in srgb, var(--danger,#dc2626) 30%, white)"}`,
              }}
            >
              {msg.text}
            </div>
          )}

          <div style={{ marginTop: 28 }}>
            <PoweredBy />
          </div>
        </div>
      </div>
    </div>
  );
}
