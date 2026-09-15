import React from "react";
import IconButton from "../core/IconButton.jsx";

export default function ScreenHeader({ title, subtitle, back = true, onBack, right, style, ...rest }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", minHeight: 44, ...style }} {...rest}>
      {back ? <IconButton icon="chevron-left" label="Back" onClick={onBack} /> : <span style={{ width: 36 }} />}
      <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)", color: "var(--text-primary)", letterSpacing: "var(--ls-title)" }}>{title}</div>
        {subtitle ? <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{subtitle}</div> : null}
      </div>
      <span style={{ display: "flex", justifyContent: "flex-end", minWidth: 36 }}>{right}</span>
    </header>
  );
}
