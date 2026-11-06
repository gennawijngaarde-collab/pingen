import path from 'path'
import fs from 'fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { apiDevPlugin } from './vite.api-plugin'
import { robotsTxt, sitemapXml } from './src/i18n/sections/guides/index'

function guideDiscoveryPlugin(): Plugin {
  let outDir = path.resolve('dist')
  return {
    name: 'guide-discovery',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(sitemapXml())
          return
        }
        if (url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(robotsTxt())
          return
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(sitemapXml())
          return
        }
        if (url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(robotsTxt())
          return
        }
        next()
      })
    },
    closeBundle() {
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml())
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt())
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Toujours '/' : `./` casse React Router au refresh sur /dashboard/* (404 assets).
  base: '/',
  plugins: [...(mode === 'development' ? [inspectAttr()] : []), react(), apiDevPlugin(mode), guideDiscoveryPlugin()],
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
