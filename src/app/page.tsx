"use client";

import { useState } from "react";
import { Icon, EmployerLogo, PoweredBy } from "@/components/icons";
import { createClient } from "@/lib/supabase-browser";

export default function Landing() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [sent, setSent]           = useState(false);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const valid = firstName.trim() && lastName.trim() && /\S+@\S+\.\S+/.test(email);

  const sendLink = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
        },
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const inputStyle: React.CSSProperties = {
    height: 52,
    borderRadius: "var(--r-md)",
    border: "1.5px solid var(--line)",
    padding: "0 16px",
    font: "500 16px/1 var(--font-body)",
    color: "var(--ink-900)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className="app">
      <div className="scroll">
        <div className="landing">
          <div className="landing__top">
            <EmployerLogo />
          </div>

          <div className="landing__hero">
            <div className="landing__eyebrow">Site Safety Induction</div>
            <h1>{sent ? "Check your email" : "Sign in to start"}</h1>
            <p className="landing__lead">
              {sent
                ? `We've sent a secure sign-in link to ${email}. Open it on this device to begin your induction.`
                : "Enter your details and we'll email you a secure link — no password needed."}
            </p>
          </div>

          {!sent && (
            <div style={{ padding: "4px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                  autoComplete="given-name"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={inputStyle}
                  autoComplete="family-name"
                />
              </div>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendLink()}
                style={inputStyle}
              />
              {error && (
                <div style={{ color: "var(--danger)", font: "500 13px/1.4 var(--font-body)" }}>
                  {error}
                </div>
              )}
              <button className="btn btn--primary" onClick={sendLink} disabled={busy || !valid}>
                {busy ? "Sending…" : "Send my sign-in link"}
                <Icon name="arrow-right" size={18} stroke={2.4} />
              </button>
            </div>
          )}

          {sent && (
            <div style={{ padding: "0 22px" }}>
              <div style={{
                padding: 18, borderRadius: "var(--r-md)",
                background: "color-mix(in srgb, var(--accent) 8%, white)",
                border: "1.5px solid color-mix(in srgb, var(--accent) 25%, white)",
                font: "500 14px/1.6 var(--font-body)", color: "var(--ink-700)",
              }}>
                📧 Can't find the email? Check your spam folder, or{" "}
                <button
                  onClick={() => { setSent(false); setError(null); }}
                  style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0, textDecoration: "underline" }}
                >
                  try again
                </button>.
              </div>
            </div>
          )}

          <div className="landing__foot" style={{ marginTop: 24 }}>
            <div className="landing__sec">
              <Icon name="shield" size={13} /> Passwordless · secure sign-in via your link
            </div>
            <PoweredBy />
          </div>
        </div>
      </div>
    </div>
  );
}
