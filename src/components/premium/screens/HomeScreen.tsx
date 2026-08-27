import { useMemo, useState } from 'react'
import { Activity, Brain, CalendarClock, Database, Flag, Gauge, LineChart as LineIcon, Plug, Settings2, ShieldCheck, Target, TimerReset, TrendingUp } from 'lucide-react'
import type { Race } from '../../../domain/types'
import { CommandPanel, EvidenceStrip, MetricTile, MiniTimeline, RouteRail, formatLabel, riskTone, toneFromStatus } from '../ui'
import type { PremiumCommandDeckProps, ScreenId } from '../types'

type Props = PremiumCommandDeckProps
type HomeLayout = 'coach-first' | 'mission-first' | 'data-first'

const quickLinks: Array<{ id: ScreenId; label: string; detail: string }> = [
  { id: 'training', label: 'Training', detail: 'do the work' },
  { id: 'goals', label: 'Goal Path', detail: 'mission setup' },
  { id: 'history', label: 'History', detail: 'proof log' },
  { id: 'recovery', label: 'Recovery', detail: 'risk controls' },
  { id: 'performance', label: 'Performance', detail: 'graphs' },
  { id: 'settings', label: 'Connect', detail: 'sources' },
]

function layoutLabel(layout: HomeLayout): string {
  if (layout === 'mission-first') return 'Mission'
  if (layout === 'data-first') return 'Data'
  return 'Coach'
}

