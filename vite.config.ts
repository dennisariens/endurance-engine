import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fetchIntervalsContext } from './server/aerionApi'
import { createBriefingHandler } from './server/briefingHttp'

function aerionSyncPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'aerion-opening-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync', async (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(await fetchIntervalsContext({ env })))
      })
      server.middlewares.use('/api/briefing', createBriefingHandler())
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    plugins: [react(), aerionSyncPlugin(env)],
  }
})
