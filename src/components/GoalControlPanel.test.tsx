import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Goal } from '../domain/types'
import { GoalControlPanel } from './GoalControlPanel'

const goals: Goal[] = [
  {
    id: 'goal-im-lanzarote',
    name: 'Ironman Lanzarote',
    type: 'candidate-event',
    discipline: 'triathlon',
    status: 'candidate',
    targetDate: '2026-10-01',
    description: 'Build toward long-distance triathlon readiness.',
  },
  {
    id: 'goal-low-hr-run',
    name: 'Improve low-HR running pace',
    type: 'floating-goal',
    discipline: 'running',
    status: 'draft',
    description: 'Improve pace at aerobic HR without forcing a race date.',
  },
]

describe('GoalControlPanel', () => {
  it('renders goal selection, active goal context, edit fields, and delete affordance', () => {
    const markup = renderToStaticMarkup(
      <GoalControlPanel
        goals={goals}
        activeGoalId="goal-low-hr-run"
        onSelectGoal={vi.fn()}
        onUpdateGoal={vi.fn()}
        onDeleteGoal={vi.fn()}
      />,
    )

    expect(markup).toContain('GOAL CONTROL')
    expect(markup).toContain('Improve low-HR running pace')
    expect(markup).toContain('Ironman Lanzarote')
    expect(markup).toContain('Active goal')
    expect(markup).toContain('Edit active goal')
    expect(markup).toContain('Delete goal')
    expect(markup).toContain('Floating goals can stay date-free')
  })

  it('renders a useful empty state when no goals exist', () => {
    const markup = renderToStaticMarkup(
      <GoalControlPanel
        goals={[]}
        activeGoalId={undefined}
        onSelectGoal={vi.fn()}
        onUpdateGoal={vi.fn()}
        onDeleteGoal={vi.fn()}
      />,
    )

    expect(markup).toContain('No goals loaded')
    expect(markup).toContain('Add a candidate event or floating goal')
  })
})
