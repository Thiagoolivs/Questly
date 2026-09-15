import React from "react";

export function StackedBar({ segments = [], height = 96, ticks = true, style, ...rest }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div style={{ ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
        {segments.map((s, i) => (
          <div
            key={i}
            style={{
              flex: s.value / total, height: "100%", borderRadius: "var(--radius-xs)",
              background: s.color,
              backgroundImage: ticks ? "repeating-linear-gradient(90deg,rgba(0,0,0,.22) 0 1px,transparent 1px 5px)" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
