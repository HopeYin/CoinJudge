import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // P2-5：PWA（v2.1 文档第 4 节）——可添加到主屏幕、离线可打开
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'app_icon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: '硬币判官',
        short_name: '硬币判官',
        description: '记一笔，判一笔。轻量级消费反思工具。',
        theme_color: '#5BB8FF',
        background_color: '#F8F7F4',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  server: {
    host: true, // 局域网可访问，手机浏览器调试用（文档第 3 节要求）
  },
})
