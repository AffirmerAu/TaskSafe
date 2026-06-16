"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EmployerLogo } from "@/components/icons";

function AuthError() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "unknown";

  return (
    <div className="app">
      <div className="scroll">
        <div className="landing">
          <div className="landing__top"><EmployerLogo /></div>
          <div className="landing__hero">
            <div className="landing__eyebrow">Sign-in problem</div>
            <h1>Your link didn't work</h1>
            <p className="landing__lead">
              This usually means the link has expired (they last 1 hour) or has already been used.
            </p>
          </div>

          <div style={{ padding: "0 22px" }}>
            <div style={{
              padding: 16, borderRadius: "var(--r-md)",
              background: "#fef3c7", border: "1.5px solid #fcd34d",
              font: "500 13px/1.6 var(--font-body)", color: "#92400e",
              marginBottom: 16,
            }}>
              <b>Error code:</b> {reason}
            </div>
          </div>

          <div className="landing__foot">
            <a className="btn btn--primary" href="/">
              Try again
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return <Suspense><AuthError /></Suspense>;
}
