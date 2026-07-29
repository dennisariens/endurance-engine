import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { buildBriefingPayload, fetchIntervalsContext } from './server/aerionApi'

function aerionSyncPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'aerion-opening-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync', async (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(await fetchIntervalsContext({ env })))
      })

      server.middlewares.use('/api/briefing', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          const url = new URL(req.url ?? '', 'http://127.0.0.1')
          const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10)
          res.end(JSON.stringify(await buildBriefingPayload({ env, date }), null, 2))
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : 'Unknown briefing error' }))
        }
      })
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
