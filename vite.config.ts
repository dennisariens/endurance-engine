import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { buildBriefingPayload, fetchIntervalsContext, type BuildBriefingPayloadOptions } from './server/aerionApi'

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
          if (req.method !== 'GET' && req.method !== 'POST') {
            res.statusCode = 405; res.setHeader('Allow', 'GET, POST'); res.end(JSON.stringify({ ok: false, message: 'Method not allowed.' })); return
          }
          const url = new URL(req.url ?? '', 'http://127.0.0.1')
          const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10)
          let snapshot: BuildBriefingPayloadOptions['snapshot']
          if (req.method === 'POST') {
            // Same-origin only; browser edits and athlete records must not be
            // accepted via cross-site requests or written to the evidence DB.
            if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {
              res.statusCode = 403
              res.end(JSON.stringify({ ok: false, message: 'Same-origin snapshot required.' }))
              return
            }
            let body = ''
            for await (const chunk of req) {
              body += chunk.toString()
              if (body.length > 2_000_000) { res.statusCode = 413; res.end(JSON.stringify({ ok: false, message: 'Snapshot too large.' })); return }
            }
            const input = JSON.parse(body)
            const records = (value: unknown, fields: string[]) => Array.isArray(value) && value.every(row => row && typeof row === 'object' && fields.every(field => typeof row[field] === 'string'))
            if (!input || !records(input.activities, ['id', 'date', 'name', 'type', 'source']) || !records(input.races, ['id', 'date', 'name', 'discipline']) || !records(input.goals, ['id', 'name', 'type', 'discipline', 'status']) || (input.decisionLog != null && !records(input.decisionLog, ['id', 'date'])) || !input.state || typeof input.state.injury_present !== 'boolean' || typeof input.state.illness_present !== 'boolean' || !['unknown', 'green', 'yellow', 'red'].includes(input.state.recovery_status)) {
              res.statusCode = 400; res.end(JSON.stringify({ ok: false, message: 'Invalid coaching snapshot.' })); return
            }
            snapshot = input
          }
          const payload = await buildBriefingPayload({ env: {}, date, snapshot })
          res.statusCode = payload.ok ? 200 : 409
          res.end(JSON.stringify(payload, null, 2))
        } catch (error) {
          res.statusCode = error instanceof SyntaxError ? 400 : 500
          res.end(JSON.stringify({ ok: false, message: error instanceof SyntaxError ? 'Invalid snapshot JSON.' : 'Unable to generate briefing from supplied snapshot.' }))
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
