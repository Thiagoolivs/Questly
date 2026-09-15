import React from "react";

const TONES = {
  neutral: { background: "var(--surface-pill)", color: "var(--text-primary)", border: "1px solid transparent" },
  outline: { background: "transparent", color: "var(--blue-300)", border: "1px solid var(--blue-400)" },
  accent: { background: "var(--blue-glow)", color: "var(--text-on-accent)", border: "1px solid transparent" },
  success: { background: "var(--success-bg)", color: "var(--success)", border: "1px solid transparent" },
  danger: { background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid transparent" },
  light: { background: "var(--surface-inverse)", color: "var(--text-on-light)", border: "1px solid transparent" },
};

export default function Badge({ children, tone = "neutral", caps = false, style, ...rest }) {
  return (
    <span
      {...rest}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
        height: 22, padding: "0 9px", borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-ui)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-medium)",
        textTransform: caps ? "uppercase" : "none", letterSpacing: caps ? "var(--ls-caps)" : "var(--ls-body)",
        whiteSpace: "nowrap", ...TONES[tone], ...style,
      }}
    >
      {children}
    </span>
  );
}