export function HomeScreen(props: Props & { readyScore: number; nextRace?: Race; onNavigate?: (screen: ScreenId) => void }) {
  const { today, decision, recommendation, briefing, morningReadiness, next72Plan, stats, readyScore, nextRace, readiness, trajectory, learning, dailyRecommendation, marathonBlock, onNavigate } = props
  const [homeLayout, setHomeLayout] = useState<HomeLayout>('coach-first')
  const keySignal = readiness?.mainLimiter ?? `${stats.avgRaceCost} avg race cost · ${stats.highCostActivities} high-cost sessions`
  const safeNext = briefing.readinessAdjustment?.safeNextAction ?? briefing.nextAction
  const nextRaceText = nextRace ? `${nextRace.name} · ${nextRace.date}` : 'No fixed race loaded'
  const trajectoryConfidence = `${Math.round(trajectory.confidence * 100)}%`
  const learningSignal = learning.signals[0]
  const currentStance = useMemo(() => {
    if (decision.status === 'Red') return 'Hold the line. Recovery controls the day.'
    if (decision.status === 'Yellow') return 'Train, but keep the ceiling honest.'
    if (decision.status === 'InjuryIllness') return 'Health block. Fitness can wait, regrettably.'
    return 'Green enough to execute the recommendation.'
  }, [decision.status])
  const miniBars = trajectory.scenarios.slice(0, 4).map((scenario) => {
    const low = Math.abs(scenario.readinessDeltaRange.low)
    const high = Math.abs(scenario.readinessDeltaRange.high)
    const magnitude = Math.min(100, Math.max(12, (low + high) * 4))
    return { ...scenario, magnitude }
  })

  return (
    <section className={`premium-screen active home-screen ios-endurance-home layout-${homeLayout}`} aria-label="Home Mission Control">
      <div className="ios-home-topbar" aria-label="Home customization and status">
        <div>
          <p className="eyebrow">AERION / Home</p>
          <h2>Today at a glance</h2>
        </div>
        <div className="home-layout-switch" aria-label="Customize Home layout">
          <span><Settings2 size={13} strokeWidth={1.8} /> Customize</span>
          {(['coach-first', 'mission-first', 'data-first'] as HomeLayout[]).map((layout) => (
            <button key={layout} type="button" className={homeLayout === layout ? 'active' : ''} onClick={() => setHomeLayout(layout)}>{layoutLabel(layout)}</button>
          ))}
        </div>
      </div>

      <div className="ios-glance-grid">
        <CommandPanel
          eyebrow="How are we doing?"
          title={currentStance}
          summary={`Do now: ${dailyRecommendation.today.safeNext}. Goal: ${dailyRecommendation.goal.name}. Risk: ${next72Plan.risk}.`}
          aside={(
            <div className={`readiness-orb tone-${morningReadiness.tone}`} style={{ ['--score' as string]: `${readyScore * 3.6}deg` }}>
              <strong>{readyScore}</strong>
              <span>{morningReadiness.verdict}</span>
            </div>
          )}
        >
          <RouteRail labels={['state', 'action', 'next']} />
          <EvidenceStrip items={[
            { label: 'Status', value: decision.status, detail: decision.reasons[0] ?? 'No dominant constraint.', tone: toneFromStatus(decision) },
            { label: 'Today', value: dailyRecommendation.today.durationMin || 'Off', detail: dailyRecommendation.today.action, tone: morningReadiness.tone },
            { label: '72h risk', value: next72Plan.risk, detail: next72Plan.summary, tone: riskTone(next72Plan.risk) },
          ]} />
        </CommandPanel>

        <article className="ios-action-card">
          <span>What must we do?</span>
          <strong>{dailyRecommendation.today.action}</strong>
          <p>{safeNext}</p>
          <div className="ios-action-meta">
            <em>{recommendation.primary.durationMin || 'Off'} min</em>
            <em>{recommendation.primary.intensity}</em>
            <em>{formatLabel(decision.mode)}</em>
          </div>
          <button type="button" onClick={() => onNavigate?.('training')}>Open training plan</button>
        </article>
      </div>

      <div className="ios-home-links" aria-label="Quick navigation links">
        {quickLinks.map((link) => (
          <button key={link.id} type="button" onClick={() => onNavigate?.(link.id)}>
            <strong>{link.label}</strong>
            <span>{link.detail}</span>
          </button>
        ))}
      </div>

      <div className="ios-home-board" aria-label="Adjustable one-glance dashboard">
        <article className="ios-home-panel panel-mission">
          <div className="chart-title"><Target size={15} strokeWidth={1.8} /><span>Mission</span></div>
          <h3>{marathonBlock.active ? marathonBlock.mission : dailyRecommendation.goal.name}</h3>
          <p>{marathonBlock.active ? `${marathonBlock.daysToRace ?? 'TBD'} days · ${marathonBlock.phase} · long run ${marathonBlock.longRunPlacement.recommendation}` : dailyRecommendation.goal.nextFocus}</p>
          <div className="mission-stat-row">
            <span><strong>{dailyRecommendation.goal.readiness ?? readyScore}</strong><em>readiness</em></span>
            <span><strong>{trajectory.readinessRange.low}–{trajectory.readinessRange.high}</strong><em>21d range</em></span>
            <span><strong>{trajectory.direction}</strong><em>trajectory</em></span>
          </div>
        </article>

        <article className="ios-home-panel panel-week">
          <div className="chart-title"><CalendarClock size={15} strokeWidth={1.8} /><span>This week</span></div>
          <h3>{dailyRecommendation.week.focus}</h3>
          <ul>{dailyRecommendation.week.structure.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        <article className="ios-home-panel panel-graphs">
          <div className="chart-title"><TrendingUp size={15} strokeWidth={1.8} /><span>Useful signals</span></div>
          <div className="ios-mini-bars" aria-label="Trajectory scenario chart">
            {miniBars.map((scenario) => (
              <span key={scenario.id} style={{ ['--bar' as string]: `${scenario.magnitude}%` }}>
                <em>{scenario.label}</em>
                <i />
                <strong>{scenario.readinessDeltaRange.low > 0 ? '+' : ''}{scenario.readinessDeltaRange.low}–{scenario.readinessDeltaRange.high}</strong>
              </span>
            ))}
          </div>
          <p>{trajectory.dominantConstraint} · {trajectoryConfidence} confidence</p>
        </article>

        <article className="ios-home-panel panel-next72">
          <div className="chart-title"><TimerReset size={15} strokeWidth={1.8} /><span>Next 72h</span></div>
          <MiniTimeline plan={next72Plan} />
        </article>

        <article className="ios-home-panel panel-data">
          <div className="chart-title"><Database size={15} strokeWidth={1.8} /><span>Evidence</span></div>
          <h3>{learningSignal?.label ?? 'Pattern density low'}</h3>
          <p>{learningSignal?.observation ?? 'AERION is collecting actual-completed evidence before adapting harder.'}</p>
          <div className="learning-ledger-row">
            <span>{learning.sampleSize.activities} activities</span>
            <span>{learning.sampleSize.decisions} decisions</span>
            <span>{learning.sampleSize.evidence} evidence</span>
          </div>
        </article>

        <article className="ios-home-panel panel-connect">
          <div className="chart-title"><Plug size={15} strokeWidth={1.8} /><span>Connect next</span></div>
          <h3>{dailyRecommendation.connect.primary}</h3>
          <p>{dailyRecommendation.connect.action}</p>
          <button type="button" onClick={() => onNavigate?.('settings')}>Open Connect</button>
        </article>
      </div>

      <div className="home-priority-grid compact-system-grid ios-stat-strip">
        <MetricTile icon={Gauge} label="Today’s recommendation" value={formatLabel(decision.mode)} detail={`${recommendation.primary.title} · ${recommendation.primary.durationMin || 'Off'} min`} tone={toneFromStatus(decision)} />
        <MetricTile icon={ShieldCheck} label="Morning readiness" value={morningReadiness.verdict} detail={morningReadiness.primaryAction} tone={morningReadiness.tone} />
        <MetricTile icon={Flag} label="Next fixed race" value={nextRace?.name ?? 'None'} detail={nextRaceText} tone="blue" />
        <MetricTile icon={Activity} label="History load" value={stats.avgRaceCost || readyScore} detail={`${stats.highCostActivities} high-cost sessions · ${keySignal}`} tone="slate" />
        <MetricTile icon={LineIcon} label="Long-term" value={trajectory.direction} detail={dailyRecommendation.longTerm.stance} tone="blue" />
        <MetricTile icon={Brain} label="Coach" value={briefing.headline} detail={briefing.status} tone={morningReadiness.tone} />
      </div>

      <p className="premium-footnote">Home answers in one glance: how it stands, what to do now, why, where to go next, and which panel to adjust.</p>
    </section>
  )
}
