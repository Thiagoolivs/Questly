// Radar (SVG puro, sem libs) comparando membros por área.
export const RADAR_COLORS = ['#5e6ad2', '#3fb27f', '#d6a23e', '#e5749a', '#4aa3d6']

export default function RadarChart({ categories = [], emojis = [], members = [], size = 260 }) {
  const n = categories.length
  if (n < 3) return <div className="muted small">Radar disponível com 3+ áreas.</div>

  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 34
  const maxV = Math.max(1, ...members.flatMap((m) => m.values))
  const angle = (i) => ((-90 + (360 / n) * i) * Math.PI) / 180
  const point = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r]
  const poly = (vals, scale = 1) =>
    vals.map((v, i) => point(i, (v / maxV) * R * scale).join(',')).join(' ')
  const ringPoly = (f) => categories.map((_, i) => point(i, R * f).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label="Radar por área">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} className="radar-grid" points={ringPoly(f)} />
      ))}
      {categories.map((_, i) => {
        const [x, y] = point(i, R)
        return <line key={i} className="radar-axis" x1={cx} y1={cy} x2={x} y2={y} />
      })}
      {members.map((m, mi) => (
        <polygon
          key={m.id}
          points={poly(m.values)}
          fill={RADAR_COLORS[mi % RADAR_COLORS.length]}
          fillOpacity="0.16"
          stroke={RADAR_COLORS[mi % RADAR_COLORS.length]}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
      {categories.map((c, i) => {
        const [x, y] = point(i, R + 16)
        return (
          <text key={i} x={x} y={y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
            {emojis[i] || c}
          </text>
        )
      })}
    </svg>
  )
}
