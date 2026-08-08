import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { pinterestOAuthPlugin } from './vite.pinterest-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // '/' pour le dev + React Router (évite page blanche sur /dashboard/*)
  base: mode === 'production' ? './' : '/',
  plugins: [inspectAttr(), react(), pinterestOAuthPlugin(mode)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
}))
