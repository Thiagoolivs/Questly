import React from "react";
import Icon from "../core/Icon.jsx";

export default function Select({ label, value, options = [], onChange, width, style, ...rest }) {
  return (
    <label style={{ display: "block", width, ...style }}>
      {label ? (
        <span style={{ display: "block", marginBottom: "var(--space-3)", fontFamily: "var(--font-ui)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-medium)", color: "var(--text-primary)" }}>{label}</span>
      ) : null}
      <span style={{ position: "relative", display: "flex", alignItems: "center", height: "var(--control-h)", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--surface-input)", border: "var(--border-input)" }}>
        <select
          value={value} onChange={onChange} {...rest}
          style={{ appearance: "none", WebkitAppearance: "none", flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-ui)", fontSize: "var(--fs-body)", color: "var(--text-primary)", paddingRight: 18 }}
        >
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o} style={{ color: "#000" }}>{o.label ?? o}</option>
          ))}
        </select>
        <Icon name="chevron-down" size={16} color="var(--text-secondary)" style={{ position: "absolute", right: 12, pointerEvents: "none" }} />
      </span>
    </label>
  );
}
