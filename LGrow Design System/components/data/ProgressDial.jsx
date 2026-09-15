import React from "react";

export function ProgressDial({
  value = 0, max = 100, label, sublabel, size = 168, thickness = 10,
  color = "var(--blue-glow)", track = "rgba(255,255,255,.10)", sweep = 300, style, children, ...rest
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const arc = (sweep / 360) * c;
  const pct = Math.max(0, Math.min(1, value / max));
  const rot = 90 + (360 - sweep) / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }} {...rest}>
      <svg width={size} height={size} style={{ transform: "rotate(" + rot + "deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={arc + " " + c} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={arc * pct + " " + c} style={{ transition: "stroke-dasharray var(--dur-slow) var(--ease-out)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        {children}
        {label ? <div style={{ fontFamily: "var(--font-numeric)", fontWeight: "var(--fw-numeric)", fontSize: "var(--fs-num-lg)", color: "var(--text-primary)" }}>{label}</div> : null}
        {sublabel ? <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>{sublabel}</div> : null}
      </div>
    </div>
  );
}
