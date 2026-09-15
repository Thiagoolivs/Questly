import React from "react";
import Icon from "../core/Icon.jsx";

export default function SearchField({ placeholder = "Search", value, onChange, style, ...rest }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", height: 38, padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--surface-chip)", border: "var(--border-input)", ...style }}>
      <input
        value={value} onChange={onChange} placeholder={placeholder} {...rest}
        style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-ui)", fontSize: "var(--fs-body)", color: "var(--text-primary)" }}
      />
      <Icon name="search" size={16} color="var(--text-tertiary)" />
    </span>
  );
}
