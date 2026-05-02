import type { DashboardStats } from '../engine/statsEngine'

type Props = { stats: DashboardStats }

function toneFor(value: number, variant?: 'cost' | 'pressure') {
  if (variant === 'pressure') return value >= 5 ? 'fill-extreme' : value >= 3 ? 'fill-high' : value >= 2 ? 'fill-medium' : 'fill-low'
  return value >= 80 ? 'fill-extreme' : value >= 60 ? 'fill-high' : value >= 40 ? 'fill-medium' : 'fill-low'
}

function Bars({ data, max, suffix = '', variant }: { data: Array<{ label: string; value?: number; count?: number }>; max?: number; suffix?: string; variant?: 'cost' | 'pressure' }) {
  const peak = max ?? Math.max(1, ...data.map((item) => item.value ?? item.count ?? 0))
  return (
    <div className="bars">
      {data.map((item, index) => {
        const value = item.value ?? item.count ?? 0
        return (
          <div className="bar-row" key={`${item.label}-${index}`} title={`${item.label}: ${value}${suffix}`}>
            <span>{item.label}</span>
            <div className="bar-track"><div className={`bar-fill ${toneFor(value, variant)}`} style={{ width: `${Math.max(4, (value / peak) * 100)}%` }} /></div>
            <strong>{value}{suffix}</strong>
          </div>
        )
      })}
    </div>
  )
}

export function StatsPanel({ stats }: Props) {
  return (
    <section className="panel stats-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Useful stats</p>
          <h2>Load, density, and race pressure</h2>
        </div>
      </div>
      <div className="stat-summary">
        <div><span>Races next 7d</span><strong>{stats.racesNext7d}</strong></div>
        <div><span>Races next 30d</span><strong>{stats.racesNext30d}</strong></div>
        <div><span>Avg cost</span><strong>{stats.avgRaceCost}</strong></div>
        <div><span>High/extreme</span><strong>{stats.highCostActivities}</strong></div>
      </div>
      <div className="stats-grid">
        <div>
          <h3>Race density</h3>
          <p className="chart-note">More races = less room for training load.</p>
          <Bars data={stats.weeklyRaceDensity} variant="pressure" />
        </div>
        <div>
          <h3>Recent race cost</h3>
          <p className="chart-note">0–39 low · 40–59 medium · 60–79 high · 80+ extreme.</p>
          <Bars data={stats.raceCostSeries} max={100} variant="cost" />
        </div>
      </div>
      <div className="mix-row">
        {stats.disciplineMix.map((item) => <span className="pill slate" key={item.label}>{item.label}: {item.value}</span>)}
        <span className="pill blue">Fixed races loaded: {stats.fixedRaceCount}</span>
      </div>
    </section>
  )
}
