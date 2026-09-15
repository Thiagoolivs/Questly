import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../design-system/components/core/Icon.jsx'
import { enablePush, getPushState, pushSupported } from '../utils/push.js'
import InstallGuide from './InstallGuide.jsx'

// A chave é versionada porque o tour muda junto com o app: quem viu o v2
// (estrutura antiga, com desafios e alimentação na Home) precisa ver este uma
// vez, já que as telas que ele apontava não existem mais.
const KEY = 'questly.tour.v3'
const LEGACY_KEYS = ['questly.onboarded', 'questly.tour.v2']
const START_EVT = 'questly:start-tour'

export const hasOnboarded = () => localStorage.getItem(KEY) === '1'
export const markOnboarded = () => {
  localStorage.setItem(KEY, '1')
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
}
export const resetOnboarding = () => localStorage.removeItem(KEY)

// Dispara o tour de qualquer tela. Importante: quem RENDERIZA o tour é o Shell
// (fora das rotas) — se uma página renderizasse, o tour sumiria ao navegar.
export function startTour() {
  resetOnboarding()
  window.dispatchEvent(new CustomEvent(START_EVT))
}

export function useTourTrigger(onStart) {
  useEffect(() => {
    window.addEventListener(START_EVT, onStart)
    return () => window.removeEventListener(START_EVT, onStart)
  }, [onStart])
}

// Cada passo aponta para um elemento real (data-tour). Sem `target`, o passo
// aparece centralizado (boas-vindas, notificações e instalação).
const STEPS = [
  {
    title: 'Bem-vindo ao Questly',
    text: 'Sua central de planejamento e evolução. Em um minuto eu mostro o caminho: planejar, executar, registrar.',
  },
  {
    target: 'dia-resumo',
    route: '/',
    title: 'Meu Dia',
    text: 'A tela inicial mostra só o que falta fazer hoje: agenda, rotinas e hábitos. Nada além disso.',
  },
  {
    target: 'dia-registrar',
    route: '/',
    title: 'Registre o que fez',
    text: 'Escolha a modalidade e preencha o que importa. A pontuação vem do esforço real — não de quantas vezes você registra.',
  },
  {
    target: 'nav-plano',
    title: 'Meu Plano',
    text: 'Aqui você planeja: treino, alimentação, rotinas e hábitos. A IA monta planos de treino inteiros, com checklist.',
  },
  {
    target: 'nav-grupo',
    title: 'Grupo',
    text: 'Competir é opcional. Se quiser, crie um espaço — sozinho, em casal ou em grupo — e acompanhe o ranking.',
  },
  {
    notifications: true,
    title: 'Quer um empurrão na hora certa?',
    text: 'Podemos te lembrar dos seus hábitos e compromissos no horário que você mesmo definiu. Sem isso, o app só te ajuda quando você lembra de abrir.',
    cta: 'Você pode desligar quando quiser, em Configurações.',
  },
  {
    install: true,
    title: 'Deixe na tela inicial',
    text: 'Assim o Questly abre como um app de verdade — em tela cheia e com ícone.',
  },
]

/**
 * Pede a permissão de notificação no tour, e só depois de dizer para quê.
 *
 * O navegador só deixa pedir uma vez: negada, não há como perguntar de novo
 * sem a pessoa ir nas permissões. Por isso o pedido vem atrás de um botão,
 * depois da explicação — nunca no primeiro segundo de app aberto.
 */
function PedirNotificacoes() {
  const [estado, setEstado] = useState('desconhecido')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (pushSupported()) getPushState().then(setEstado)
    else setEstado('unsupported')
  }, [])

  if (estado === 'unsupported') {
    return <p className="tour-text muted">Este aparelho não aceita notificações do navegador.</p>
  }
  if (estado === 'on') {
    return (
      <p className="tour-text" style={{ color: 'var(--success)' }}>
        Lembretes ativados.
      </p>
    )
  }
  if (estado === 'denied') {
    return (
      <p className="tour-text muted">
        As notificações estão bloqueadas nas permissões do navegador. Dá para
        liberar por lá quando quiser.
      </p>
    )
  }

  return (
    <button
      type="button"
      className="btn full btn-primary"
      disabled={ocupado}
      onClick={async () => {
        setOcupado(true)
        try {
          setEstado(await enablePush())
        } catch {
          setEstado('denied')
        } finally {
          setOcupado(false)
        }
      }}
    >
      {ocupado ? 'Ativando…' : 'Ativar lembretes'}
    </button>
  )
}

