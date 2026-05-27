import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use 127.0.0.1 (not localhost) — avoids Windows IPv6 [::1] proxy failures
const BACKEND = 'http://127.0.0.1:8080'

const proxyOptions = {
  target: BACKEND,
  changeOrigin: true,
  secure: false,
  timeout: 0,
  proxyTimeout: 0,
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': proxyOptions,
      '/uploads': proxyOptions,
    },
  },
  preview: {
    port: 3000,
    host: true,
    proxy: {
      '/api': proxyOptions,
      '/uploads': proxyOptions,
    },
  },
})
