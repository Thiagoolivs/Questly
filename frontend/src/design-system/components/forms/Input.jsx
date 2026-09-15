import React from "react";
import Icon from "../core/Icon.jsx";

export default function Input({
  label, required = false, placeholder, value, onChange, unit, icon, type = "text",
  disabled = false, style, inputStyle, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: "block", ...style }}>
      {label ? (
        <span style={{ display: "block", marginBottom: "var(--space-3)", fontFamily: "var(--font-ui)", fontSize: "var(--fs-label)", fontWeight: "var(--fw-medium)", color: "var(--text-primary)" }}>
          {label}
          {required ? <span style={{ color: "var(--text-required)" }}> *</span> : null}
        </span>
      ) : null}
      <span
        style={{
          display: "flex", alignItems: "center", gap: "var(--space-4)", height: "var(--control-h)",
          padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--surface-input)",
          border: focus ? "1px solid var(--blue-glow)" : "var(--border-input)",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color var(--dur-fast) var(--ease-standard)",
        }}
      >
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...rest}
          style={{
            flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
            fontFamily: "var(--font-ui)", fontSize: "var(--fs-body)", color: "var(--text-primary)",
            ...inputStyle,
          }}
        />
        {unit ? <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-body-sm)", color: "var(--text-tertiary)" }}>{unit}</span> : null}
        {icon ? <Icon name={icon} size={18} color="var(--text-secondary)" /> : null}
      </span>
    </label>
  );
}
