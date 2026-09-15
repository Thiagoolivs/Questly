import React from "react";

export default function Chip({ children, selected = false, onClick, style, ...rest }) {
  return (
    <button
      type="button" onClick={onClick} {...rest}
      style={{
        height: 28, padding: "0 12px", borderRadius: "var(--radius-pill)", cursor: "pointer",
        fontFamily: "var(--font-ui)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-medium)",
        whiteSpace: "nowrap", flex: "none",
        background: selected ? "var(--surface-inverse)" : "var(--surface-chip)",
        color: selected ? "var(--text-on-light)" : "var(--text-secondary)",
        border: selected ? "1px solid transparent" : "1px solid var(--line-hairline)",
        transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
        WebkitTapHighlightColor: "transparent", ...style,
      }}
    >
      {children}
    </button>
  );
}
