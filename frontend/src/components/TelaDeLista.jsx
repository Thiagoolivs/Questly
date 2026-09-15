import { Card, IconButton } from '../design-system/components/index.js'

/**
 * Casca das telas de lista (hábitos, rotinas, planos): cabeçalho com voltar,
 * ação à direita, e os três estados que toda lista tem — carregando, vazia e
 * com conteúdo. Fica num lugar só para as telas não divergirem entre si.
 */
export default function TelaDeLista({
  titulo,
  onVoltar,
  acao,
  erro,
  carregando,
  vazio,
  textoVazio,
  acaoVazio,
  children,
}) {
  return (
    <div
      className="screen"
      style={{
        paddingTop: 'var(--space-7)',
        paddingLeft: 'var(--gutter-screen)',
        paddingRight: 'var(--gutter-screen)',
        paddingBottom: 'var(--space-11)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
        <IconButton icon="arrow-left" label="Voltar" onClick={onVoltar} />
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-2)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-primary)',
          }}
        >
          {titulo}
        </h1>
        {acao}
      </header>

      {erro ? (
        <p style={{ margin: 0, color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>
          {erro}
        </p>
      ) : null}

      {carregando ? (
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>
          Carregando…
        </p>
      ) : vazio ? (
        <Card pad="var(--pad-card-lg)">
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            {textoVazio}
          </p>
          {acaoVazio ? <div style={{ marginTop: 'var(--space-6)' }}>{acaoVazio}</div> : null}
        </Card>
      ) : null}

      {/* Os filhos trazem também as folhas (sheets), que precisam montar mesmo
          com a lista vazia — por isso não ficam dentro do ramo de conteúdo. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>{children}</div>
    </div>
  )
}
