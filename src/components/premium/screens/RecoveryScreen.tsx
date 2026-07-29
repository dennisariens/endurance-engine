import { ShieldCheck, TimerReset } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aerionChartTheme, chartAxis, chartTooltip } from '../../../design/tokens'
import { buildReadinessSignals, buildRecoveryLagSeries } from '../charts/chartData'
import { TelemetryChartShell as ChartShell } from '../charts/TelemetryChartShell'
import { MiniTimeline } from '../ui'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

export function RecoveryScreen({ state, morningReadiness, next72Plan, visualization, onUpdateVisualization }: Props) {
  const recoveryData = buildReadinessSignals(state)
  const lagData = buildRecoveryLagSeries(next72Plan)
  const fieldsFor = (chart: string, fallback: string[]) => visualization.visibleFields[chart] ?? fallback
  const toggleField = (chart: string, field: string) => {
    const current = fieldsFor(chart, [])
    const next = current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
    onUpdateVisualization({ ...visualization, visibleFields: { ...visualization.visibleFields, [chart]: next.length ? next : [field] } })
  }
  const lagFields = fieldsFor('recovery-lag', ['lag', 'risk'])

  return (
    <section className="premium-screen active">
      <div className="premium-screen-header compact-header"><p className="eyebrow">Recovery</p><h2>Protection layer.</h2><p>{morningReadiness.headline}</p></div>
      <div className="chart-option-bar compact" aria-label="Recovery data fields">
        {['signals', 'lag', 'risk'].map((field) => <button key={field} type="button" className={(field === 'signals' ? fieldsFor('recovery-signals', ['signals']) : lagFields).includes(field) ? 'active' : ''} onClick={() => field === 'signals' ? toggleField('recovery-signals', field) : toggleField('recovery-lag', field)}>{field}</button>)}
      </div>
      <div className="chart-grid two">
        <ChartShell title="Readiness signals" icon={ShieldCheck} fields={fieldsFor('recovery-signals', ['signals'])}>
          <ResponsiveContainer width="100%" height={240}><BarChart data={recoveryData} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}><CartesianGrid stroke={aerionChartTheme.grid} vertical={false} /><XAxis dataKey="label" {...chartAxis} /><YAxis {...chartAxis} /><Tooltip {...chartTooltip} />{fieldsFor('recovery-signals', ['signals']).includes('signals') && <Bar dataKey="value" fill={aerionChartTheme.series.stage} radius={[8, 8, 0, 0]} />}</BarChart></ResponsiveContainer>
        </ChartShell>
        <ChartShell title="Recovery lag projection" icon={TimerReset} fields={lagFields}>
          <ResponsiveContainer width="100%" height={240}><AreaChart data={lagData} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}><CartesianGrid stroke={aerionChartTheme.grid} vertical={false} /><XAxis dataKey="label" {...chartAxis} /><YAxis {...chartAxis} /><Tooltip {...chartTooltip} />{lagFields.includes('lag') && <Area dataKey="lag" stroke={aerionChartTheme.series.drift} fill={aerionChartTheme.area.lag} strokeWidth={2} />}{lagFields.includes('risk') && <Line dataKey="risk" stroke={aerionChartTheme.series.risk} strokeWidth={2} dot={false} />}</AreaChart></ResponsiveContainer>
        </ChartShell>
      </div>
      <MiniTimeline plan={next72Plan} />
    </section>
  )
}
