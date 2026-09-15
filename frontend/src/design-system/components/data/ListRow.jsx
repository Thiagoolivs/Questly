import React from "react";
import Icon from "../core/Icon.jsx";

export default function ListRow({ icon, title, meta, count, danger = false, onClick, style, ...rest }) {
  return (
    <div
      onClick={onClick} {...rest}
      style={{
        display: "flex", alignItems: "center", gap: "var(--space-5)", padding: "12px 0",
        borderBottom: "1px solid var(--line-hairline)", cursor: onClick ? "pointer" : "default", ...style,
      }}
    >
      {icon ? <Icon name={icon} size={16} color={danger ? "var(--danger)" : "var(--text-secondary)"} /> : null}
      <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-ui)", fontSize: "var(--fs-body)", color: danger ? "var(--danger)" : "var(--text-primary)" }}>{title}</span>
      {meta ? <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-body-sm)", color: "var(--text-tertiary)" }}>{meta}</span> : null}
      {count != null ? <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-body-sm)", color: "var(--text-tertiary)" }}>{count}</span> : null}
      <Icon name="chevron-right" size={15} color="var(--text-tertiary)" />
    </div>
  );
}
