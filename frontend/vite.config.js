import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Frontend mobile-first do Questly (PWA instalável na tela inicial).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Questly — Desafio de Evolução',
        short_name: 'Questly',
        description: 'Desafio de evolução gamificado para casais.',
        lang: 'pt-BR',
        theme_color: '#7c6cff',
        background_color: '#0f1020',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { host: true, port: 5173 },
})
