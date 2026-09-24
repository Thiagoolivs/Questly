import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Button, Card, Icon, IconButton, ListRow } from '../design-system/components/index.js'
import { startTour } from '../components/Onboarding.jsx'
import { disablePush, enablePush, getPushState, pushSupported } from '../utils/push.js'
import { forceUpdate } from '../utils/pwa.js'

/**
 * Configurações do aplicativo — e só isso.
 *
 * Antes esta tela era, na verdade, a configuração do grupo (hábitos, áreas,
 * desafios, fuso), com nome de configuração do app. Aquilo virou
 * /grupo/config; aqui ficam as poucas coisas que são do aparelho e da conta.
 */
export default function Config() {
  const navigate = useNavigate()
  const { logout, groupId, group } = useApp()
  const [push, setPush] = useState('unsupported')
  const [autoShare, setAutoShare] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (pushSupported()) getPushState().then(setPush)
  }, [])

  useEffect(() => {
    if (!groupId) return setAutoShare(null)
    api.shareOptions(groupId).then((d) => setAutoShare(d.auto_share)).catch(() => {})
  }, [groupId])

  // Publicar no espaço dos outros sem pedir é o caminho mais curto para o feed
  // virar ruído, então isto nasce desligado e mora aqui, não num canto escondido.
  const alternarAutoShare = async () => {
    if (ocupado || autoShare === null) return
    setOcupado(true)
    setErro('')
    try {
      const r = await api.setAutoShare(groupId, { auto_share: !autoShare })
      setAutoShare(r.auto_share)
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const alternarPush = async () => {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      setPush(push === 'on' ? await disablePush() : await enablePush())
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const rotuloPush = {
    on: 'Ativadas',
    off: 'Desativadas',
    denied: 'Bloqueadas no navegador',
    unsupported: 'Não disponível neste aparelho',
  }[push]

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
        <IconButton icon="arrow-left" label="Voltar" onClick={() => navigate('/perfil')} />
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-2)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-primary)',
          }}
        >
          Configurações
        </h1>
      </header>

      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
          <Icon name="bell" size={18} color="var(--blue-glow)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body)',
                fontWeight: 'var(--fw-medium)',
                color: 'var(--text-primary)',
              }}
            >
              Lembretes
            </div>
            <p
              style={{
                margin: '2px 0 0',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              {rotuloPush}
              {push === 'denied' && ' — libere nas permissões do navegador para voltar a receber.'}
            </p>
          </div>
        </div>
        {(push === 'on' || push === 'off') && (
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button
              variant={push === 'on' ? 'ghost' : 'accent'}
              size="sm"
              onClick={alternarPush}
              disabled={ocupado}
            >
              {push === 'on' ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        )}
      </Card>

      {autoShare !== null && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
            <Icon name="send" size={18} color="var(--blue-glow)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 'var(--fw-medium)',
                  color: 'var(--text-primary)',
                }}
              >
                Publicar meu dia automaticamente
              </div>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-body-sm)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {autoShare
                  ? `O que você cumprir hoje aparece sozinho no feed${group?.name ? ` de ${group.name}` : ''}, num item só por dia.`
                  : 'Desligado. Suas conquistas só vão ao feed quando você tocar em compartilhar.'}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button
              variant={autoShare ? 'ghost' : 'accent'}
              size="sm"
              onClick={alternarAutoShare}
              disabled={ocupado}
            >
              {autoShare ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        </Card>
      )}

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}

      <Card pad="0 var(--pad-card)">
        <ListRow
          icon="help-circle"
          title="Rever o tour"
          subtitle="Mostra de novo como o app funciona"
          onClick={() => { navigate('/'); startTour() }}
        />
        <ListRow
          icon="refresh-cw"
          title="Buscar atualização"
          subtitle="Quando o app instalado ficou preso numa versão antiga"
          onClick={forceUpdate}
          divider={false}
        />
      </Card>

      <Card pad="0 var(--pad-card)">
        <ListRow icon="log-out" title="Sair da conta" danger chevron={false} onClick={logout} />
      </Card>
    </div>
  )
}
