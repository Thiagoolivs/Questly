import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import { Button, Card, Icon, Input } from '../design-system/components/index.js'
import Sheet from './Sheet.jsx'
import { useToast } from './Toast.jsx'

/**
 * Levar uma conquista pessoal para o feed do grupo.
 *
 * O progresso pessoal é o que sustenta o app, mas acontecia todo em silêncio: o
 * feed só sabia de treino registrado e desafio cumprido. Ninguém via a sequência
 * do outro crescer, e sequência que ninguém vê rende menos que sequência que o
 * grupo acompanha.
 *
 * Quem escreve a frase é o servidor, a partir do que ele confere — daí a lista
 * de opções vir pronta de lá. O recado é a única parte que a pessoa digita.
 */
export default function Compartilhar({ aberto, titulo = 'Compartilhar com o grupo', fixo, onFechar }) {
  const { groupId, group } = useApp()
  const aviso = useToast()
  const [opcoes, setOpcoes] = useState(null)
  const [escolhida, setEscolhida] = useState(fixo ?? null)
  const [recado, setRecado] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!aberto || !groupId || fixo) return
    setOpcoes(null)
    api.shareOptions(groupId)
      .then((d) => setOpcoes(d.options))
      .catch((e) => setErro(e.message))
  }, [aberto, groupId, fixo])

  if (!aberto) return null

  if (!groupId) {
    return (
      <Sheet title={titulo} onClose={onFechar} footer={<Button variant="ghost" fullWidth onClick={onFechar}>Fechar</Button>}>
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
          Compartilhar precisa de um espaço com outras pessoas. Crie ou entre num
          na aba Grupo.
        </p>
      </Sheet>
    )
  }

  const enviar = async () => {
    if (ocupado || !escolhida) return
    setOcupado(true)
    setErro('')
    try {
      const r = await api.share(groupId, {
        kind: escolhida.kind,
        ref: escolhida.ref ?? null,
        message: recado.trim() || null,
      })
      onFechar()
      aviso({ text: `Publicado: ${r.text}`, icon: 'send', tone: 'success' })
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  const lista = fixo ? [fixo] : opcoes

  return (
    <Sheet
      title={titulo}
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={enviar} disabled={ocupado || !escolhida}>
            {ocupado ? 'Publicando…' : 'Publicar'}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
        Vai para o feed {group?.name ? `de ${group.name}` : 'do grupo'}. Nada sai daqui sem você publicar.
      </p>

      {lista === null && (
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
          Carregando…
        </p>
      )}

      {lista?.length === 0 && (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
            Ainda não há nada para contar. Feche um dia, alcance uma sequência ou
            conclua uma sessão do plano — aí isto enche.
          </p>
        </Card>
      )}

      {lista?.map((o) => {
        const marcada = escolhida?.kind === o.kind && escolhida?.ref === o.ref
        return (
          <Card
            key={`${o.kind}:${o.ref ?? ''}`}
            pad="var(--space-5)"
            style={{ border: marcada ? '1px solid var(--blue-glow)' : undefined }}
          >
            <button
              type="button"
              onClick={() => setEscolhida(o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-5)',
                background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon
                name={marcada ? 'check-circle' : 'circle'}
                size={20}
                color={marcada ? 'var(--blue-glow)' : 'var(--text-tertiary)'}
              />
              <Icon name={o.icon || 'award'} size={16} color="var(--text-tertiary)" />
              <span
                style={{
                  flex: 1, minWidth: 0, fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-body-sm)', color: 'var(--text-primary)',
                }}
              >
                {o.text}
              </span>
            </button>
          </Card>
        )
      })}

      {escolhida && (
        <Input
          label="Recado (opcional)"
          placeholder="Bora junto, semana que vem tem mais…"
          value={recado}
          onChange={(e) => setRecado(e.target.value)}
        />
      )}

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}
