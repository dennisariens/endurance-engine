import { BarChart3, Target } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aerionChartTheme, chartAxis, chartTooltip } from '../../../design/tokens'
import type { ChartFocus } from '../../../domain/types'
import { buildDriftDurabilitySeries, buildLoadSeries, buildRaceCostTrend, buildReadinessTrajectory } from '../charts/chartData'
import { TelemetryChartShell as ChartShell } from '../charts/TelemetryChartShell'
import { EvidenceStrip, RouteRail } from '../ui'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

export function PerformanceScreen({ stats, state, readiness, visualization, onUpdateVisualization }: Props) {
  const focus = visualization.performanceFocus
  const raceCost = buildRaceCostTrend(stats, state)
  const loadData = buildLoadSeries(raceCost, state)
  const latestLoad = loadData[loadData.length - 1]
  const driftData = buildDriftDurabilitySeries(raceCost)
  const readinessTrajectory = buildReadinessTrajectory(readiness)
  const isVisible = (target: ChartFocus) => focus === 'all' || focus === target
  const setFocus = (performanceFocus: ChartFocus) => onUpdateVisualization({ ...visualization, performanceFocus })
  const fieldsFor = (chart: string, fallback: string[]) => visualization.visibleFields[chart] ?? fallback
  const toggleField = (chart: string, field: string) => {
    const current = fieldsFor(chart, [])
    const next = current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
    onUpdateVisualization({ ...visualization, visibleFields: { ...visualization.visibleFields, [chart]: next.length ? next : [field] } })
  }

  return (
    <section className="premium-screen active">
      <div className="premium-screen-header compact-header">
        <p className="eyebrow">Performance</p>
        <h2>Telemetry depth, restrained.</h2>
        <p>Load, race cost, drift, durability, repeatability, and goal trajectory without turning the product into spreadsheet soup.</p>
        <RouteRail labels={['load', 'cost', 'form']} />
      </div>
      <EvidenceStrip items={[
        { label: 'Fitness', value: latestLoad?.ctl ?? 'n/a', detail: 'longer-term load signal', tone: 'blue' },
        { label: 'Fatigue', value: latestLoad?.atl ?? 'n/a', detail: 'short-term load pressure', tone: 'yellow' },
        { label: 'Form', value: latestLoad?.tsb ?? 'n/a', detail: 'freshness before quality work', tone: 'slate' },
        { label: 'Readiness', value: state.garmin_training_readiness ?? state.recovery_score ?? 'n/a', detail: 'body-side constraint', tone: 'green' },
      ]} />
      <div className="chart-option-bar" aria-label="Performance visualisation options">
        {(['all', 'load', 'race-cost', 'recovery', 'goal'] as const).map((item) => (
          <button key={item} type="button" className={focus === item ? 'active' : ''} onClick={() => setFocus(item)}>{item.replace('-', ' ')}</button>
        ))}
      </div>
      <div className="chart-grid two">
        {isVisible('load') && <ChartShell title="Load balance" description="Fitness, fatigue, and form-style balance. Use this as direction, not gospel." fields={fieldsFor('load', ['ctl', 'atl', 'tsb'])} actions={['ctl', 'atl', 'tsb'].map((field) => <button key={field} type="button" className={fieldsFor('load', ['ctl', 'atl', 'tsb']).includes(field) ? 'active' : ''} onClick={() => toggleField('load', field)}>{field}</button>)}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={loadData} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={aerionChartTheme.grid} vertical={false} />
              <XAxis dataKey="label" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ color: aerionChartTheme.axis, fontSize: 11 }} />
              <ReferenceLine y={0} stroke={aerionChartTheme.grid} strokeDasharray="4 4" />
              {fieldsFor('load', ['ctl', 'atl', 'tsb']).includes('ctl') && <Line name="Fitness" dataKey="ctl" stroke={aerionChartTheme.series.ctl} strokeWidth={2.4} dot={false} />}
              {fieldsFor('load', ['ctl', 'atl', 'tsb']).includes('atl') && <Line name="Fatigue" dataKey="atl" stroke={aerionChartTheme.series.atl} strokeWidth={2.4} dot={false} />}
              {fieldsFor('load', ['ctl', 'atl', 'tsb']).includes('tsb') && <Line name="Form" dataKey="tsb" stroke={aerionChartTheme.series.tsb} strokeWidth={2.4} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>}
        {isVisible('race-cost') && <ChartShell title="Race cost trend" icon={BarChart3} description="Completed work cost trend. Actual logged activities remain authoritative." fields={['cost', 'high-cost flags', 'trend']}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={raceCost} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
              <defs><linearGradient id="raceCostGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={aerionChartTheme.series.raceCost} stopOpacity={0.5}/><stop offset="100%" stopColor={aerionChartTheme.series.raceCost} stopOpacity={0.04}/></linearGradient></defs>
              <CartesianGrid stroke={aerionChartTheme.grid} vertical={false} />
              <XAxis dataKey="label" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              <ReferenceLine y={70} stroke={aerionChartTheme.series.risk} strokeDasharray="5 5" label={{ value: 'high cost', fill: aerionChartTheme.axis, fontSize: 10 }} />
              <Area name="Race cost" dataKey="value" stroke={aerionChartTheme.series.raceCost} fill="url(#raceCostGradient)" strokeWidth={2.4} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>}
        {isVisible('recovery') && <ChartShell title="HR drift / durability proxy" description="Durability should rise while drift stays controlled. Useful once Garmin/Strava evidence improves." fields={fieldsFor('recovery', ['drift', 'durability'])} actions={['drift', 'durability'].map((field) => <button key={field} type="button" className={fieldsFor('recovery', ['drift', 'durability']).includes(field) ? 'active' : ''} onClick={() => toggleField('recovery', field)}>{field}</button>)}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={driftData} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={aerionChartTheme.grid} vertical={false} />
              <XAxis dataKey="label" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ color: aerionChartTheme.axis, fontSize: 11 }} />
              {fieldsFor('recovery', ['drift', 'durability']).includes('drift') && <Line name="HR drift" dataKey="drift" stroke={aerionChartTheme.series.drift} strokeWidth={2.4} dot={false} />}
              {fieldsFor('recovery', ['drift', 'durability']).includes('durability') && <Line name="Durability" dataKey="durability" stroke={aerionChartTheme.series.durability} strokeWidth={2.4} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>}
        {isVisible('goal') && <ChartShell title="Goal readiness trajectory" icon={Target} description="Forward readiness estimate shown as a range-oriented planning signal, not certainty." fields={['readiness', 'confidence', 'limiter']}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={readinessTrajectory} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={aerionChartTheme.grid} vertical={false} />
              <XAxis dataKey="label" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip {...chartTooltip} />
              <ReferenceLine y={75} stroke={aerionChartTheme.series.durability} strokeDasharray="5 5" label={{ value: 'ready range', fill: aerionChartTheme.axis, fontSize: 10 }} />
              <Area name="Readiness" dataKey="readiness" stroke={aerionChartTheme.series.readiness} fill={aerionChartTheme.area.readiness} strokeWidth={2.4} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>}
      </div>
    </section>
  )
}
