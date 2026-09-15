import React from "react";

export default function SegmentedControl({ options = [], value, onChange, variant = "pill", style, ...rest }) {
  const current = value ?? (options[0] && (options[0].value ?? options[0]));
  if (variant === "underline") {
    return (
      <div style={{ display: "flex", gap: "var(--space-8)", borderBottom: "1px solid var(--line-hairline)", ...style }} {...rest}>
        {options.map((o) => {
          const v = o.value ?? o, lbl = o.label ?? o, on = v === current;
          return (
            <button key={v} type="button" onClick={() => onChange && onChange(v)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 10px", fontFamily: "var(--font-ui)", fontSize: "var(--fs-body)", fontWeight: on ? "var(--fw-semibold)" : "var(--fw-regular)", color: on ? "var(--text-primary)" : "var(--text-tertiary)", borderBottom: on ? "2px solid var(--full-white)" : "2px solid transparent", marginBottom: -1 }}>
              {lbl}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: 3, borderRadius: "var(--radius-pill)", background: "var(--surface-chip)", border: "var(--border-input)", ...style }} {...rest}>
      {options.map((o) => {
        const v = o.value ?? o, lbl = o.label ?? o, on = v === current;
        return (
          <button key={v} type="button" onClick={() => onChange && onChange(v)}
            style={{ height: 26, padding: "0 12px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-medium)", background: on ? "var(--surface-inverse)" : "transparent", color: on ? "var(--text-on-light)" : "var(--text-secondary)", transition: "background var(--dur-fast) var(--ease-standard)", WebkitTapHighlightColor: "transparent" }}>
            {lbl}
          </button>
        );
      })}
    </div>
  );
}
