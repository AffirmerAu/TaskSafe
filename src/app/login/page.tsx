"use client";

import { useState } from "react";
import { Icon, EmployerLogo, PoweredBy } from "@/components/icons";
import { createClient } from "@/lib/supabase-browser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendLink = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/confirm`,
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="app">
      <div className="scroll">
        <div className="landing">
          <div className="landing__top">
            <EmployerLogo />
          </div>

          <div className="landing__hero" style={{ marginTop: 28 }}>
            <div className="landing__eyebrow">Site Induction</div>
            <h1>{sent ? "Check your email" : "Sign in to start"}</h1>
            <p className="landing__lead">
              {sent
                ? "We sent you a secure sign-in link. Open it on this device to begin your induction."
                : "Enter your email and we'll send you a secure link — no password needed."}
            </p>
          </div>

          {!sent && (
            <div style={{ padding: "20px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendLink()}
                style={{
                  height: 52,
                  borderRadius: "var(--r-md)",
                  border: "1.5px solid var(--line)",
                  padding: "0 16px",
                  font: "500 16px/1 var(--font-body)",
                  color: "var(--ink-900)",
                  outline: "none",
                }}
              />
              {error && (
                <div style={{ color: "var(--danger)", font: "500 13px/1.4 var(--font-body)" }}>
                  {error}
                </div>
              )}
              <button className="btn btn--primary" onClick={sendLink} disabled={busy || !email}>
                {busy ? "Sending…" : "Send magic link"}
                <Icon name="arrow-right" size={18} stroke={2.4} />
              </button>
            </div>
          )}

          <div className="landing__foot" style={{ marginTop: 24 }}>
            <div className="landing__sec">
              <Icon name="shield" size={13} /> Passwordless · signed in securely via your link
            </div>
            <PoweredBy />
          </div>
        </div>
      </div>
    </div>
  );
}
