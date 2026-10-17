import type { AerionLocalSnapshot } from '../components/DataControlsPanel'
import type { AerionStateSnapshot } from '../hooks/useAerionState'

type Row = Record<string, unknown>
type Check = (value: unknown) => boolean
const text: Check = v => typeof v === 'string'
const nonempty: Check = v => typeof v === 'string' && v.trim().length > 0
const bool: Check = v => typeof v === 'boolean'
const number: Check = v => typeof v === 'number' && Number.isFinite(v)
const nonnegative: Check = v => number(v) && (v as number) >= 0
const oneOf = (...values: unknown[]): Check => v => values.includes(v)
const nullable = (check: Check): Check => v => v === null || check(v)
const object: Check = v => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null)
const date: Check = v => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(v)) return false
  const day = new Date(`${v.slice(0, 10)}T00:00:00Z`)
  return Number.isFinite(Date.parse(v)) && Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === v.slice(0, 10)
}
const band = oneOf('Low', 'Medium', 'High', 'Extreme')
const source = oneOf('intervals', 'garmin', 'strava', 'manual', 'apple-health', 'google-fit', 'legacy-local', 'derived')
function fail(path: string): never { throw new Error(`Invalid AERION backup file: ${path}`) }
function record(value: unknown, path: string): Row {
  if (!object(value)) fail(path)
  return value as Row
}
function fields(row: Row, required: Record<string, Check>, optional: Record<string, Check>, path: string) {
  for (const [key, check] of Object.entries(required)) if (!check(row[key])) fail(`${path}.${key}`)
  for (const [key, check] of Object.entries(optional)) if (row[key] !== undefined && !check(row[key])) fail(`${path}.${key}`)
}
function collection(value: unknown, path: string, validate: (row: Row, path: string) => void): Row[] {
  if (!Array.isArray(value)) fail(path)
  const ids = new Set<string>()
  return value.map((value, index) => {
    const p = `${path}[${index}]`, row = record(value, p)
    if (!nonempty(row.id) || ids.has(row.id as string)) fail(`${p}.id`)
    ids.add(row.id as string)
    validate(row, p)
    return row
  })
}
const optionalText = (names: string[]) => Object.fromEntries(names.map(name => [name, text]))
const optionalNumbers = (names: string[], check = nonnegative) => Object.fromEntries(names.map(name => [name, check]))

