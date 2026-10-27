import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 푸시 알림 코드(public/push-sw.js)를 자동으로 만들어지는 서비스 워커가 함께 불러온다
      workbox: { importScripts: ['push-sw.js'] },
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: '덕아웃',
        short_name: '덕아웃',
        description: '오늘, 같이 응원할래?',
        lang: 'ko',
        theme_color: '#1B2A5C',
        background_color: '#F7F8FC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
