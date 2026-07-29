// "Anel das 5 áreas": um círculo por área do dia, preenchido quando concluída,
// com a sequência (streak) por área embaixo. Dá o gostinho de "fechar os anéis".
export default function AreaRings({ challenges = [], streaks = {} }) {
  const done = challenges.filter((c) => c.done).length
  const total = challenges.length
  return (
    <section className="card area-rings-card">
      <div className="row between">
        <div className="card-title no-margin">Áreas de hoje</div>
        <div className="muted small">{done}/{total} fechadas</div>
      </div>
      <div className="area-rings">
        {challenges.map((c) => (
          <div className="area-ring" key={c.category} title={c.category}>
            <div className={'area-ring-circle diff-' + c.difficulty + (c.done ? ' done' : '')}>
              <span className="area-ring-emoji">{c.done ? '✓' : c.emoji}</span>
            </div>
            <div className="area-ring-streak">{streaks[c.category] > 0 ? `🔥${streaks[c.category]}` : '·'}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
