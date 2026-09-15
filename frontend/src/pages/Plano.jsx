import { Link } from 'react-router-dom'
import { Card, ListRow, Icon } from '../design-system/components/index.js'

export default function Plano() {
  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Meu Plano
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Central de planejamento, progresso e objetivos.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Card padding="none">
          <Link to="/tarefas" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow
              title="Tarefas"
              subtitle="To-dos soltos e backlog"
              icon="list-check"
              right={<Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
              borderBottom={true}
            />
          </Link>

          <Link to="/historico" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow
              title="Histórico"
              subtitle="Dias passados e estatísticas"
              icon="calendar-days"
              right={<Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
              borderBottom={true}
            />
          </Link>

          <Link to="/conquistas" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow
              title="Conquistas"
              subtitle="Medalhas e recordes"
              icon="trophy"
              right={<Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
              borderBottom={false}
            />
          </Link>
        </Card>
      </div>
    </div>
  )
}
