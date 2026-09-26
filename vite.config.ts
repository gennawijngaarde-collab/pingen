import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { apiDevPlugin } from './vite.api-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Toujours '/' : `./` casse React Router au refresh sur /dashboard/* (404 assets).
  base: '/',
  plugins: [...(mode === 'development' ? [inspectAttr()] : []), react(), apiDevPlugin(mode)],
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
