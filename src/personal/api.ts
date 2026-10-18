import { validateStateSnapshot } from '../data/backupSnapshot'
import type { AerionStateSnapshot } from '../hooks/useAerionState'

export type CanonicalState = { revision: number; snapshot: AerionStateSnapshot | null; updatedAt: string | null }
export type OwnerSession = { authenticated: true; csrfToken: string; owner: { displayName: string } }
export class ApiError extends Error {
  constructor(public status: number) {
    super(status === 401 ? 'Session expired. Sign in again; your pending edits are preserved.' : status === 409 ? 'Another device changed your state. Review both versions before saving.' : status === 0 ? 'No connection. Reconnect and retry; pending edits remain in this tab.' : 'The server could not complete this request. Retry when available.')
  }
}

export function parseCanonical(input: unknown): CanonicalState {
  if (!input || typeof input !== 'object') throw new Error('Invalid server state')
  const row = input as CanonicalState
  if (!Number.isSafeInteger(row.revision) || row.revision < 0 || (row.snapshot === null ? row.revision !== 0 : row.revision === 0) || (row.updatedAt !== null && (typeof row.updatedAt !== 'string' || !Number.isFinite(Date.parse(row.updatedAt))))) throw new Error('Invalid server revision')
  return { revision: row.revision, snapshot: row.snapshot === null ? null : validateStateSnapshot(row.snapshot), updatedAt: row.updatedAt }
}

export class PersonalApi {
  private csrf = ''
  async request(path: string, method = 'GET', body?: unknown, headers?: Record<string, string>): Promise<unknown> {
    let response: Response
    try {
      response = await fetch(`/api/${path}`, {
        method, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(method === 'GET' ? {} : { 'X-CSRF-Token': this.csrf }), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
      })
    } catch { throw new ApiError(0) }
    if (!response.ok) throw new ApiError(response.status)
    if (response.status === 204) return null
    // Never render server error text or HTML in the UI.
    return response.json()
  }
  async session(): Promise<OwnerSession> {
    const result = await this.request('auth/session') as OwnerSession
    if (result && result.authenticated !== true) throw new ApiError(401)
    if (typeof result?.csrfToken !== 'string' || !result.csrfToken || result.authenticated !== true || typeof result.owner?.displayName !== 'string') throw new Error('Invalid server session')
    this.csrf = result.csrfToken
    return result
  }
  async login(password: string) {
    // Anonymous session endpoint supplies login CSRF without asserting authentication.
    const challenge = await this.request('auth/session') as { csrfToken?: string }
    if (typeof challenge?.csrfToken !== 'string' || !challenge.csrfToken) throw new Error('Sign-in unavailable')
    this.csrf = challenge.csrfToken
    await this.request('auth/login', 'POST', { password })
    return this.session()
  }
  async logout() { await this.request('auth/logout', 'POST'); this.csrf = '' }
  async read() { return parseCanonical(await this.request('state')) }
  async write(snapshot: AerionStateSnapshot, revision: number, requestId: string) {
    return parseCanonical(await this.request('state', 'PUT', { snapshot: validateStateSnapshot(snapshot) }, { 'If-Match': `"${revision}"`, 'Idempotency-Key': requestId }))
  }
  async sync(requestId: string) { await this.request('sync', 'POST', {}, { 'Idempotency-Key': requestId }); return this.read() }
}
