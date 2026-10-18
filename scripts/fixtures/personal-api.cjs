// Synthetic client contract fixture only. Never used by production.
const { randomUUID } = require('node:crypto');
function createPersonalFixture() {
  const sessions = new Map(), writes = new Map();
  let canonical = { revision: 0, snapshot: null, updatedAt: null };
  const stats = { writes: 0, syncs: 0, denied: 0 };
  let failAfterCommit = false;
  return {
    stats,
    get state() { return structuredClone(canonical); },
    expire() { sessions.clear(); },
    resetEmpty() { canonical = { revision: 0, snapshot: null, updatedAt: null }; writes.clear(); },
    dropNextCommitResponse() { failAfterCommit = true; },
    async handle(req, res, next) {
      if (!req.url.startsWith('/api/')) return next();
      const send = (status, value) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(value)); };
      const token = /aerion=([^;]+)/.exec(req.headers.cookie || '')?.[1];
      const authenticated = sessions.has(token);
      const csrf = 'synthetic-csrf';
      if (req.url === '/api/auth/session' && req.method === 'GET') return send(200, authenticated ? { authenticated: true, csrfToken: csrf, owner: { displayName: 'Synthetic owner' } } : { authenticated: false, csrfToken: csrf });
      if (req.method !== 'GET' && req.headers['x-csrf-token'] !== csrf) return send(403, {});
      let bytes = '';
      for await (const chunk of req) { bytes += chunk; if (bytes.length > 6 * 1024 * 1024) return send(413, {}); }
      let body;
      try { body = bytes ? JSON.parse(bytes) : {}; } catch { return send(400, {}); }
      if (req.url === '/api/auth/login') {
        if (body.password !== 'synthetic-only') return send(401, {});
        const id = randomUUID(); sessions.set(id, true);
        // HTTP fixture only; real Hermes deployment MUST use Secure cookies on HTTPS.
        res.setHeader('Set-Cookie', `aerion=${id}; HttpOnly; SameSite=Strict; Path=/`);
        return send(200, {});
      }
      if (!authenticated) { stats.denied++; return send(401, {}); }
      if (req.url === '/api/auth/logout') { sessions.delete(token); return send(200, {}); }
      if (req.url === '/api/state' && req.method === 'GET') return send(200, canonical);
      const key = req.headers['idempotency-key'];
      if (req.url === '/api/state' && req.method === 'PUT') {
        if (!key) return send(400, {});
        if (writes.has(key)) return send(200, writes.get(key));
        if (req.headers['if-match'] !== `"${canonical.revision}"`) return send(409, {});
        if (!body.snapshot || !Array.isArray(body.snapshot.activities)) return send(422, {});
        // Server-side canonical ledger fixture rejects repeated IDs.
        const ids = body.snapshot.activities.map(a => a.id);
        if (new Set(ids).size !== ids.length) return send(422, {});
        canonical = { revision: canonical.revision + 1, snapshot: body.snapshot, updatedAt: new Date().toISOString() };
        stats.writes++; writes.set(key, structuredClone(canonical));
        if (failAfterCommit) { failAfterCommit = false; return send(503, {}); }
        return send(200, canonical);
      }
      if (req.url === '/api/sync' && req.method === 'POST') {
        stats.syncs++;
        if (!canonical.snapshot) return send(409, {});
        if (!canonical.snapshot.activities.some(a => a.id === 'synthetic-intervals-1')) {
          canonical.snapshot.activities.push({ id: 'synthetic-intervals-1', source: 'intervals', date: new Date().toISOString().slice(0, 10), name: 'Synthetic confirmed ride', type: 'Ride', load: 25, durationSec: 1800 });
          canonical.revision++; canonical.updatedAt = new Date().toISOString();
        }
        return send(200, {});
      }
      return send(404, {});
    },
  };
}
module.exports = { createPersonalFixture };