/** Pure preflight: all validation completes before callers may replace local state. */
export function validateStateSnapshot(input: unknown): AerionStateSnapshot {
  const row = record(input, 'snapshot')
  if ('version' in row || 'exportedAt' in row) {
    if (!oneOf(1, 2)(row.version)) fail('version')
    if (!date(row.exportedAt)) fail('exportedAt')
  }
  fields(row, { theme: oneOf('dark', 'light') }, {}, 'snapshot')
  collection(row.races, 'races', (r, p) => fields(r, { date, name: nonempty, discipline: oneOf('cycling', 'running', 'triathlon', 'other'), priority: oneOf('fixed', 'optional'), mandatory: bool }, {
    ...optionalText(['dow', 'series', 'phase', 'notes']), format: oneOf('road', 'ITT', 'itt', 'stage', 'other'), route: nullable(text),
    ...optionalNumbers(['class', 'distanceKm', 'elevationM'], nullable(nonnegative)),
  }, p))
  const goals = collection(row.goals, 'goals', (r, p) => fields(r, {
    name: nonempty, type: oneOf('fixed-date-race', 'floating-goal', 'candidate-event', 'committed-race', 'mandatory-race', 'key-performance-goal'),
    discipline: oneOf('cycling', 'running', 'triathlon', 'endurance', 'other'), status: oneOf('draft', 'candidate', 'committed', 'key-event', 'mandatory'),
  }, { ...optionalText(['description', 'targetMetric', 'targetValue', 'notes']), targetDate: nullable(date), priority: oneOf('low', 'medium', 'high'), primaryMission: bool }, p))
  const goalIds = new Set(goals.map(goal => goal.id))
  if (row.activeGoalId !== undefined && (!nonempty(row.activeGoalId) || !goalIds.has(row.activeGoalId))) fail('activeGoalId')
  if (row.goalConversation !== undefined) collection(row.goalConversation, 'goalConversation', (r, p) => {
    fields(r, { goalId: v => nonempty(v) && goalIds.has(v), createdAt: date, kind: oneOf('answer', 'constraint', 'note', 'decision'), text }, { prompt: text }, p)
  })
  collection(row.activities, 'activities', (r, p) => fields(r, {
    source: oneOf('intervals', 'garmin', 'strava', 'manual'), date, name: nonempty, type: nonempty,
  }, { ...optionalNumbers(['durationSec', 'distanceM', 'load', 'avgHr', 'maxHr', 'normalizedPower', 'avgPower', 'raceCost']), raceCostBand: band }, p))
  collection(row.blockedDates, 'blockedDates', (r, p) => {
    fields(r, { startDate: date, endDate: date, reason: oneOf('travel', 'work', 'illness', 'injury', 'recovery', 'unavailable', 'other'), blocksRace: bool }, { notes: text }, p)
    if (Date.parse(r.startDate as string) > Date.parse(r.endDate as string)) fail(`${p}.endDate`)
  })
  collection(row.decisionLog, 'decisionLog', (r, p) => {
    fields(r, { date, loggedAt: date, action: oneOf('accepted', 'rested', 'overridden', 'scenario-race', 'scenario-rest', 'scenario-easy', 'scenario-ignore'),
      mode: oneOf('Build', 'Race', 'DamageControl', 'RecoveryOptimization', 'RaceBlock'), status: oneOf('Green', 'Yellow', 'Red', 'InjuryIllness'), workoutTitle: text, durationMin: nonnegative, reason: text,
    }, { ...optionalText(['note', 'nextRaceName', 'scenarioLabel']), ...optionalNumbers(['hrCap', 'powerCap']), scenarioId: oneOf('race', 'rest', 'easy', 'ignore') }, p)
    for (const key of ['scenarioExpectedCostRange', 'scenarioFatigueDeltaRange', 'scenarioRecoveryLagRange']) {
      if (r[key] === undefined) continue
      const range = record(r[key], `${p}.${key}`)
      fields(range, { low: number, high: number }, {}, `${p}.${key}`)
      if ((range.low as number) > (range.high as number)) fail(`${p}.${key}`)
    }
  })
  const state = record(row.currentState, 'currentState')
  const metrics = ['latest_race_cost', 'run_max_hr_6m', 'cycle_max_hr_6m', 'eftp_watts', 'resting_hr_14d_avg', 'hrv_14d_avg', 'sleep_hours_14d_avg', 'vo2max', 'sleep_score', 'recovery_score', 'body_weight_kg', 'garmin_body_battery', 'garmin_stress_avg', 'garmin_training_readiness', 'garmin_sleep_score', 'steps_7d_avg', 'recovery_time_hours', 'run_lthr', 'cycle_lthr', 'run_aet', 'cycle_aet']
  fields(state, { injury_present: bool, illness_present: bool, recovery_status: oneOf('green', 'yellow', 'red', 'unknown') }, {
    ...optionalNumbers(metrics, nullable(nonnegative)), race_today: bool, race_tomorrow: bool, last_updated: date,
    latest_race_cost_band: nullable(band), hrv_trend: nullable(oneOf('improving', 'stable', 'declining', 'unknown')),
    garmin_hrv_status: nullable(text), training_status: nullable(text), data_conflicts: v => Array.isArray(v) && v.every(text),
  }, 'currentState')
  if (state.field_evidence !== undefined) {
    const evidence = record(state.field_evidence, 'currentState.field_evidence')
    for (const [key, value] of Object.entries(evidence)) {
      const p = `currentState.field_evidence.${key}`
      const metadata = record(value, p)
      if (![...metrics, 'injury_present', 'illness_present', 'recovery_status', 'race_today', 'race_tomorrow', 'latest_race_cost_band', 'hrv_trend', 'garmin_hrv_status', 'training_status'].includes(key)) fail(p)
      fields(metadata, { source, quality: oneOf('reported', 'derived', 'legacy') }, { observedAt: date }, p)
    }
  }
  if (row.account !== undefined) fields(record(row.account, 'account'), { status: oneOf('local', 'signed-in'), displayName: text, localOnly: bool }, { email: text, lastChangedAt: date }, 'account')
  if (row.visualization !== undefined) {
    const visualization = record(row.visualization, 'visualization')
    fields(visualization, { performanceFocus: oneOf('all', 'load', 'race-cost', 'recovery', 'goal') }, {}, 'visualization')
    const visible = record(visualization.visibleFields, 'visualization.visibleFields')
    for (const [key, value] of Object.entries(visible)) if (!Array.isArray(value) || !value.every(nonempty)) fail(`visualization.visibleFields.${key}`)
  }
  // Replacement semantics; optional settings remain absent for the state boundary's defaults.
  return { ...row, goalConversation: row.goalConversation ?? [] } as AerionStateSnapshot
}

export function validateBackupSnapshot(input: unknown): AerionLocalSnapshot {
  const row = record(input, 'snapshot')
  if (!oneOf(1, 2)(row.version)) fail('version')
  if (!date(row.exportedAt)) fail('exportedAt')
  return validateStateSnapshot(row) as AerionLocalSnapshot
}
