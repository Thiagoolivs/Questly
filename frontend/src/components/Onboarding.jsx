import { useState } from 'react'
import Icon from './Icon.jsx'

const KEY = 'questly.onboarded'

export const hasOnboarded = () => localStorage.getItem(KEY) === '1'
export const markOnboarded = () => localStorage.setItem(KEY, '1')
export const resetOnboarding = () => localStorage.removeItem(KEY)

const STEPS = [
  {
    icon: 'sparkle',
    title: 'Bem-vindo ao Questly!',
    text: 'Um desafio de evolução em grupo: vocês cumprem metas do dia a dia, marcam no app e acompanham o progresso de todo mundo — juntos.',
    tip: 'A ideia é constância, não perfeição. Um pouquinho todo dia já conta.',
  },
  {
    icon: 'target',
    title: 'Desafios do dia',
    text: 'Todo dia o app sorteia um desafio por área (Física, Mental, Social, Relação e Espiritual). Quanto mais difícil, mais pontos.',
    tip: 'Só pontua anexando a foto que comprova. Não curtiu? Você tem 1 troca por dia.',
  },
  {
    icon: 'listCheck',
    title: 'Hábitos e tarefas',
    text: 'Os hábitos se repetem todo dia (beber água, dormir bem, ler…). As tarefas são coisas pontuais, com data e horário.',
    tip: 'Marcar o hábito vale 10 pontos — com foto, 12.',
  },
  {
    icon: 'utensils',
    title: 'Alimentação e água',
    text: 'Registre o que comeu por foto ou escrevendo ("um pão de queijo e um café com leite") — a IA estima as calorias. A água você soma de 500 em 500 ml.',
    tip: 'É estimativa: dá pra ajustar qualquer valor na mão.',
  },
  {
    icon: 'users',
    title: 'Vocês, juntos',
    text: 'O ranking mostra como cada um está, o feed traz o que a galera fez (dá pra reagir!) e o chat fica pra conversa.',
    tip: 'Fez algo junto com alguém? Registre em "Atividades em dupla" — pontua para os dois.',
  },
]

export default function Onboarding({ onClose }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  const finish = () => {
    markOnboarded()
    onClose?.()
  }

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        <button className="onb-skip" onClick={finish} type="button">pular</button>

        <div className="onb-icon"><Icon name={step.icon} size={30} /></div>
        <div className="onb-title">{step.title}</div>
        <p className="onb-text">{step.text}</p>
        <div className="onb-tip"><Icon name="bulb" size={14} /> <span>{step.tip}</span></div>

        <div className="onb-dots">
          {STEPS.map((s, n) => (
            <button
              key={s.title}
              className={'onb-dot' + (n === i ? ' active' : '')}
              onClick={() => setI(n)}
              aria-label={`Passo ${n + 1}`}
              type="button"
            />
          ))}
        </div>

        <div className="row" style={{ gap: 8 }}>
          {i > 0 && (
            <button className="btn ghost full" onClick={() => setI(i - 1)} type="button">Voltar</button>
          )}
          <button className="btn full btn-primary" onClick={() => (last ? finish() : setI(i + 1))} type="button">
            {last ? 'Bora começar!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}
