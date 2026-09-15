import React from "react";

export default function Legend({ items = [], style, ...rest }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-5)", ...style }} {...rest}>
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", fontFamily: "var(--font-ui)", fontSize: "var(--fs-caption)", color: "var(--text-primary)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: it.color, flex: "none" }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
