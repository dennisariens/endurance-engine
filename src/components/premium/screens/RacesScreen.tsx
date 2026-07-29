import { CalendarDays } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aerionChartTheme, chartAxis, chartTooltip } from '../../../design/tokens'
import { buildStageCumulativeSeries } from '../charts/chartData'
import { TelemetryChartShell as ChartShell } from '../charts/TelemetryChartShell'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

export function RacesScreen({ today, races, decision, stats, next72Plan, visualization, onUpdateVisualization }: Props) {
  const nextRaces = [...races].filter((race) => race.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8)
  const cumulative = buildStageCumulativeSeries(stats)
  const raceFields = visualization.visibleFields.races ?? ['stages', 'cumulative']
  const toggleRaceField = (field: string) => {
    const next = raceFields.includes(field) ? raceFields.filter((item) => item !== field) : [...raceFields, field]
    onUpdateVisualization({ ...visualization, visibleFields: { ...visualization.visibleFields, races: next.length ? next : [field] } })
  }

  return (
    <section className="premium-screen active">
      <div className="premium-screen-header compact-header"><p className="eyebrow">Races</p><h2>Fixed calendar. Adaptive consequences.</h2><p>Mandatory events remain fixed unless injury or illness exists. Everything around them adapts.</p></div>
      <div className="chart-option-bar compact" aria-label="Race visualisation fields">
        {['stages', 'cumulative'].map((field) => <button key={field} type="button" className={raceFields.includes(field) ? 'active' : ''} onClick={() => toggleRaceField(field)}>{field}</button>)}
      </div>
      <div className="race-layout">
        <div className="premium-race-list paginated">
          {nextRaces.map((race) => <article key={race.id}><span>{race.date}</span><strong>{race.name}</strong><p>{race.series ?? 'Race'} · {race.discipline} · {race.distanceKm ?? 'TBD'} km · Class {race.class ?? 'TBD'}</p><em>{race.mandatory ? 'A-priority fixed race' : 'Optional race'}</em></article>)}
        </div>
        <ChartShell title="Stage / race block cumulative cost" icon={CalendarDays} fields={raceFields}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cumulative} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={aerionChartTheme.grid} vertical={false} />
              <XAxis dataKey="label" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              {raceFields.includes('stages') && <Bar dataKey="stages" fill={aerionChartTheme.series.stage} radius={[8, 8, 0, 0]} />}
              {raceFields.includes('cumulative') && <Bar dataKey="cumulative" fill={aerionChartTheme.series.cumulative} radius={[8, 8, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
      <div className="race-rule-card"><strong>{decision.nextRace?.name ?? 'No next race'}</strong><p>{next72Plan.summary}</p></div>
    </section>
  )
}