const PAD = 8
const findEl = (t) => document.querySelector(`[data-tour="${t}"]`)

export default function Onboarding({ onClose }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const timers = useRef([])

  const step = STEPS[i]
  const last = i === STEPS.length - 1

  const finish = useCallback(() => {
    markOnboarded()
    onClose?.()
  }, [onClose])

  // Leva para a rota do passo.
  useEffect(() => {
    if (step.route && location.pathname !== step.route) navigate(step.route)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  // Acha o alvo (esperando a página renderizar), centraliza e mede.
  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (!step.target) {
      setRect(null)
      return
    }
    let tries = 0
    const seek = () => {
      const el = findEl(step.target)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        // Deixa o scroll assentar antes de medir.
        timers.current.push(setTimeout(() => {
          const r = findEl(step.target)?.getBoundingClientRect()
          if (r) setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        }, 380))
        return
      }
      // Paciência: na primeira carga a página ainda pode estar buscando os dados.
      if (tries++ < 40) timers.current.push(setTimeout(seek, 150))
      else setRect(null) // alvo não existe nesta tela: mostra centralizado
    }
    seek()
    return () => timers.current.forEach(clearTimeout)
  }, [i, location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reposiciona se a tela mudar de tamanho/rolar.
  useEffect(() => {
    if (!rect) return
    const sync = () => {
      const r = findEl(step.target)?.getBoundingClientRect()
      if (r) setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  }, [rect, step.target])

  // Onde encaixar o balão: abaixo do alvo se couber, senão acima.
  const vh = window.innerHeight
  const below = rect ? rect.top + rect.height + 150 < vh : false
  const cardStyle = rect
    ? below
      ? { top: rect.top + rect.height + 22, left: 12, right: 12 }
      : { bottom: vh - rect.top + 22, left: 12, right: 12 }
    : null

  return (
    <div className="tour" role="dialog" aria-label="Tour do app">
      {rect ? (
        <>
          <div
            className="tour-hole"
            style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
          />
          <div
            className={'tour-arrow ' + (below ? 'down' : 'up')}
            style={
              below
                ? { top: rect.top + rect.height + PAD, left: Math.min(Math.max(rect.left + rect.width / 2 - 18, 16), window.innerWidth - 52) }
                : { top: rect.top - PAD - 44, left: Math.min(Math.max(rect.left + rect.width / 2 - 18, 16), window.innerWidth - 52) }
            }
          >
            <Icon name="arrow-right" size={30} />
          </div>
        </>
      ) : (
        <div className="tour-dim" />
      )}

      <div className={'tour-card' + (rect ? ' anchored' : ' centered')} style={cardStyle || undefined}>
        <button className="tour-skip" onClick={finish} type="button">pular</button>
        <div className="tour-step-n">Passo {i + 1} de {STEPS.length}</div>
        <div className="tour-title">{step.title}</div>
        <p className="tour-text">{step.text}</p>
        {step.cta && <div className="tour-cta"><Icon name="bulb" size={13} /> <span>{step.cta}</span></div>}
        {step.notifications && <PedirNotificacoes />}
        {step.install && <InstallGuide compact />}

        <div className="tour-dots">
          {STEPS.map((s, n) => (
            <span key={s.title} className={'tour-dot' + (n === i ? ' active' : '')} />
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {i > 0 && <button className="btn ghost full" onClick={() => setI(i - 1)} type="button">Voltar</button>}
          <button className="btn full btn-primary" onClick={() => (last ? finish() : setI(i + 1))} type="button">
            {last ? 'Tudo certo!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}
