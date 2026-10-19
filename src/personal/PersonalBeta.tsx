import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { AerionInterface } from '../App'
import { validateBackupSnapshot } from '../data/backupSnapshot'
import type { AerionStateSnapshot, useAerionState } from '../hooks/useAerionState'
import { defaultAccount, defaultVisualization } from '../hooks/useAerionState'
import { ApiError, PersonalApi, type CanonicalState, type OwnerSession } from './api'
import { differences, downloadBackup, emptySnapshot, pendingWrite, sameSnapshot, type PendingWrite } from './state'
import aeMark from '../assets/brand/AE-B-gradient.svg'
import './personal.css'

type Draft = AerionStateSnapshot & Required<Pick<AerionStateSnapshot, 'goalConversation' | 'visualization'>>
function normalize(snapshot: AerionStateSnapshot): Draft { return { ...snapshot, goalConversation: snapshot.goalConversation ?? [], visualization: snapshot.visualization ?? defaultVisualization } }

export function PersonalBeta() {
  const [api] = useState(() => new PersonalApi())
  const [session, setSession] = useState<OwnerSession | null>(null)
  const [canonical, setCanonical] = useState<CanonicalState | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [remote, setRemote] = useState<CanonicalState | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const [connectionFailed, setConnectionFailed] = useState(false)
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [importCandidate, setImportCandidate] = useState<AerionStateSnapshot | null>(null)
  const [password, setPassword] = useState('')
  const pending = useRef<PendingWrite | null>(null)
  const locked = useRef(false)
  const dirty = !!draft && !sameSnapshot(draft, canonical?.snapshot ? normalize(canonical.snapshot) : null)

  function accept(next: CanonicalState) {
    setCanonical(next); setDraft(next.snapshot ? normalize(structuredClone(next.snapshot)) : null)
    setRemote(null); pending.current = null; setImportCandidate(null); setBackupConfirmed(false)
  }
  function report(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 0) setConnectionFailed(true)
    if (cause instanceof ApiError && cause.status === 401) setSession(null)
    setError(cause instanceof ApiError ? cause.message : 'Unexpected server response. Your pending edits remain in this tab.')
  }
  async function run(action: () => Promise<void>) {
    if (locked.current) return false
    locked.current = true; setBusy(true); setError('')
    try { await action(); setConnectionFailed(false); return true } catch (cause) { report(cause); return false }
    finally { locked.current = false; setBusy(false) }
  }
  useEffect(() => {
    let cancelled = false
    api.session().then(async owner => {
      const next = await api.read()
      if (!cancelled) { setSession(owner); accept(next) }
    }).catch(cause => { if (!cancelled && !(cause instanceof ApiError && cause.status === 401)) report(cause) })
      .finally(() => { if (!cancelled) setBusy(false) })
    const connection = () => setOnline(navigator.onLine)
    window.addEventListener('online', connection); window.addEventListener('offline', connection)
    return () => { cancelled = true; window.removeEventListener('online', connection); window.removeEventListener('offline', connection) }
  }, [api])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || pending.current || importCandidate) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, importCandidate])

  async function login() {
    await run(async () => {
      const credential = password; setPassword('')
      const owner = await api.login(credential)
      const next = await api.read()
      setSession(owner)
      // Reauthentication never discards unsaved edits, including an uncertain commit.
      if (draft && canonical) setRemote(next)
      else accept(next)
    })
  }
  async function save(candidate: AerionStateSnapshot | null = draft) {
    if (!candidate || !canonical || remote) return
    await run(async () => {
      pending.current = pendingWrite(pending.current, candidate, canonical.revision)
      try {
        const next = await api.write(pending.current.snapshot, pending.current.revision, pending.current.requestId)
        if (next.revision <= canonical.revision || !next.snapshot) throw new Error('Unconfirmed commit')
        accept(next)
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 409 && cause.code !== 'ACTIVITY_REVIEW_REQUIRED') setRemote(await api.read())
        if (cause instanceof ApiError && cause.code === 'ACTIVITY_REVIEW_REQUIRED') pending.current = null
        throw cause
      }
    })
  }
  async function refresh() {
    await run(async () => {
      const next = await api.read()
      if (dirty || pending.current) setRemote(next)
      else accept(next)
    })
  }
  function update<K extends keyof Draft>(key: K): Dispatch<SetStateAction<Draft[K]>> {
    return value => {
      if (busy || !online || connectionFailed || remote || pending.current) return
      setDraft(current => current ? { ...current, [key]: typeof value === 'function' ? (value as (v: Draft[K]) => Draft[K])(current[key]) : value } : current)
    }
  }
  const changes = remote && draft ? differences(remote.snapshot, draft) : []
  const disabled = busy || !online

  return <div className="personal-beta">
    <header className="personal-bar">
      <img src={aeMark} width="48" height="48" alt="AERION" />
      <div><strong>Personal Beta</strong><p role="status">{!online ? 'Offline — editing paused' : connectionFailed ? 'No server connection — editing paused; retry refresh' : busy ? 'Connecting…' : session ? `Owner session · revision ${canonical?.revision ?? 'pending'}${dirty ? ' · unsaved edits' : ''}` : 'Private owner login required'}</p></div>
      {session && <div className="personal-actions">
        <button disabled={disabled || !dirty || !!remote} onClick={() => save()}>Save to server</button>
        <button disabled={disabled} onClick={refresh}>Refresh from server</button>
        <button disabled={!canonical?.snapshot} onClick={() => canonical?.snapshot && downloadBackup(canonical.snapshot, `server-r${canonical.revision}`)}>Export server backup</button>
        {draft && dirty && <button onClick={() => downloadBackup(draft, 'unsaved-edits')}>Export pending edits</button>}
        <button disabled={disabled} onClick={() => run(async () => {
          if ((dirty || pending.current) && !window.confirm('Sign out and discard pending edits? Export them first if needed.')) return
          await api.logout(); setSession(null); setCanonical(null); setDraft(null); setRemote(null); setImportCandidate(null); pending.current = null
        })}>Sign out</button>
      </div>}
    </header>
    {error && <p className="personal-notice" role="alert">{error}</p>}
    {!session ? <section className="personal-gate panel">
      <h1>One private coach.</h1><p>Sign in to load your shared Mac and iPhone state.</p>
      <form onSubmit={event => { event.preventDefault(); void login() }}>
        <label>Owner password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <button disabled={disabled || !password}>Sign in</button>
      </form>
      {!busy && <button disabled={!online} onClick={() => run(async () => { const owner = await api.session(); const next = await api.read(); setSession(owner); if (draft) setRemote(next); else accept(next) })}>Retry session</button>}
      {draft && <button onClick={() => downloadBackup(draft, 'unsaved-edits')}>Export preserved pending edits</button>}
    </section> : !canonical ? <section className="personal-gate panel"><p>Shared state has not loaded. Editing is unavailable.</p><button disabled={disabled} onClick={refresh}>Retry loading state</button></section> : <>
      <p className="personal-notice">Server-confirmed activities: {canonical.snapshot?.activities.length ?? 0} · Last server commit: {canonical.updatedAt ? new Date(canonical.updatedAt).toLocaleString() : 'none'}. Source observation times determine coaching freshness; a recent sync does not make old evidence fresh.</p>
      {remote && draft && <section className="personal-gate panel" aria-label="Resolve concurrent edits">
        <h2>Review changes from another session</h2><p>Your edits are preserved. Server revision {remote.revision}. Choosing your version replaces the fields listed below, including any changes made on the other device.</p>
        <ul>{changes.map(change => <li key={change.field}>{change.field}: server {change.before} → your version {change.after}</li>)}</ul>
        <details><summary>Compare complete versions privately</summary><h3>Server version</h3><pre>{JSON.stringify(remote.snapshot, null, 2)}</pre><h3>Your pending version</h3><pre>{JSON.stringify(draft, null, 2)}</pre></details>
        <button onClick={() => downloadBackup(draft, 'conflict-pending')}>Export my version</button>
        <button disabled={disabled} onClick={() => { if (window.confirm('Discard pending edits and use the server version?')) accept(remote) }}>Use server version</button>
        <button disabled={disabled} onClick={() => { if (window.confirm('Keep your version for review? Saving will explicitly replace the server version shown here.')) { setCanonical(remote); setRemote(null); pending.current = null } }}>Keep my version for review</button>
      </section>}
      {!canonical.snapshot && <section className="personal-gate panel">
        <h2>Shared state is empty</h2><p>No browser data has been uploaded. First export a backup from your existing Mac app. Choose that file here to preview it, or explicitly start empty.</p>
        <label><input type="checkbox" checked={backupConfirmed} onChange={event => setBackupConfirmed(event.target.checked)} /> I have saved a separate backup of my existing AERION data.</label>
        <label>Preview V3 backup<input type="file" accept="application/json" disabled={disabled || !backupConfirmed || !!pending.current} onChange={event => {
          const file = event.target.files?.[0]; event.currentTarget.value = ''
          if (file) void run(async () => { if (file.size > 5 * 1024 * 1024) throw new Error('Backup too large'); setImportCandidate(validateBackupSnapshot(JSON.parse(await file.text()))) })
        }} /></label>
        {importCandidate && <><ul>{differences(null, importCandidate).map(change => <li key={change.field}>{change.field}: {change.after}</li>)}</ul><p>Import replaces empty server state only. Observed timestamps remain unchanged. Your original backup is the rollback copy.</p><button disabled={disabled || !backupConfirmed || !!remote} onClick={() => { setDraft(normalize(importCandidate)); void save(importCandidate) }}>Confirm import to empty server</button></>}
        <button disabled={disabled || connectionFailed || !!remote || !!pending.current} onClick={() => { if (window.confirm('Create an empty shared state without importing local data?')) { const empty = emptySnapshot(); setDraft(normalize(empty)); void save(empty) } }}>Start with empty shared state</button>
      </section>}
      {canonical.snapshot && draft && <>
        {dirty && <p className="personal-notice">Pending edits are in this tab. Coaching and training load use the last server-confirmed state. Save, then refresh your other device.</p>}
        {pending.current && !remote && <p className="personal-notice">A save needs confirmation. Retry Save with the same request, or refresh to review server state. Editing is paused.</p>}
        <fieldset className="personal-editor" disabled={disabled || connectionFailed || !!remote || !!pending.current}>
          <legend>Recovery constraints</legend>
          <label><input type="checkbox" checked={draft.currentState.injury_present} onChange={event => update('currentState')({ ...draft.currentState, injury_present: event.target.checked, field_evidence: { ...draft.currentState.field_evidence, injury_present: { source: 'manual', quality: 'reported', observedAt: new Date().toISOString() } } })} /> Injury present</label>
          <label><input type="checkbox" checked={draft.currentState.illness_present} onChange={event => update('currentState')({ ...draft.currentState, illness_present: event.target.checked, field_evidence: { ...draft.currentState.field_evidence, illness_present: { source: 'manual', quality: 'reported', observedAt: new Date().toISOString() } } })} /> Illness present</label>
        </fieldset>
        <details className="personal-notice"><summary>Log a completed activity</summary><p>Only save completed work. Pending entries do not affect training load before server confirmation.</p>
          <form onSubmit={event => {
            event.preventDefault()
            const form = event.currentTarget
            const values = new FormData(form)
            const date = String(values.get('date'))
            const name = String(values.get('name')).trim()
            const durationSec = Number(values.get('minutes')) * 60
            if (!name || !date || !Number.isFinite(durationSec) || durationSec <= 0) return
            update('activities')(items => [...items, { id: crypto.randomUUID(), source: 'manual', date, name, type: String(values.get('sport')), durationSec }])
            form.reset()
          }}><fieldset disabled={disabled || connectionFailed || !!remote || !!pending.current}>
            <label>Activity name<input name="name" required maxLength={200} /></label>
            <label>Date<input name="date" type="date" required max={new Date().toISOString().slice(0, 10)} /></label>
            <label>Sport<select name="sport"><option>Ride</option><option>Run</option><option>Swim</option></select></label>
            <label>Minutes<input name="minutes" type="number" min="1" max="1440" required /></label>
            <button>Add to pending edits</button>
          </fieldset></form>
          <p>{draft.activities.length - canonical.snapshot.activities.length} pending activity entry/entries. The server must validate duplicates before confirming.</p>
        </details>
        <fieldset className="personal-app" disabled={disabled || connectionFailed || !!remote || !!pending.current}>
          <AerionInterface hosted confirmedSnapshot={canonical.snapshot} model={{
            races: draft.races, setRaces: update('races'), goals: draft.goals, setGoals: update('goals'),
            activeGoalId: draft.activeGoalId, setActiveGoalId: update('activeGoalId'), goalConversation: draft.goalConversation ?? [], setGoalConversation: update('goalConversation'),
            activities: canonical.snapshot.activities, setActivities: () => undefined,
            blockedDates: draft.blockedDates, setBlockedDates: update('blockedDates'), decisionLog: draft.decisionLog, setDecisionLog: update('decisionLog'),
            state: draft.currentState, setState: update('currentState'), theme: draft.theme, setTheme: update('theme'),
            account: { ...defaultAccount, status: 'signed-in', localOnly: false, displayName: session.owner.displayName }, setAccount: () => undefined,
            visualization: draft.visualization ?? defaultVisualization, setVisualization: update('visualization'),
            importSnapshot: () => { throw new Error('Use the protected migration flow') }, resetLocalData: () => undefined,
          } satisfies ReturnType<typeof useAerionState>} onServerSync={async () => {
            if (dirty) throw new Error('Save or resolve pending edits before syncing activities.')
            let count = 0
            const ok = await run(async () => { const next = await api.sync(crypto.randomUUID()); count = next.snapshot?.activities.length ?? 0; accept(next) })
            if (!ok) throw new Error('Sync was not confirmed. Check the shared-state status and retry.')
            return { source: 'Canonical server', records: count, message: 'Canonical server state refreshed after sync.' }
          }} />
        </fieldset>
      </>}
    </>}
  </div>
}
