import type { CurrentState, DecisionLogEntry } from '../domain/types'
import type { ScenarioOutcome, ScenarioSimulation } from './scenarioSimulationEngine'

export type CoachActionLoop = {
  status: 'awaiting-choice' | 'logged'
  headline: string
  selectedScenario?: ScenarioOutcome
  tomorrowAdjustment: string
  guardrails: string[]
  coachNote: string
}

type Input = {
  today: string
  decisionLog: DecisionLogEntry[]
  simulation: ScenarioSimulation
  state: CurrentState
}

function todaysScenarioEntry(entries: DecisionLogEntry[], today: string): DecisionLogEntry | undefined {
  return entries.find((entry) => entry.date === today && entry.scenarioId)
}

function findScenario(simulation: ScenarioSimulation, entry?: DecisionLogEntry): ScenarioOutcome | undefined {
  if (!entry?.scenarioId) return undefined
  return simulation.scenarios.find((scenario) => scenario.id === entry.scenarioId)
}

function recoveryGuardrails(state: CurrentState): string[] {
  const guardrails = ['Keep sleep and normal fueling boringly consistent']
  if (state.recovery_status === 'red' || (state.recovery_score ?? 100) < 45) guardrails.push('No intensity until recovery signals stop objecting')
  if ((state.garmin_body_battery ?? 100) < 35) guardrails.push('Low Body Battery: optional load requires extra suspicion')
  if ((state.garmin_stress_avg ?? 0) > 50) guardrails.push('High stress: same workout costs more than usual')
  return guardrails
}

function adjustmentFor(scenario: ScenarioOutcome): string {
  if (scenario.id === 'rest') return 'If morning signals improve, reassess for easy aerobic work; otherwise keep the recovery lane.'
  if (scenario.id === 'easy') return 'Keep tomorrow flexible: progress only if HR, legs, sleep, and mood agree.'
  if (scenario.id === 'race') return 'Treat tomorrow as post-race audit first; no bonus work before recovery proof.'
  return 'tighten the next 24–72h plan: recovery audit first, optional work only after signals normalize.'
}

export function buildCoachActionLoop({ today, decisionLog, simulation, state }: Input): CoachActionLoop {
  const entry = todaysScenarioEntry(decisionLog, today)
  const selectedScenario = findScenario(simulation, entry)
  const guardrails = recoveryGuardrails(state)
  if (selectedScenario?.id === 'ignore' && !guardrails.includes('No intensity until recovery signals stop objecting')) guardrails.push('No intensity until recovery signals stop objecting')

  if (!selectedScenario) {
    return {
      status: 'awaiting-choice',
      headline: 'Choose today’s executed scenario to close the loop.',
      tomorrowAdjustment: 'No adjustment yet. AERION needs the actual choice before recalculating tomorrow.',
      guardrails,
      coachNote: 'The plan is advisory. The logged actual becomes the next input state.',
    }
  }

  return {
    status: 'logged',
    headline: `${selectedScenario.label} logged. Tomorrow now starts from actual behavior, not intention.`,
    selectedScenario,
    tomorrowAdjustment: adjustmentFor(selectedScenario),
    guardrails,
    coachNote: 'No judgment layer. The system recalculates from the cost you chose and the signals you wake up with.',
  }
}
