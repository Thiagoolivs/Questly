import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './store.jsx'
import BottomNav from './components/BottomNav.jsx'
import Onboarding, { hasOnboarded, useTourTrigger } from './components/Onboarding.jsx'
import { captureInviteFromUrl } from './utils/invite.js'
import Auth from './pages/Auth.jsx'
import Grupos from './pages/Grupos.jsx'
import Home from './pages/Home.jsx'
import Tarefas from './pages/Tarefas.jsx'
import Feed from './pages/Feed.jsx'
import Chat from './pages/Chat.jsx'
import Perfil from './pages/Perfil.jsx'
import Historico from './pages/Historico.jsx'
import Mural from './pages/Mural.jsx'
import Conquistas from './pages/Conquistas.jsx'
import Config from './pages/Config.jsx'

// Captura o código de convite da URL antes de qualquer render (uma vez só).
captureInviteFromUrl()

export default function App() {
  return (
    <AppProvider>
      <Gate />
    </AppProvider>
  )
}

// Decide o que mostrar conforme a sessão: login → escolha de grupo → app.
function Gate() {
  const { booting, token, groupId } = useApp()
  if (booting) return <div className="screen center muted">Carregando…</div>
  if (!token) return <Auth />
  if (!groupId) return <Grupos />
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

function Shell() {
  return (
    <BrowserRouter>
      <TourHost />
      <div className="app-shell">
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/mural" element={<Mural />} />
            <Route path="/conquistas" element={<Conquistas />} />
            <Route path="/config" element={<Config />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
