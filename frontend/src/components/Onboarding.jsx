import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../design-system/components/core/Icon.jsx'
import InstallGuide from './InstallGuide.jsx'

// v2: quem já tinha visto o modal antigo (chave `questly.onboarded`) precisa
// ver o tour novo uma vez — por isso a chave é versionada.
const KEY = 'questly.tour.v2'
const LEGACY_KEY = 'questly.onboarded'
const START_EVT = 'questly:start-tour'

export const hasOnboarded = () => localStorage.getItem(KEY) === '1'
export const markOnboarded = () => {
  localStorage.setItem(KEY, '1')
  localStorage.removeItem(LEGACY_KEY)
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
// aparece centralizado (boas-vindas e instalação).
const STEPS = [
  {
    title: 'Bem-vindo ao Questly',
    text: 'Um desafio de evolução em grupo. Em 1 minuto eu te mostro por onde começar — é rapidinho.',
  },
  {
    target: 'desafios',
    route: '/',
    section: 'desafios',
    title: 'Os desafios do dia',
    text: 'Todo dia o app sorteia um desafio por área. Quanto mais difícil, mais pontos. Você comprova com uma foto — e pode trocar 1 por dia se não curtir.',
  },
  {
    target: 'habitos',
    route: '/',
    section: 'habitos',
    title: 'Seus hábitos',
    text: 'Estes se repetem todo dia: água, sono, leitura… Marcar vale 10 pontos; com foto, 12.',
  },
  {
    target: 'alimentacao',
    route: '/',
    section: 'alimentacao',
    title: 'Alimentação e água',
    text: 'Escreva o que comeu ("um pão de queijo e um café com leite") ou mande uma foto — a IA estima as calorias. A água você soma de 500 em 500 ml.',
  },
  {
    target: 'nav-plano',
    title: 'Seu Planejamento',
    text: 'Aqui fica o seu calendário e tarefas agendadas — consultas, treinos, aniversários. Planeje o seu mês na aba Plano.',
  },
  {
    target: 'perfil-nutricao',
    route: '/perfil',
    title: 'Seu peso e suas metas',
    text: 'Informe peso, altura e objetivo: o app calcula suas metas de calorias, proteína e água. Dá para ajustar tudo na mão depois.',
    cta: 'Preencher agora é o ideal — leva 30 segundos.',
  },
  {
    target: 'perfil-convite',
    route: '/perfil',
    title: 'Chame a galera',
    text: 'Toque em "Convidar por link" e mande no WhatsApp. Quem receber entra direto no grupo, sem digitar código.',
  },
  {
    install: true,
    title: 'Deixe na tela inicial',
    text: 'Assim o Questly abre como um app de verdade — em tela cheia, com ícone e notificações.',
  },
]

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
            <Icon name="arrowRight" size={30} />
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
