import { ArrowUpRight, ArrowRight, Clock3 } from 'lucide-react'
import type { PremiumCommandDeckProps, ScreenId } from '../types'
import { buildCoachingProvenance } from '../../../data/coachingProvenance'

export function HomeScreen(props: PremiumCommandDeckProps & { onNavigate?: (screen: ScreenId) => void }) {
  const { recommendation, decision, next72Plan, activeGoal, readiness, state, activities, races, today, onNavigate } = props
  const session = recommendation.primary
  const provenance = buildCoachingProvenance({ today, state, activities, goals: props.goals, activeGoalId: activeGoal?.id })
  const hasEvidence = provenance.status === 'current'
  const safetyRestriction = state.injury_present || state.illness_present
  const showSession = hasEvidence || safetyRestriction
  const latest = [...activities].sort((a, b) => b.date.localeCompare(a.date))[0]
  const nextRace = [...races].filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]
  const observed = state.last_updated?.slice(0, 10)
  const stale = provenance.status === 'stale'
  return <section className="v3-home" aria-label="Today’s coaching">
    <div className="v3-page-heading"><div><p className="v3-kicker">YOUR DAILY BRIEF</p><h1>Today</h1></div><span className="v3-muted">A little clarity. A better next step.</span></div>
    <article className="v3-decision">
      <div className="v3-decision-top"><span className="v3-kicker">WHAT DO I DO TODAY?</span><span className="v3-tag">{hasEvidence ? 'Recommended · advisory' : 'Evidence ' + provenance.status}</span></div>
      <h2>{showSession ? session.title : provenance.status === 'conflicting' ? 'Resolve conflicting evidence.' : provenance.status === 'stale' ? 'Refresh your recovery evidence.' : 'Establish your starting point.'}</h2>
      <p className="v3-decision-copy">{showSession ? session.purpose : 'Connect or import your recent training and recovery data before relying on a personalised training recommendation.'}</p>
      {showSession && <div className="v3-session-meta"><span><Clock3 size={16} />{session.durationMin} min</span><span>{session.intensity}</span>{session.hrCap != null && <span>HR ≤ {session.hrCap} bpm</span>}</div>}
      {!hasEvidence && <p className="v3-provenance-warning" role="status">{provenance.issues.join(" ")}</p>}
      <div className="v3-actions"><button className="v3-primary" onClick={() => onNavigate?.(showSession ? 'training' : 'settings')}>{showSession ? 'View session' : 'Connect your data'}<ArrowRight size={17} /></button><button className="v3-text-button" onClick={() => onNavigate?.('coach')}>Ask coach <ArrowUpRight size={16} /></button></div>
      <details className="v3-why"><summary>Why this recommendation?</summary>{showSession ? <><p>Generated from the same browser-local state used by your coaching engine. This is advice, not a scheduled or completed session.</p><ul>{decision.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></> : <p>Current coaching evidence is incomplete, stale, or conflicting. Retained observations are shown below for review; they do not establish current readiness.</p>}<p>Recovery observation: {observed ?? 'date unavailable'}{stale ? ' · stale — update before relying on this advice' : ''}. Activity evidence: {latest?.date ?? 'unavailable'}.</p></details>
    </article>
    <section className="v3-outlook" aria-labelledby="outlook-title"><div className="v3-section-heading"><h2 id="outlook-title">The next 72 hours</h2><span className="v3-muted">Adaptive, not fixed</span></div>{hasEvidence ? <div className="v3-timeline">{next72Plan.blocks.filter(block => block.horizon !== 'Today').map(block => <article key={block.horizon}><p className="v3-kicker">{block.horizon} <span>{block.date}</span></p><h3>{block.action}</h3><p>{block.allowedWork.join(' · ')}</p><details><summary>Why / limits</summary><p>{block.why}</p><ul>{block.hardLimits.map(limit => <li key={limit}>{limit}</li>)}</ul></details></article>)}</div> : <p className="v3-empty">Your outlook will appear when training evidence is available. No sessions have been invented.</p>}</section>
    <div className="v3-lower-grid">
      <section className="v3-goal"><div className="v3-section-heading"><h2>Your direction</h2><button className="v3-icon-button" aria-label="Open goals" onClick={() => onNavigate?.('goals')}><ArrowUpRight size={20} /></button></div><p className="v3-kicker">CURRENT GOAL</p><h3>{activeGoal?.name ?? 'A goal to work towards'}</h3><p>{activeGoal ? (activeGoal.targetDate ?? 'No target date set') : 'Set a goal so your training has a clear purpose.'}</p><div className="v3-goal-estimate"><span>Goal readiness · model estimate</span><strong>{activeGoal && hasEvidence && readiness ? readiness.overallReadiness + ' / 100' : 'Unavailable'}</strong></div><p className="v3-muted">{nextRace ? 'Next race: ' + nextRace.name + ' · ' + nextRace.date : 'No upcoming race recorded.'}</p></section>
      <section className="v3-evidence"><div className="v3-section-heading"><h2>The evidence behind today</h2><button className="v3-text-button" onClick={() => onNavigate?.('settings')}>Sources <ArrowUpRight size={15} /></button></div><dl><div><dt>Recovery score<small>Local recovery record · {observed ?? 'observation date unknown'}{stale ? ' · stale' : ''}</small></dt><dd>{state.recovery_score == null ? 'Unavailable' : state.recovery_score + ' / 100'}</dd></div><div><dt>Recent activity<small>{latest ? (latest.source ?? 'Local record') + ' · ' + latest.date : 'No completed activity available'}</small></dt><dd>{latest?.durationSec != null ? Math.round(latest.durationSec / 60) + ' min' : 'Unavailable'}</dd></div><div><dt>Resting heart rate<small>14-day average · local recovery record</small></dt><dd>{state.resting_hr_14d_avg == null ? 'Unavailable' : state.resting_hr_14d_avg + ' bpm'}</dd></div></dl><p className="v3-muted">Missing data stays missing. Sync receipt is not a measurement timestamp.</p></section>
    </div>
  </section>
}

