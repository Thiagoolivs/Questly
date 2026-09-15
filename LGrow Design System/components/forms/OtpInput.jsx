import React from "react";

export function OtpInput({ length = 6, value = "", onChange, style, ...rest }) {
  const cells = Array.from({ length }, (_, i) => value[i]);
  const focusIndex = Math.min(value.length, length - 1);
  return (
    <div style={{ display: "flex", gap: "var(--space-4)", ...style }} {...rest}>
      {cells.map((ch, i) => (
        <span
          key={i}
          style={{
            flex: 1, height: 46, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "var(--radius-sm)", background: "var(--surface-input)",
            border: i === focusIndex ? "1px solid var(--blue-glow)" : "1px solid transparent",
            fontFamily: "var(--font-ui)", fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-medium)",
            color: ch ? "var(--text-primary)" : "var(--text-tertiary)",
          }}
        >
          {ch || "-"}
        </span>
      ))}
    </div>
  );
}
