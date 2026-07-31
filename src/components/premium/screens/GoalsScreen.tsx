import { useMemo, useState } from 'react'
import { Brain, CalendarPlus, Clock3, Map, ShieldCheck, Target } from 'lucide-react'
import { buildGoalFeasibilityBrief } from '../../../engine/goalFeasibilityEngine'
import { buildGoalPlanningBlock } from '../../../engine/goalPlanningEngine'
import type { GoalDiscipline, GoalStatus, GoalType } from '../../../domain/types'
import { PremiumKpi } from '../ui'
import type { PremiumCommandDeckProps } from '../types'

type Props = PremiumCommandDeckProps

const goalTypes: GoalType[] = ['floating-goal', 'candidate-event', 'fixed-date-race', 'committed-race', 'mandatory-race', 'key-performance-goal']
const goalStatuses: GoalStatus[] = ['draft', 'candidate', 'committed', 'key-event', 'mandatory']
const disciplines: GoalDiscipline[] = ['triathlon', 'cycling', 'running', 'endurance', 'other']
const label = (value: string) => value.replace(/-/g, ' ')

export function GoalsScreen({ today, readiness, path, goals, activeGoal, goalConversation, state, races, onSelectGoal, onAddGoal, onDeleteGoal, onAddRace, onAddGoalConversation, onDeleteGoalConversation }: Props) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<GoalType>('candidate-event')
  const [status, setStatus] = useState<GoalStatus>('candidate')
  const [discipline, setDiscipline] = useState<GoalDiscipline>('triathlon')
  const [notes, setNotes] = useState('')
  const [answer, setAnswer] = useState('')
  const feasibility = useMemo(() => buildGoalFeasibilityBrief({ goal: activeGoal, readiness, path, state, races, today }), [activeGoal, readiness, path, state, races, today])
  const activeConversation = useMemo(() => goalConversation.filter((entry) => entry.goalId === activeGoal?.id), [goalConversation, activeGoal?.id])
  const planningBlock = useMemo(() => buildGoalPlanningBlock({ goal: activeGoal, feasibility, readiness, path, conversation: activeConversation }), [activeGoal, feasibility, readiness, path, activeConversation])
  const upcomingRaces = useMemo(() => races.filter((race) => race.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [races, today])
  const latestConversation = [...activeConversation].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const activeGoalMeta = activeGoal
    ? `${label(activeGoal.status)} · ${label(activeGoal.type)} · ${activeGoal.targetDate ?? 'floating date'}`
    : 'No active goal selected'

  const addGoal = (alsoRace: boolean) => {
    if (!name.trim()) return
    const goal = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      status: type === 'mandatory-race' ? 'mandatory' as const : status,
      discipline,
      targetDate: date || null,
      description: notes.trim() || 'AERION goal idea',
      priority: status === 'key-event' || status === 'mandatory' ? 'high' as const : 'medium' as const,
    }
    onAddGoal(goal)
    if (alsoRace && date) {
      onAddRace({
        id: crypto.randomUUID(),
        date,
        name: name.trim(),
        discipline: discipline === 'running' || discipline === 'triathlon' || discipline === 'cycling' ? discipline : 'other',
        priority: 'fixed',
        mandatory: status === 'mandatory' || type === 'mandatory-race' || type === 'committed-race',
        format: type === 'key-performance-goal' ? 'other' : 'road',
        notes: notes.trim() || 'Created from Goals / Ideas intake',
      })
    }
    setName('')
    setNotes('')
  }

  const addAnswer = (prompt?: string) => {
    if (!activeGoal || !answer.trim()) return
    onAddGoalConversation({ id: crypto.randomUUID(), goalId: activeGoal.id, createdAt: new Date().toISOString(), kind: 'answer', prompt, text: answer.trim() })
    setAnswer('')
  }

  return (
    <section className="premium-screen active goals-workbench-screen">
      <div className="premium-screen-header compact-header">
        <p className="eyebrow">Goals / Ideas / Races</p>
        <h2>Enter the ambition. AERION pressure-tests feasibility.</h2>
        <p>Capture rough ideas, candidate goals, and fixed races here. The coach layer talks back in ranges, constraints, and next planning moves — not fantasy-calendar nonsense.</p>
      </div>

      <div className="premium-training-grid paginated-grid">
        <PremiumKpi label="Active goal" value={activeGoal?.name ?? 'Idea intake'} detail={activeGoalMeta} tone="blue" icon={Target} />
        <PremiumKpi label="Readiness" value={readiness?.overallReadiness ?? 'n/a'} detail={readiness?.mainLimiter ?? 'No active readiness model'} tone="blue" icon={Target} />
        <PremiumKpi label="Phase" value={path?.phase ?? 'Build'} detail={path?.nextFocus?.join(' · ') ?? 'No path loaded'} tone="green" icon={Map} />
        <PremiumKpi label="AI stance" value={label(feasibility.stance)} detail={feasibility.headline} tone={feasibility.stance === 'feasible' ? 'green' : feasibility.stance === 'blocked-by-recovery' ? 'red' : 'yellow'} icon={Brain} />
      </div>

      <div className="goal-command-row" aria-label="Goal planning loop">
        <article>
          <div className="chart-title"><Target size={15} strokeWidth={1.8} /><span>01 capture</span></div>
          <strong>{goals.length} goal{goals.length === 1 ? '' : 's'} on the board</strong>
          <p>{activeGoal ? 'Select the active target, then keep date/status honest as evidence changes.' : 'Start with a candidate idea; do not force a date until it is real.'}</p>
        </article>
        <article>
          <div className="chart-title"><ShieldCheck size={15} strokeWidth={1.8} /><span>02 pressure-test</span></div>
          <strong>{label(feasibility.stance)}</strong>
          <p>{feasibility.risks[0] ?? 'AERION will surface the strongest constraint before commitment.'}</p>
        </article>
        <article>
          <div className="chart-title"><Clock3 size={15} strokeWidth={1.8} /><span>03 adapt</span></div>
          <strong>{planningBlock.horizonDays}-day loop</strong>
          <p>{latestConversation ? `Last receipt: ${latestConversation.kind}` : `${upcomingRaces.length} upcoming race${upcomingRaces.length === 1 ? '' : 's'} shaping the block.`}</p>
        </article>
      </div>

      {goals.length > 0 && (
        <div className="goal-select-strip elevated" aria-label="Goal selection">
          {goals.map((goal) => (
            <article key={goal.id} className={goal.id === activeGoal?.id ? 'active' : ''}>
              <button type="button" onClick={() => onSelectGoal(goal.id)}>
                <strong>{goal.name}</strong>
                <span>{label(goal.status)} · {label(goal.type)} · {goal.targetDate ?? 'floating'}</span>
              </button>
              <button className="goal-delete-chip" type="button" onClick={() => onDeleteGoal(goal.id)}>Delete</button>
            </article>
          ))}
        </div>
      )}

      <div className="goals-workbench-grid">
        <form className="goal-intake-card" onSubmit={(event) => { event.preventDefault(); addGoal(false) }}>
          <div className="chart-title"><CalendarPlus size={15} strokeWidth={1.8} /><span>Goal intake</span></div>
          <label>
            Idea / race / goal
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ironman Lanzarote, Mallorca 312, sub-45 10K" />
          </label>
          <div className="goal-intake-row">
            <label>Date <input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label>Type <select value={type} onChange={(event) => setType(event.target.value as GoalType)}>{goalTypes.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
          </div>
          <div className="goal-intake-row">
            <label>Status <select value={status} onChange={(event) => setStatus(event.target.value as GoalStatus)}>{goalStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
            <label>Discipline <select value={discipline} onChange={(event) => setDiscipline(event.target.value as GoalDiscipline)}>{disciplines.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
          <label>
            Notes / why it matters / constraints
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why this matters, target outcome, available time, travel/work constraints…" />
          </label>
          <div className="button-row">
            <button type="submit">Add as goal</button>
            <button className="ghost" type="button" onClick={() => addGoal(true)}>Add goal + race</button>
            {activeGoal && <button className="ghost danger" type="button" onClick={() => onDeleteGoal(activeGoal.id)}>Delete active goal</button>}
          </div>
        </form>

        <article className={`coach-summary-card goal-ai-card stance-${feasibility.stance}`}>
          <div className="chart-title"><Brain size={15} strokeWidth={1.8} /><span>AI feasibility conversation</span></div>
          <h3>{feasibility.headline}</h3>
          <p>{feasibility.feasibility}</p>
          <div className="goal-ai-columns">
            <div><strong>Planning move</strong><ul>{feasibility.planning.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><strong>Risks</strong><ul>{feasibility.risks.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
          <div className="goal-ai-questions"><strong>What I need from you next</strong><ul>{feasibility.questions.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="goal-answer-box">
            <label>
              Answer / constraint update
              <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="e.g. Date is flexible; I can train 8h/week; travel week in August; goal is strong finish, not time." />
            </label>
            <div className="button-row">
              <button type="button" onClick={() => addAnswer(feasibility.questions[0])} disabled={!activeGoal}>Save answer</button>
              <button className="ghost" type="button" onClick={() => {
                if (!activeGoal) return
                onAddGoalConversation({ id: crypto.randomUUID(), goalId: activeGoal.id, createdAt: new Date().toISOString(), kind: 'decision', text: feasibility.headline })
              }} disabled={!activeGoal}>Save stance</button>
            </div>
          </div>
        </article>
      </div>

      <article className="goal-planning-block coach-summary-card">
        <div className="chart-title"><Map size={15} strokeWidth={1.8} /><span>Adaptive 21-day planning block</span></div>
        <h3>{planningBlock.title}</h3>
        <p>{planningBlock.stance}</p>
        <div className="goal-plan-grid">
          {planningBlock.weeks.map((week) => (
            <section key={week.label}>
              <span>{week.label}</span>
              <strong>{week.objective}</strong>
              <ul>{week.sessions.map((item) => <li key={item}>{item}</li>)}</ul>
              {week.guardrails.length > 0 && (
                <div className="goal-guardrails">
                  <small>Guardrails</small>
                  <p>{week.guardrails.join(' · ')}</p>
                </div>
              )}
            </section>
          ))}
        </div>
        <details className="goal-plan-details">
          <summary>Assumptions and decision receipt</summary>
          <ul>{[...planningBlock.assumptions, ...planningBlock.decisionReceipt].map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      </article>

      {activeConversation.length > 0 && (
        <div className="goal-conversation-log">
          {activeConversation.slice(0, 5).map((entry) => (
            <article key={entry.id}>
              <div className="goal-conversation-header"><span>{entry.kind}</span><button type="button" onClick={() => onDeleteGoalConversation(entry.id)}>Delete</button></div>
              <strong>{entry.prompt ?? 'Goal context'}</strong>
              <p>{entry.text}</p>
            </article>
          ))}
        </div>
      )}

    </section>
  )
}
