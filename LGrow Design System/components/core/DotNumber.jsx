import React from "react";

export function DotNumber({ value, size = "md", unit, color = "var(--text-primary)", style, ...rest }) {
  const fs = { sm: "var(--fs-num-sm)", md: "var(--fs-num-md)", lg: "var(--fs-num-lg)", hero: "var(--fs-num-hero)" }[size] || size;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: "var(--space-3)", ...style }} {...rest}>
      <span style={{ fontFamily: "var(--font-numeric)", fontWeight: "var(--fw-numeric)", fontSize: fs, lineHeight: "var(--lh-tight)", color, letterSpacing: ".02em" }}>
        {value}
      </span>
      {unit ? (
        <span style={{ fontFamily: "var(--font-numeric)", fontWeight: "var(--fw-numeric)", fontSize: "var(--fs-body-sm)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)" }}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}
