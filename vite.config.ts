/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'RL Session Tracker',
        short_name: 'RL Tracker',
        description: 'Houd je Rocket League-sessies, wedstrijden en training bij.',
        lang: 'nl',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#07101f',
        theme_color: '#07101f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,woff2}'], navigateFallback: 'index.html' },
    }),
  ],
  test: { environment: 'node' },
})
