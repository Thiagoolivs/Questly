import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './store.jsx'
import { TabBar } from './design-system/components/index.js'
import { useNavigate, useLocation } from 'react-router-dom'
import Onboarding, { hasOnboarded, useTourTrigger } from './components/Onboarding.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { captureInviteFromUrl } from './utils/invite.js'
import Auth from './pages/Auth.jsx'
import Grupos from './pages/Grupos.jsx'
import MeuDia from './pages/MeuDia.jsx'
import Plano from './pages/Plano.jsx'
import Grupo from './pages/Grupo.jsx'
import Feed from './pages/Feed.jsx'
import Perfil from './pages/Perfil.jsx'
// Sub-páginas (abertas a partir das 5 abas, fora da navegação principal)
import Agenda from './pages/Agenda.jsx'
import Registrar from './pages/Registrar.jsx'
import Desafio from './pages/Desafio.jsx'
import Treino from './pages/Treino.jsx'
import Nutricao from './pages/Nutricao.jsx'
import Rotinas from './pages/Rotinas.jsx'
import Habitos from './pages/Habitos.jsx'
import Tarefas from './pages/Tarefas.jsx'
import Chat from './pages/Chat.jsx'
import Mural from './pages/Mural.jsx'
import Conquistas from './pages/Conquistas.jsx'
import Semana from './pages/Semana.jsx'
import Config from './pages/Config.jsx'
import ConfigGrupo from './pages/ConfigGrupo.jsx'

// Captura o código de convite da URL antes de qualquer render (uma vez só).
captureInviteFromUrl()

export default function App() {
  return (
    <AppProvider>
      {/* O aviso do rodapé (e o "Desfazer" que mora nele) precisa sobreviver à
          troca de tela: por isso fica acima das rotas, não dentro delas. */}
      <ToastProvider>
        <Gate />
      </ToastProvider>
    </AppProvider>
  )
}

// Decide o que mostrar conforme a sessão: login → app.
function Gate() {
  const { booting, token } = useApp()
  if (booting) return <div className="screen center muted">Carregando…</div>
  if (!token) return <Auth />
  return <Shell />
}

// O tour vive AQUI (fora das rotas): ele navega entre as telas, então precisa
// sobreviver às trocas de página. Qualquer tela pode iniciá-lo com startTour().
function TourHost() {
  const [show, setShow] = useState(() => !hasOnboarded())
  useTourTrigger(useCallback(() => setShow(true), []))
  if (!show) return null
  return <Onboarding onClose={() => setShow(false)} />
}

function TabBarHost() {
  const navigate = useNavigate()
  const loc = useLocation()

  // Mapear rotas para IDs da TabBar (home, coaching, chats, profile)
  // Como são 5 no Questly, vamos adaptar os ícones e IDs
  const tabs = [
    { id: "/", icon: "house" },
    { id: "/plano", icon: "clipboard-list" },
    { id: "/grupo", icon: "users" },
    { id: "/feed", icon: "activity" },
    { id: "/perfil", icon: "user" }
  ]

  // Se não estiver em nenhuma dessas 5 abas principais, oculta a TabBar
  const isMainTab = tabs.some(t => t.id === loc.pathname)
  if (!isMainTab) return null

  return (
    <div style={{ position: 'fixed', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
      <div style={{ pointerEvents: 'auto', position: 'relative' }}>
        <TabBar tabs={tabs} active={loc.pathname} onChange={(id) => navigate(id)} />
        {/* Âncoras invisíveis para o tour apontar abas específicas da TabBar,
            que é um componente do design system e não leva marcação própria. */}
        <span data-tour="nav-plano" style={{ position: 'absolute', left: '30%', top: 0, width: 44, height: 44, pointerEvents: 'none' }} />
        <span data-tour="nav-grupo" style={{ position: 'absolute', left: '50%', top: 0, width: 44, height: 44, marginLeft: -22, pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

function Shell() {
  return (
    <BrowserRouter>
      <TourHost />
      <div className="app-shell">
        {/* A TabBar flutua sobre o conteúdo (fixa a 16px do fim, 56px de altura),
            então a página precisa reservar esse espaço — senão a última ação
            de cada tela fica embaixo dela. */}
        <main
          className="content"
          style={{
            // O app roda com viewport-fit=cover e status bar translúcida, então
            // o conteúdo começa DEBAIXO do relógio e do notch. O inset devolve
            // essa faixa e o space-9 dá o respiro — some com o padding que cada
            // tela já tem, então fica num lugar só em vez de em dez.
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + var(--space-9))',
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
            minHeight: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Routes>
            {/* 5 abas principais */}
            <Route path="/" element={<MeuDia />} />
            <Route path="/plano" element={<Plano />} />
            <Route path="/grupo" element={<Grupo />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/perfil" element={<Perfil />} />
            {/* Sub-páginas (abertas por links, fora da navegação principal) */}
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/registrar" element={<Registrar />} />
            <Route path="/desafio" element={<Desafio />} />
            <Route path="/treino" element={<Treino />} />
            <Route path="/nutricao" element={<Nutricao />} />
            <Route path="/rotinas" element={<Rotinas />} />
            <Route path="/habitos" element={<Habitos />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/mural" element={<Mural />} />
            <Route path="/conquistas" element={<Conquistas />} />
            <Route path="/semana" element={<Semana />} />
            <Route path="/config" element={<Config />} />
            <Route path="/grupo/config" element={<ConfigGrupo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <TabBarHost />
      </div>
    </BrowserRouter>
  )
}
