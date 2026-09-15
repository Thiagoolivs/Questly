import React from "react";

const SIZES = { sm: 28, md: 36, lg: 44, xl: 88 };

export function Avatar({ src, initials, name, size = "md", color = "var(--blue-glow)", ring = false, children, style, ...rest }) {
  const px = typeof size === "number" ? size : SIZES[size];
  return (
    <div
      {...rest}
      style={{
        width: px, height: px, borderRadius: "var(--radius-pill)", flex: "none", overflow: "hidden",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: src ? "var(--surface-input)" : color, color: "var(--full-white)",
        fontFamily: "var(--font-ui)", fontSize: Math.max(10, Math.round(px * 0.36)), fontWeight: "var(--fw-semibold)",
        letterSpacing: ".02em",
        border: ring ? "3px solid var(--surface-page)" : undefined,
        boxShadow: ring ? "var(--glow-ring)" : undefined, ...style,
      }}
    >
      {src ? <img src={src} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (initials || children)}
    </div>
  );
}
