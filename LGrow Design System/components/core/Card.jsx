import React from "react";

const TONES = {
  card: { background: "var(--surface-card)", border: "var(--border-card)" },
  raised: { background: "var(--surface-raised)", border: "var(--border-card)" },
  glass: { background: "var(--surface-glass)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "var(--blur-glass)" },
  accent: { background: "var(--blue-glow)", border: "1px solid transparent" },
  bloom: { background: "var(--surface-card)", border: "var(--border-card)" },
  light: { background: "var(--surface-inverse)", border: "1px solid transparent", color: "var(--text-on-light)" },
};

export function Card({ children, tone = "card", radius = "var(--radius-xl)", pad = "var(--pad-card)", glow = false, style, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        position: "relative", borderRadius: radius, padding: pad, overflow: "hidden",
        color: "var(--text-primary)", boxShadow: glow ? "var(--glow-soft)" : undefined,
        ...TONES[tone], ...style,
      }}
    >
      {tone === "bloom" ? (
        <div style={{ position: "absolute", inset: 0, background: "var(--bg-card-bloom)", pointerEvents: "none" }} />
      ) : null}
      <div style={{ position: "relative", height: "100%" }}>{children}</div>
    </div>
  );
}
