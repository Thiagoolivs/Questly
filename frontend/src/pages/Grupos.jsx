import { useState, useEffect, useRef } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pendingInvite, clearInvite, shareInvite } from '../utils/invite.js'
import { Card, Button, Input, Icon, SegmentedControl, ListRow } from '../design-system/components/index.js'

export default function Grupos() {
  const { user, groups, refreshGroups, selectGroup, logout } = useApp()
  const invite = pendingInvite()
  const [tab, setTab] = useState(invite ? 'join' : 'create') // create | join
  const [name, setName] = useState('')
  const [groupType, setGroupType] = useState('group') // 'individual' | 'couple' | 'group'
  const [code, setCode] = useState(invite || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [shared, setShared] = useState(null)
  const autoTried = useRef(false)

  async function run(fn) {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const g = await fn()
      await refreshGroups()
      clearInvite()
      selectGroup(g.id)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const create = () => run(() => api.createGroup({ name: name.trim(), group_type: groupType }))
  const join = (c) => run(() => api.joinGroup({ invite_code: (c || code).trim() }))

  useEffect(() => {
    if (invite && !autoTried.current) {
      autoTried.current = true
      join(invite)
    }
  }, [invite]) // eslint-disable-line react-hooks/exhaustive-deps

  async function share(g) {
    const r = await shareInvite(g.invite_code, g.name)
    if (r === 'copied' || r === 'shared') {
      setShared(g.id)
      setTimeout(() => setShared(null), 1800)
    }
  }

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-8)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Seus grupos
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Olá, {user?.name || 'você'}! Crie um grupo ou entre com um convite.
        </p>
      </div>

      {invite && (
        <Card style={{ background: 'var(--surface-accent-soft)', borderColor: 'var(--blue-glow)', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--blue-glow)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="info" size={16} />
            <span>Você foi convidado com o código <b>{invite}</b>{busy ? ' — entrando…' : ''}</span>
          </div>
        </Card>
      )}

      {groups.length > 0 && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <Card pad="0 var(--pad-card)">
            {groups.map((g, i) => (
              <ListRow
                key={g.id}
                title={g.name}
                subtitle={`${g.member_count} ${g.member_count === 1 ? 'participante' : 'participantes'} · ${g.role === 'owner' ? 'dono' : 'membro'}`}
                divider={i < groups.length - 1}
                chevron={false}
                leading={
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-input)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <Icon name="users" size={16} color="var(--text-secondary)" />
                  </div>
                }
                trailing={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {g.invite_code ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={shared === g.id ? 'check' : 'share'}
                        onClick={() => share(g)}
                        disabled={shared === g.id}
                      >
                        {shared === g.id ? 'Copiado' : 'Convidar'}
                      </Button>
                    ) : null}
                    <Button variant="accent" size="sm" onClick={() => selectGroup(g.id)}>
                      Entrar
                    </Button>
                  </div>
                }
              />
            ))}
          </Card>
        </div>
      )}

      <Card>
        <SegmentedControl 
          options={[{label: 'Criar grupo', value: 'create'}, {label: 'Entrar com código', value: 'join'}]}
          value={tab}
          onChange={setTab}
          style={{ marginBottom: 'var(--space-6)' }}
        />

        {tab === 'create' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Tipo de perfil</div>
              <select 
                value={groupType} 
                onChange={(e) => setGroupType(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--line-hairline)', background: 'var(--surface-input)', 
                  color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)' 
                }}
              >
                <option value="individual">Apenas eu (Individual)</option>
                <option value="couple">Casal (Atividades em dupla)</option>
                <option value="group">Grupo de amigos / accountability</option>
              </select>
            </div>
            <Input 
              label="Nome do grupo/perfil" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Família" 
            />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button variant="primary" fullWidth disabled={busy || !name.trim()} onClick={create}>
                {busy ? 'Criando…' : 'Criar grupo'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input 
              label="Código de convite" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              placeholder="Ex: 25NGVV" 
              maxLength={12}
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button variant="primary" fullWidth disabled={busy || !code.trim()} onClick={() => join()}>
                {busy ? 'Entrando…' : 'Entrar no grupo'}
              </Button>
            </div>
          </div>
        )}

        {err && <div style={{ color: 'var(--danger)', marginTop: 'var(--space-4)', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)' }}>{err}</div>}
      </Card>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <button 
          onClick={logout} 
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
