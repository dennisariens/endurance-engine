import { useMemo, useState } from 'react'
import { Activity, CalendarDays, ClipboardList, HeartPulse, Moon, Route, Watch } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aerionChartTheme, chartAxis, chartTooltip } from '../../../design/tokens'
import type { Activity as ActivityType, DecisionLogEntry, Race } from '../../../domain/types'
import { buildActivityHistorySeries, buildHealthMetricSeries, deriveTrainingStatus } from '../charts/chartData'
import { TelemetryChartShell as ChartShell } from '../charts/TelemetryChartShell'
import { MetricTile, RouteRail } from '../ui'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps
type HistoryFilter = 'agenda' | 'activities' | 'rides' | 'runs' | 'logs' | 'health'

type TimelineEntry = {
  id: string
  date: string
  kind: 'race' | 'activity' | 'log'
  title: string
  detail: string
  meta: string
}

function activityMatches(filter: HistoryFilter, activity: ActivityType): boolean {
  const type = activity.type.toLowerCase()
  if (filter === 'rides') return type.includes('ride') || type.includes('bike') || type.includes('cycling')
  if (filter === 'runs') return type.includes('run')
  return filter === 'activities'
}

function buildTimeline(today: string, races: Race[], activities: ActivityType[], decisionLog: DecisionLogEntry[], filter: HistoryFilter): TimelineEntry[] {
  const agenda = races.map((race) => ({
    id: race.id,
    date: race.date,
    kind: 'race' as const,
    title: race.name,
    detail: `${race.series ?? 'Race'} · ${race.discipline} · ${race.distanceKm ?? 'TBD'} km`,
    meta: race.mandatory ? 'fixed race' : 'optional',
  }))
  const activityItems = activities.map((activity) => ({
    id: activity.id,
    date: activity.date,
    kind: 'activity' as const,
    title: activity.name,
    detail: `${activity.type} · ${activity.durationSec ? Math.round(activity.durationSec / 60) : 'n/a'} min · ${activity.distanceM ? Math.round(activity.distanceM / 1000) : 'n/a'} km`,
    meta: `${activity.source} · load ${activity.load ?? activity.raceCost ?? 'n/a'} · HR ${activity.avgHr ?? 'n/a'}`,
  }))
  const logs = decisionLog.map((entry) => ({
    id: entry.id,
    date: entry.date,
    kind: 'log' as const,
    title: entry.scenarioLabel ?? entry.workoutTitle,
    detail: entry.note ?? entry.reason,
    meta: `${entry.action} · ${entry.status}`,
  }))
  const pool = filter === 'agenda'
    ? [...agenda, ...activityItems, ...logs]
    : filter === 'logs'
      ? logs
      : filter === 'health'
        ? [...activityItems, ...logs]
        : activityItems.filter((activity) => activityMatches(filter, activities.find((item) => item.id === activity.id) as ActivityType))
  return pool
    .sort((a, b) => Math.abs(new Date(`${a.date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) - Math.abs(new Date(`${b.date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()))
    .slice(0, 10)
}

export function HistoryScreen({ today, activities, races, decisionLog, state, visualization, onUpdateVisualization }: Props) {
  const [filter, setFilter] = useState<HistoryFilter>('agenda')
  const activitySeries = useMemo(() => buildActivityHistorySeries(activities), [activities])
  const healthSeries = useMemo(() => buildHealthMetricSeries(state), [state])
  const trainingStatus = useMemo(() => deriveTrainingStatus(state, activities), [state, activities])
  const timeline = useMemo(() => buildTimeline(today, races, activities, decisionLog, filter), [today, races, activities, decisionLog, filter])
  const nextRace = [...races].filter((race) => race.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]
  const hardActivities = activities.filter((activity) => (activity.raceCost ?? activity.load ?? 0) >= 70).length
  const historyFields = visualization.visibleFields.history ?? ['load', 'distanceKm', 'durationMin', 'avgHr']
  const healthFields = visualization.visibleFields['health-history'] ?? ['hr', 'hrv', 'sleep', 'vo2max', 'steps', 'readiness', 'recoveryTime']
  const toggleField = (chart: string, field: string) => {
    const current = visualization.visibleFields[chart] ?? []
    const next = current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
    onUpdateVisualization({ ...visualization, visibleFields: { ...visualization.visibleFields, [chart]: next.length ? next : [field] } })
  }

  return (
    <section className="premium-screen active history-screen">
      <div className="history-command-header">
        <div>
          <p className="eyebrow">History</p>
          <h2>Control log.</h2>
          <p>Agenda, activity proof, decision log, and body signals in one view. Less scavenger hunt, more control room.</p>
          <RouteRail labels={['agenda', 'proof', 'body']} />
        </div>
        <div className={`history-status-card tone-${trainingStatus.tone}`}>
          <span>Training status</span>
          <strong>{trainingStatus.label}</strong>
          <p>{trainingStatus.detail}</p>
        </div>
      </div>

      <div className="history-snapshot-strip" aria-label="One-glance history overview">
        <article><span>Next agenda</span><strong>{nextRace?.name ?? 'None'}</strong><em>{nextRace ? `${nextRace.date} · ${nextRace.distanceKm ?? 'TBD'} km` : 'No fixed pressure'}</em></article>
        <article><span>Activities</span><strong>{activities.length}</strong><em>{hardActivities} high-load / race-like</em></article>
        <article><span>Readiness</span><strong>{state.garmin_training_readiness ?? state.recovery_score ?? 'n/a'}</strong><em>recovery time {state.recovery_time_hours ?? 'est. 24–72'}h</em></article>
        <article><span>Body</span><strong>{state.hrv_14d_avg ?? 'n/a'} HRV</strong><em>sleep {state.sleep_hours_14d_avg ?? 'n/a'}h · VO2 {state.vo2max ?? 'n/a'}</em></article>
      </div>

      <div className="premium-training-grid paginated-grid history-kpi-row">
        <MetricTile label="Agenda" value={races.length} detail="fixed and optional events loaded" tone="slate" icon={CalendarDays} />
        <MetricTile label="Training readiness" value={state.garmin_training_readiness ?? state.recovery_score ?? 'n/a'} detail={`Status ${trainingStatus.label}`} tone={trainingStatus.tone} icon={HeartPulse} />
        <MetricTile label="Sleep / HRV" value={`${state.sleep_hours_14d_avg ?? 'n/a'}h`} detail={`HRV ${state.hrv_14d_avg ?? 'n/a'} · RHR ${state.resting_hr_14d_avg ?? 'n/a'}`} tone="blue" icon={Moon} />
        <MetricTile label="Activities" value={activities.length} detail="rides, runs, activity proof" tone="blue" icon={Activity} />
      </div>

      <div className="chart-option-bar history-filter-bar" aria-label="History overview split options">
        {(['agenda', 'activities', 'rides', 'runs', 'logs', 'health'] as const).map((item) => <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
      </div>

      <div className="history-layout">
        <div className="history-log-panel">
          <div className="chart-title"><ClipboardList size={15} strokeWidth={1.8} /><span>Agenda / log</span></div>
          {timeline.map((item) => <article key={`${item.kind}-${item.id}`} className={`history-row kind-${item.kind}`}>
            <span>{item.date}</span>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
            <em>{item.meta}</em>
          </article>)}
        </div>

        <div className="history-chart-stack">
          <ChartShell title="Activity split metrics" icon={Route} description="Load, duration, distance, HR, and estimated recovery time by completed activity." fields={historyFields} actions={['load', 'distanceKm', 'durationMin', 'avgHr', 'recoveryTime'].map((field) => <button key={field} type="button" className={historyFields.includes(field) ? 'active' : ''} onClick={() => toggleField('history', field)}>{field}</button>)}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activitySeries} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={aerionChartTheme.grid} vertical={false} />
                <XAxis dataKey="label" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip {...chartTooltip} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ color: aerionChartTheme.axis, fontSize: 11 }} />
                {historyFields.includes('load') && <Line name="Load" dataKey="load" stroke={aerionChartTheme.series.atl} strokeWidth={3} dot={false} />}
                {historyFields.includes('distanceKm') && <Line name="Distance km" dataKey="distanceKm" stroke={aerionChartTheme.series.stage} strokeWidth={3} dot={false} />}
                {historyFields.includes('durationMin') && <Line name="Duration min" dataKey="durationMin" stroke={aerionChartTheme.series.cumulative} strokeWidth={2.4} dot={false} />}
                {historyFields.includes('avgHr') && <Line name="Avg HR" dataKey="avgHr" stroke={aerionChartTheme.series.risk} strokeWidth={2.4} dot={false} />}
                {historyFields.includes('recoveryTime') && <Line name="Recovery h" dataKey="recoveryTime" stroke={aerionChartTheme.series.drift} strokeWidth={2.4} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </ChartShell>

          <ChartShell title="Health and readiness history" icon={Moon} description="HR, HRV, sleep, steps, VO2max, training readiness, and recovery time from normalized health state." fields={healthFields} actions={['hr', 'hrv', 'sleep', 'vo2max', 'steps', 'readiness', 'recoveryTime'].map((field) => <button key={field} type="button" className={healthFields.includes(field) ? 'active' : ''} onClick={() => toggleField('health-history', field)}>{field}</button>)}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={healthSeries} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={aerionChartTheme.grid} vertical={false} />
                <XAxis dataKey="label" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip {...chartTooltip} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ color: aerionChartTheme.axis, fontSize: 11 }} />
                {healthFields.includes('hr') && <Bar name="RHR" dataKey="hr" fill={aerionChartTheme.series.risk} radius={[8, 8, 0, 0]} />}
                {healthFields.includes('hrv') && <Bar name="HRV" dataKey="hrv" fill={aerionChartTheme.series.durability} radius={[8, 8, 0, 0]} />}
                {healthFields.includes('sleep') && <Bar name="Sleep h" dataKey="sleep" fill={aerionChartTheme.series.stage} radius={[8, 8, 0, 0]} />}
                {healthFields.includes('vo2max') && <Bar name="VO2max" dataKey="vo2max" fill={aerionChartTheme.series.ctl} radius={[8, 8, 0, 0]} />}
                {healthFields.includes('steps') && <Bar name="Steps / 1000" dataKey="steps" fill={aerionChartTheme.series.cumulative} radius={[8, 8, 0, 0]} />}
                {healthFields.includes('readiness') && <Bar name="Readiness" dataKey="readiness" fill={aerionChartTheme.series.readiness} radius={[8, 8, 0, 0]} />}
                {healthFields.includes('recoveryTime') && <Bar name="Recovery h" dataKey="recoveryTime" fill={aerionChartTheme.series.drift} radius={[8, 8, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>
      </div>
    </section>
  )
}
