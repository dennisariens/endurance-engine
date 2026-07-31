import { Activity, Brain, Database, Flag, Gauge, LineChart as LineIcon, ShieldCheck, TimerReset, TrendingUp } from 'lucide-react'
import type { Race } from '../../../domain/types'
import { CommandPanel, EvidenceStrip, MetricTile, MiniTimeline, RouteRail, formatLabel, riskTone, toneFromStatus } from '../ui'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

export function HomeScreen(props: Props & { readyScore: number; nextRace?: Race }) {
  const { today, decision, recommendation, briefing, morningReadiness, next72Plan, stats, readyScore, nextRace, readiness, trajectory, learning, dailyRecommendation } = props
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
        eyebrow="AERION / Daily Recommendation"
        title={dailyRecommendation.headline}
        summary={`Goal: ${dailyRecommendation.goal.name}. Week: ${dailyRecommendation.week.focus}. Long term: ${dailyRecommendation.longTerm.direction} ${dailyRecommendation.longTerm.readinessRange.low}–${dailyRecommendation.longTerm.readinessRange.high}.`}
        aside={(
          <div className={`readiness-orb tone-${morningReadiness.tone}`} style={{ ['--score' as string]: `${readyScore * 3.6}deg` }}>
            <strong>{readyScore}</strong>
            <span>{morningReadiness.verdict}</span>
          </div>
        )}
      >
        <RouteRail labels={['today', 'goal', 'week']} />
        <EvidenceStrip items={[
          { label: 'Today', value: dailyRecommendation.today.durationMin || 'Off', detail: dailyRecommendation.today.safeNext, tone: morningReadiness.tone },
          { label: 'Goal', value: dailyRecommendation.goal.readiness ?? 'n/a', detail: `${dailyRecommendation.goal.phase ?? 'No phase'} · ${dailyRecommendation.goal.nextFocus}`, tone: readiness?.confidence === 'low' ? 'yellow' : 'blue' },
          { label: 'Week', value: dailyRecommendation.week.risk, detail: dailyRecommendation.week.structure[0] ?? dailyRecommendation.week.focus, tone: riskTone(dailyRecommendation.week.risk) },
        ]} />
        <div className="daily-recommendation-receipt">
          <article><span>Do today</span><strong>{dailyRecommendation.today.action}</strong><p>{dailyRecommendation.today.reason}</p></article>
          <article><span>Goal pressure</span><strong>{dailyRecommendation.goal.name}</strong><p>{dailyRecommendation.goal.limiter ?? dailyRecommendation.goal.nextFocus}</p></article>
          <article><span>Connect next</span><strong>{dailyRecommendation.connect.primary}</strong><p>{dailyRecommendation.connect.action}</p></article>
        </div>
      </CommandPanel>

      <div className="home-command-strip" aria-label="One-glance command overview">
        <article><span>Today</span><strong>{dailyRecommendation.today.durationMin || 'Off'} min</strong><em>{dailyRecommendation.today.action}</em></article>
        <article><span>Goal</span><strong>{dailyRecommendation.goal.readiness ?? readyScore}</strong><em>{dailyRecommendation.goal.name}</em></article>
        <article><span>Trajectory</span><strong>{trajectory.direction}</strong><em>{trajectory.readinessRange.low}–{trajectory.readinessRange.high} readiness · {trajectoryConfidence}</em></article>
        <article><span>Connect</span><strong>{dailyRecommendation.connect.primary}</strong><em>{dailyRecommendation.connect.action}</em></article>
      </div>

      <div className="daily-horizon-board" aria-label="Daily, weekly, and long-term recommendation">
        <article><span>Today</span><strong>{dailyRecommendation.today.safeNext}</strong><p>{dailyRecommendation.today.consequence}</p></article>
        <article><span>This week</span><strong>{dailyRecommendation.week.focus}</strong><ul>{dailyRecommendation.week.structure.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span>Long term</span><strong>{dailyRecommendation.longTerm.stance}</strong><p>Range {dailyRecommendation.longTerm.readinessRange.low}–{dailyRecommendation.longTerm.readinessRange.high}; direction {dailyRecommendation.longTerm.direction}.</p></article>
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
