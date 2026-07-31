import { Activity, Brain, Database, Flag, Gauge, LineChart as LineIcon, ShieldCheck, TimerReset, TrendingUp } from 'lucide-react'
import type { Race } from '../../../domain/types'
import { CommandPanel, EvidenceStrip, MetricTile, MiniTimeline, RouteRail, formatLabel, riskTone, toneFromStatus } from '../ui'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

export function HomeScreen(props: Props & { readyScore: number; nextRace?: Race }) {
  const { today, decision, recommendation, briefing, morningReadiness, next72Plan, stats, readyScore, nextRace, readiness, trajectory, learning } = props
  const keySignal = readiness?.mainLimiter ?? `${stats.avgRaceCost} avg race cost · ${stats.highCostActivities} high-cost sessions`
  const safeNext = briefing.readinessAdjustment?.safeNextAction ?? briefing.nextAction
  const consequence = briefing.consequence ?? next72Plan.summary
  const nextRaceText = nextRace ? `${nextRace.name} · ${nextRace.date}` : 'No fixed race loaded'
  const distanceText = nextRace?.distanceKm ? `${nextRace.distanceKm} km` : 'distance tbd'
  const trajectoryConfidence = `${Math.round(trajectory.confidence * 100)}%`
  const learningSignal = learning.signals[0]
  return (
    <section className="premium-screen active home-screen" aria-label="Home Mission Control">
      <CommandPanel
        eyebrow="AERION / Today"
        title={formatLabel(decision.mode)}
        summary={`${decision.today} · ${recommendation.primary.title} · ${recommendation.primary.durationMin || 'Off'} min`}
        aside={(
          <div className={`readiness-orb tone-${morningReadiness.tone}`} style={{ ['--score' as string]: `${readyScore * 3.6}deg` }}>
            <strong>{readyScore}</strong>
            <span>{morningReadiness.verdict}</span>
          </div>
        )}
      >
        <RouteRail labels={['state', 'risk', 'next']} />
        <EvidenceStrip items={[
          { label: 'Why', value: 'Signal', detail: decision.reasons[0] ?? briefing.status, tone: toneFromStatus(decision) },
          { label: 'Safe next', value: recommendation.primary.durationMin || 'Off', detail: safeNext, tone: morningReadiness.tone },
          { label: 'If ignored', value: next72Plan.risk, detail: consequence, tone: riskTone(next72Plan.risk) },
        ]} />
        <div className="home-race-card compact">
          <span>Next fixed marker</span>
          <strong>{nextRace?.name ?? 'No race loaded'}</strong>
          <p>{nextRace ? `${nextRace.date} · ${distanceText}` : 'No agenda pressure in the system.'}</p>
        </div>
      </CommandPanel>

      <div className="home-command-strip" aria-label="One-glance command overview">
        <article><span>Now</span><strong>{morningReadiness.verdict}</strong><em>{morningReadiness.primaryAction}</em></article>
        <article><span>Train</span><strong>{recommendation.primary.durationMin || 'Off'} min</strong><em>{recommendation.primary.title}</em></article>
        <article><span>Trajectory</span><strong>{trajectory.direction}</strong><em>{trajectory.readinessRange.low}–{trajectory.readinessRange.high} readiness · {trajectoryConfidence}</em></article>
        <article><span>Learning</span><strong>{learning.signals.length}</strong><em>{learningSignal?.label ?? 'Pattern density low'}</em></article>
      </div>

      <div className="mission-control-core" aria-label="Mission Control intelligence layer">
        <article className="mission-trajectory-panel">
          <div className="chart-title"><TrendingUp size={15} strokeWidth={1.8} /><span>Trajectory Engine</span></div>
          <div className="trajectory-range"><strong>{trajectory.readinessRange.low}–{trajectory.readinessRange.high}</strong><span>21d readiness range</span></div>
          <p>{trajectory.dominantConstraint}</p>
          <div className="trajectory-scenario-row">
            {trajectory.scenarios.map((scenario) => (
              <span key={scenario.id}>{scenario.label}: {scenario.readinessDeltaRange.low > 0 ? '+' : ''}{scenario.readinessDeltaRange.low}–{scenario.readinessDeltaRange.high}</span>
            ))}
          </div>
        </article>
        <article className="mission-learning-panel">
          <div className="chart-title"><Database size={15} strokeWidth={1.8} /><span>Learning Engine / Evidence Store</span></div>
          <h3>{learningSignal?.label ?? 'Pattern density low'}</h3>
          <p>{learningSignal?.observation ?? 'AERION is collecting actual-completed evidence before adapting harder.'}</p>
          <div className="learning-ledger-row">
            <span>{learning.sampleSize.activities} activities</span>
            <span>{learning.sampleSize.decisions} decisions</span>
            <span>{learning.sampleSize.evidence} evidence records</span>
          </div>
        </article>
      </div>

      <div className="home-priority-grid compact-system-grid">
        <MetricTile icon={Gauge} label="Today’s recommendation" value={formatLabel(decision.mode)} detail={`${recommendation.primary.title} · ${recommendation.primary.durationMin || 'Off'} min`} tone={toneFromStatus(decision)} />
        <MetricTile icon={ShieldCheck} label="Morning readiness" value={morningReadiness.verdict} detail={morningReadiness.primaryAction} tone={morningReadiness.tone} />
        <MetricTile icon={TimerReset} label="Next 72h outlook" value={next72Plan.risk} detail={next72Plan.summary} tone={riskTone(next72Plan.risk)} />
        <MetricTile icon={Flag} label="Next fixed race" value={nextRace?.name ?? 'None'} detail={nextRace ? `${nextRace.date} · ${nextRace.series ?? nextRace.discipline}` : 'No future race loaded'} tone="blue" />
        <MetricTile icon={Activity} label="Freshness / risk" value={formatLabel(decision.mode)} detail={decision.reasons[0] ?? 'No dominant constraint.'} tone={toneFromStatus(decision)} />
        <MetricTile icon={LineIcon} label="Key signal" value={stats.avgRaceCost || readyScore} detail={keySignal} tone="slate" />
      </div>

      <div className="home-glance-board" aria-label="Full app at-a-glance">
        <article><span>Agenda</span><strong>{stats.racesNext7d} / 7d</strong><p>{nextRaceText}</p></article>
        <article><span>Recovery</span><strong>{morningReadiness.forwardState}</strong><p>{next72Plan.summary}</p></article>
        <article><span>History</span><strong>{stats.avgRaceCost}</strong><p>avg race cost · {stats.highCostActivities} hard sessions</p></article>
        <article><span>Goal</span><strong>{readyScore}</strong><p>{keySignal}</p></article>
      </div>

      <div className="home-lower-grid">
        <article className="coach-summary-card">
          <div className="chart-title"><Brain size={15} strokeWidth={1.8} /><span>AI Coach summary</span></div>
          <h3>{briefing.headline}</h3>
          <p>{briefing.readinessAdjustment?.changed ?? briefing.status}</p>
          <p><strong>Safe next:</strong> {safeNext}</p>
          <div className="coach-prompt-row" aria-label="Suggested coach questions">
            <button type="button">Why today?</button>
            <button type="button">If I race?</button>
            <button type="button">Limiters</button>
            <button type="button">This week</button>
          </div>
        </article>
        <article className="timeline-card">
          <div className="chart-title"><TimerReset size={15} strokeWidth={1.8} /><span>Next 72h</span></div>
          <MiniTimeline plan={next72Plan} />
        </article>
      </div>
      <p className="premium-footnote">Home answers: can I train, can I race soon, am I recovering, what changed, what matters next.</p>
    </section>
  )
}
