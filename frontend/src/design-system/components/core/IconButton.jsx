import React from "react";
import Icon from "./Icon.jsx";

const TONES = {
  dark: { background: "var(--surface-input)", color: "var(--text-primary)", border: "1px solid transparent" },
  glass: { background: "rgba(120,120,123,.28)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "var(--blur-glass)" },
  light: { background: "var(--surface-inverse)", color: "var(--text-on-light)", border: "1px solid transparent" },
  accent: { background: "var(--blue-glow)", color: "var(--text-on-accent)", border: "1px solid transparent" },
  bare: { background: "transparent", color: "var(--text-secondary)", border: "1px solid transparent" },
};

export default function IconButton({ icon, size = 36, tone = "dark", label, disabled = false, style, ...rest }) {
  const [down, setDown] = React.useState(false);
  return (
    <button
      type="button" aria-label={label || icon} disabled={disabled}
      onPointerDown={() => setDown(true)} onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}
      {...rest}
      style={{
        width: size, height: size, borderRadius: "var(--radius-pill)", display: "inline-flex",
        alignItems: "center", justifyContent: "center", flex: "none",
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
        transform: down && !disabled ? "scale(var(--press-scale))" : "scale(1)",
        transition: "transform var(--dur-instant) var(--ease-standard), opacity var(--dur-fast) var(--ease-standard)",
        WebkitTapHighlightColor: "transparent", ...TONES[tone], ...style,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.45)} />
    </button>
  );
}
