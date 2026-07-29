import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './store.jsx'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'
import Chat from './pages/Chat.jsx'
import Perfil from './pages/Perfil.jsx'
import Historico from './pages/Historico.jsx'
import Conquistas from './pages/Conquistas.jsx'
import Config from './pages/Config.jsx'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-shell">
          <main className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/conquistas" element={<Conquistas />} />
              <Route path="/config" element={<Config />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
