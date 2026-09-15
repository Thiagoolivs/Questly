import React from "react";
import Icon from "../core/Icon.jsx";

const DEFAULT_TABS = [
  { id: "home", icon: "house" },
  { id: "coaching", icon: "dumbbell" },
  { id: "chats", icon: "message-square" },
  { id: "profile", icon: "user" },
];

export default function TabBar({ tabs = DEFAULT_TABS, active, onChange, style, ...rest }) {
  const current = active || tabs[0].id;
  return (
    <nav
      {...rest}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--space-4)",
        padding: 6, borderRadius: "var(--radius-pill)", background: "var(--surface-glass)",
        border: "1px solid rgba(255,255,255,.10)", backdropFilter: "var(--blur-glass)",
        boxShadow: "var(--shadow-tabbar)", ...style,
      }}
    >
      {tabs.map((t) => {
        const on = t.id === current;
        return (
          <button
            key={t.id} type="button" aria-label={t.id} onClick={() => onChange && onChange(t.id)}
            style={{
              width: 44, height: 44, borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: on ? "var(--surface-inverse)" : "var(--surface-input)",
              transition: "background var(--dur-fast) var(--ease-standard)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon name={t.icon} size={20} color={on ? "var(--text-on-light)" : "var(--text-primary)"} />
          </button>
        );
      })}
    </nav>
  );
}
