import { useEffect, useMemo, useState } from 'react'
import type { Goal, GoalDiscipline, GoalStatus, GoalType } from '../domain/types'

const goalTypes: GoalType[] = ['fixed-date-race', 'floating-goal', 'candidate-event', 'committed-race', 'mandatory-race', 'key-performance-goal']
const goalStatuses: GoalStatus[] = ['draft', 'candidate', 'committed', 'key-event', 'mandatory']
const disciplines: GoalDiscipline[] = ['cycling', 'running', 'triathlon', 'endurance', 'other']

const label = (value: string) => value.replace(/-/g, ' ')

export function GoalControlPanel({
  goals,
  activeGoalId,
  onSelectGoal,
  onUpdateGoal,
  onDeleteGoal,
}: {
  goals: Goal[]
  activeGoalId?: string
  onSelectGoal: (goalId: string) => void
  onUpdateGoal: (goal: Goal) => void
  onDeleteGoal: (goalId: string) => void
}) {
  const activeGoal = useMemo(() => goals.find((goal) => goal.id === activeGoalId) ?? goals[0], [activeGoalId, goals])
  const [draft, setDraft] = useState<Goal | undefined>(activeGoal)

  useEffect(() => {
    setDraft(activeGoal)
  }, [activeGoal])

  if (!goals.length || !activeGoal || !draft) {
    return (
      <section className="panel goal-control-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">GOAL CONTROL</p>
            <h2>No goals loaded</h2>
            <p>Add a candidate event or floating goal to activate Path to Goal.</p>
          </div>
        </div>
      </section>
    )
  }

  const updateDraft = <K extends keyof Goal>(key: K, value: Goal[K]) => setDraft((current) => current ? { ...current, [key]: value } : current)

  return (
    <section className="panel goal-control-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">GOAL CONTROL</p>
          <h2>Active goal</h2>
          <p>Choose the goal AERION should evaluate now. Floating goals can stay date-free.</p>
        </div>
      </div>

      <div className="goal-control-grid">
        <div className="goal-list" aria-label="Goal selection">
          {goals.map((goal) => (
            <button
              className={`goal-select-card ${goal.id === activeGoal.id ? 'active' : ''}`}
              key={goal.id}
              type="button"
              onClick={() => onSelectGoal(goal.id)}
            >
              <strong>{goal.name}</strong>
              <span>{label(goal.status)} · {label(goal.type)} · {goal.discipline}</span>
              <small>{goal.targetDate ?? 'floating date'}</small>
            </button>
          ))}
        </div>

        <form
          className="goal-edit-form"
          onSubmit={(event) => {
            event.preventDefault()
            onUpdateGoal({ ...draft, targetDate: draft.targetDate || undefined })
          }}
        >
          <span className="field-label">Edit active goal</span>
          <label>
            Name
            <input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
          </label>
          <div className="form-grid compact-form-grid">
            <label>
              Type
              <select value={draft.type} onChange={(event) => updateDraft('type', event.target.value as GoalType)}>
                {goalTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}
              </select>
            </label>
            <label>
              Status
              <select value={draft.status} onChange={(event) => updateDraft('status', event.target.value as GoalStatus)}>
                {goalStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
            </label>
            <label>
              Discipline
              <select value={draft.discipline} onChange={(event) => updateDraft('discipline', event.target.value as GoalDiscipline)}>
                {disciplines.map((discipline) => <option key={discipline} value={discipline}>{discipline}</option>)}
              </select>
            </label>
            <label>
              Target date
              <input type="date" value={draft.targetDate ?? ''} onChange={(event) => updateDraft('targetDate', event.target.value || undefined)} />
            </label>
          </div>
          <label>
            Notes
            <textarea value={draft.description ?? ''} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>
          <div className="button-row">
            <button type="submit">Save goal</button>
            <button className="ghost danger" type="button" onClick={() => onDeleteGoal(activeGoal.id)}>Delete goal</button>
          </div>
        </form>
      </div>
    </section>
  )
}
