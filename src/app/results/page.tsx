"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EmployerLogo, PoweredBy } from "@/components/icons";
import { Icon } from "@/components/icons";

function Results() {
  const params = useSearchParams();
  const correct = Number(params.get("correct") ?? 0);
  const total   = Number(params.get("total")   ?? 2);
  const passed  = params.get("passed") === "1";
  const name    = params.get("name") ?? "";

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="app">
      <div className="scroll">
        <div className="landing">
          <div className="landing__top">
            <EmployerLogo />
          </div>

          {/* Big result indicator */}
          <div style={{ padding: "32px 22px 0", textAlign: "center" }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%", margin: "0 auto 18px",
              background: passed
                ? "color-mix(in srgb, var(--safe, #16a34a) 12%, white)"
                : "color-mix(in srgb, var(--caution, #d97706) 12%, white)",
              border: `3px solid ${passed ? "var(--safe, #16a34a)" : "var(--caution, #d97706)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: passed ? "var(--safe, #16a34a)" : "var(--caution, #d97706)",
            }}>
              <Icon name={passed ? "award" : "rotate"} size={40} stroke={1.8} />
            </div>

            <div className="landing__eyebrow">
              {passed ? "Induction complete" : "Almost there"}
            </div>
            <h1 style={{ margin: "6px 0 8px" }}>
              {passed
                ? `Well done${name ? `, ${name}` : ""}!`
                : "Let's try that again"}
            </h1>
            <p className="landing__lead" style={{ margin: 0 }}>
              {passed
                ? "You've passed your Working at Heights induction. Your certificate has been recorded."
                : "You didn't quite reach the pass mark. Review the material and try again."}
            </p>
          </div>

          {/* Score card */}
          <div style={{ padding: "24px 22px 0" }}>
            <div style={{
              borderRadius: "var(--r-md)", border: "1.5px solid var(--line)",
              overflow: "hidden",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderBottom: "1px solid var(--line)",
              }}>
                <span style={{ font: "500 14px/1 var(--font-body)", color: "var(--ink-700)" }}>
                  Questions correct
                </span>
                <span style={{ font: "700 16px/1 var(--font-head)", color: "var(--ink-900)" }}>
                  {correct} / {total}
                </span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderBottom: "1px solid var(--line)",
              }}>
                <span style={{ font: "500 14px/1 var(--font-body)", color: "var(--ink-700)" }}>
                  Score
                </span>
                <span style={{
                  font: "700 16px/1 var(--font-head)",
                  color: passed ? "var(--safe, #16a34a)" : "var(--caution, #d97706)",
                }}>
                  {pct}%
                </span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px",
              }}>
                <span style={{ font: "500 14px/1 var(--font-body)", color: "var(--ink-700)" }}>
                  Pass mark
                </span>
                <span style={{ font: "700 16px/1 var(--font-head)", color: "var(--ink-900)" }}>
                  80%
                </span>
              </div>
            </div>
          </div>

          <div className="landing__foot" style={{ marginTop: 28 }}>
            {passed ? (
              <div style={{
                padding: "14px 16px", borderRadius: "var(--r-md)",
                background: "color-mix(in srgb, var(--safe,#16a34a) 8%, white)",
                border: "1.5px solid color-mix(in srgb, var(--safe,#16a34a) 25%, white)",
                font: "500 13.5px/1.5 var(--font-body)", color: "var(--ink-700)",
                textAlign: "center",
              }}>
                ✅ Your completion has been recorded. You may now proceed to site.
              </div>
            ) : (
              <a className="btn btn--primary" href="/lesson/heights">
                Retry induction <Icon name="rotate" size={18} stroke={2.2} />
              </a>
            )}
            <PoweredBy />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <Results />
    </Suspense>
  );
}
