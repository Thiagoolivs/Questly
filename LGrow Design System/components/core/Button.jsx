import React from "react";
import { Icon } from "./Icon.jsx";

const SURFACES = {
  primary: { background: "var(--surface-inverse)", color: "var(--text-on-light)", border: "1px solid transparent" },
  accent: { background: "var(--blue-glow)", color: "var(--text-on-accent)", border: "1px solid transparent" },
  secondary: { background: "var(--surface-input)", color: "var(--text-primary)", border: "1px solid transparent" },
  ghost: { background: "transparent", color: "var(--text-primary)", border: "var(--border-strong)" },
  glass: { background: "var(--surface-pill)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "var(--blur-glass)" },
};

const SIZES = {
  sm: { height: "var(--control-h-sm)", padding: "0 14px", fontSize: "var(--fs-body-sm)", borderRadius: "var(--radius-pill)" },
  md: { height: "var(--control-h)", padding: "0 18px", fontSize: "var(--fs-body)", borderRadius: "var(--radius-sm)" },
  lg: { height: "var(--control-h-lg)", padding: "0 22px", fontSize: "var(--fs-body)", borderRadius: "var(--radius-sm)" },
};

export function Button({
  children, variant = "primary", size = "md", fullWidth = false, pill = false,
  iconLeft, iconRight, disabled = false, style, onClick, ...rest
}) {
  const [down, setDown] = React.useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      {...rest}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: "var(--space-4)", fontFamily: "var(--font-ui)", fontWeight: "var(--fw-medium)",
        letterSpacing: "var(--ls-body)", cursor: disabled ? "default" : "pointer",
        width: fullWidth ? "100%" : undefined, opacity: disabled ? 0.4 : 1,
        transform: down && !disabled ? "scale(var(--press-scale))" : "scale(1)",
        transition: "transform var(--dur-instant) var(--ease-standard), opacity var(--dur-fast) var(--ease-standard)",
        WebkitTapHighlightColor: "transparent",
        ...SIZES[size], ...SURFACES[variant],
        borderRadius: pill ? "var(--radius-pill)" : SIZES[size].borderRadius,
        ...style,
      }}
    >
      {iconLeft ? <Icon name={iconLeft} size={size === "sm" ? 14 : 18} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 14 : 18} /> : null}
    </button>
  );
}
