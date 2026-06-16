import React from "react";

const ICON_PATHS: Record<string, string> = {
  play: '<polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/>',
  "chevron-right": '<polyline points="9 6 15 12 9 18"/>',
  "chevron-left": '<polyline points="15 6 9 12 15 18"/>',
  "chevron-down": '<polyline points="6 9 12 15 18 9"/>',
  "arrow-right": '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/>',
  file:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
  layers:
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M9 14.5 8 22l4-2 4 2-1-7.5"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="none"/>',
  "hard-hat":
    '<path d="M3 17h18"/><path d="M4 16a8 8 0 0 1 16 0"/><path d="M10 8.5V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3.5"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><line x1="12" y1="13" x2="12" y2="21"/>',
  sound:
    '<polygon points="4 9 8 9 13 5 13 19 8 15 4 15 4 9" fill="currentColor" stroke="none"/><path d="M16 9a3 3 0 0 1 0 6"/>',
  pause:
    '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  rotate: '<polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2-9.5L1 10"/>',
};

export function Icon({
  name,
  size = 20,
  stroke = 2,
  style,
  className,
}: {
  name: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }}
    />
  );
}

export function BotAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "bot-av bot-av--sm" : size === "lg" ? "bot-av bot-av--lg" : "bot-av";
  return (
    <div className={cls}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/affirmer-tick.gif" alt="Affirmer assistant" />
    </div>
  );
}

export function EmployerLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="emp-logo">
      <div className="emp-logo__mark">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M4 19 L12 5 L20 19" stroke="#f5a623" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 19 L12 12.5 L15.5 19" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!compact && (
        <div className="emp-logo__name">
          <b>Coastline Civil</b>
          <span>Infrastructure</span>
        </div>
      )}
    </div>
  );
}

export function PoweredBy() {
  return (
    <div className="powered">
      <span>Powered by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/affirmer-logo-horizontal.png" alt="Affirmer" />
    </div>
  );
}

export function Ring({
  value = 0,
  size = 56,
  stroke = 6,
  track = "rgba(255,255,255,.25)",
  color = "#fff",
  children,
}: {
  value?: number;
  size?: number;
  stroke?: number;
  track?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="ring__txt">{children}</div>
    </div>
  );
}
