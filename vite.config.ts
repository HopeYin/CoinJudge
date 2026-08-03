import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 局域网可访问，手机浏览器调试用（文档第 3 节要求）
  },
})
