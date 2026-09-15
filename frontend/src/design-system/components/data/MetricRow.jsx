import React from "react";
import Icon from "../core/Icon.jsx";

export default function MetricRow({ icon, value, label, delta, deltaTone = "success", valueColor = "var(--text-primary)", chevron = true, onClick, style, ...rest }) {
  return (
    <div
      onClick={onClick} {...rest}
      style={{
        display: "flex", alignItems: "center", gap: "var(--space-5)", padding: "10px 12px",
        borderRadius: "var(--radius-md)", background: "var(--surface-card-alt)",
        border: "var(--border-card)", cursor: onClick ? "pointer" : "default", ...style,
      }}
    >
      {icon ? (
        <span style={{ width: 28, height: 28, borderRadius: "var(--radius-xs)", background: "var(--surface-input)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Icon name={icon} size={15} color="var(--text-primary)" />
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: valueColor }}>{value}</span>
          {delta ? (
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-medium)", color: deltaTone === "success" ? "var(--success)" : "var(--danger)" }}>{delta}</span>
          ) : null}
        </span>
        <span style={{ display: "block", fontFamily: "var(--font-ui)", fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-tertiary)" }}>{label}</span>
      </span>
      {chevron ? <Icon name="chevron-right" size={16} color="var(--text-tertiary)" /> : null}
    </div>
  );
}
