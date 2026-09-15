import React from "react";

const SIZES = { sm: 28, md: 36, lg: 44, xl: 88 };

/* Iniciais a partir do nome: primeira letra do primeiro e do último nome.
   Sem isto, quem passa só `name` (o caso comum) vê um círculo vazio. */
function iniciaisDe(name) {
  const partes = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export default function Avatar({ src, initials, name, size = "md", color = "var(--blue-glow)", ring = false, children, style, ...rest }) {
  const px = typeof size === "number" ? size : SIZES[size];
  const marca = initials ?? iniciaisDe(name);
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
      {src ? <img src={src} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (children || marca)}
    </div>
  );
}
