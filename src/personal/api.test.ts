import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, parseCanonical, PersonalApi } from './api'
import { differences, emptySnapshot, pendingWrite } from './state'

afterEach(() => vi.unstubAllGlobals())
describe('Personal Beta transport safety', () => {
  it('accepts only validated snapshots with a usable revision', () => {
    expect(parseCanonical({ revision: 0, snapshot: null, updatedAt: null }).snapshot).toBeNull()
    for (const row of [ { revision: 0, snapshot: emptySnapshot(), updatedAt: null }, { revision: -1, snapshot: null, updatedAt: null }, { revision: 1, snapshot: {}, updatedAt: null }, { revision: 1, snapshot: null, updatedAt: null } ]) expect(() => parseCanonical(row)).toThrow()
  })
  it('uses real session CSRF, cookie credentials, CAS and the same idempotency key', async () => {
    const snapshot = emptySnapshot()
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ authenticated: true, csrfToken: 'synthetic-csrf', owner: { displayName: 'Synthetic' } })).mockResolvedValue(Response.json({ revision: 2, snapshot, updatedAt: null }))
    vi.stubGlobal('fetch', fetch)
    const api = new PersonalApi()
    await api.session()
    await api.write(snapshot, 1, 'request-1')
    const [path, options] = fetch.mock.calls[1]
    expect(path).toBe('/api/state')
    expect(options).toMatchObject({ method: 'PUT', credentials: 'same-origin', cache: 'no-store', redirect: 'error', headers: { 'If-Match': '"1"', 'Idempotency-Key': 'request-1', 'X-CSRF-Token': 'synthetic-csrf' } })
    expect(JSON.parse(options.body)).toEqual({ snapshot })
  })
  it('does not surface arbitrary server bodies or authenticate an anonymous response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ authenticated: false, csrfToken: 'challenge' })))
    await expect(new PersonalApi().session()).rejects.toMatchObject({ status: 401 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('sensitive server diagnostics', { status: 500 })))
    await expect(new PersonalApi().read()).rejects.toThrow('The server could not complete')
    expect(new ApiError(500).message).not.toContain('sensitive')
  })
  it('preserves an uncertain write request; changed revisions need a new request', () => {
    const snapshot = emptySnapshot()
    const first = pendingWrite(null, snapshot, 1)
    expect(pendingWrite(first, structuredClone(snapshot), 1)).toBe(first)
    expect(pendingWrite(first, snapshot, 2).requestId).not.toBe(first.requestId)
    snapshot.currentState.injury_present = true
    expect(first.snapshot.currentState.injury_present).toBe(false)
    expect(differences(first.snapshot, snapshot).map(row => row.field)).toEqual(['currentState'])
  })
})
