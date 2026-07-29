import { describe, expect, it } from 'vitest'
import type { CurrentState } from '../domain/types'
import { deriveRecoveryScore, mergeHealthIntoCurrentState, normalizeHealthData } from './healthDataAdapter'

const current: CurrentState = {
  injury_present: false,
  illness_present: false,
  recovery_status: 'unknown',
}

describe('healthDataAdapter', () => {
  it('prefers Garmin health metrics over secondary sources', () => {
    const metrics = normalizeHealthData([
      { source: 'strava', restingHr: 52, sleepScore: 70 },
      { source: 'intervals', hrv7dAvgMs: 44, restingHr14dAvg: 51 },
      { source: 'garmin', hrv7dAvgMs: 62, hrvTrend: 'stable', restingHr7dAvg: 48, sleepScore: 84, bodyBattery: 76, stressAvg: 22, trainingReadiness: 71, hrvStatus: 'balanced', vo2max: 59 },
    ])

    expect(metrics).toMatchObject({
      hrvMs: 62,
      hrvTrend: 'stable',
      restingHr: 48,
      sleepScore: 84,
      bodyBattery: 76,
      stressAvg: 22,
      trainingReadiness: 71,
      hrvStatus: 'balanced',
      vo2max: 59,
      sources: ['garmin', 'intervals', 'strava'],
    })
  })

  it('derives recovery score from available wearable signals', () => {
    expect(deriveRecoveryScore({ sleepScore: 80, bodyBattery: 70, stressAvg: 20, trainingReadiness: 90, hrvTrend: 'stable' })).toBe(77)
    expect(deriveRecoveryScore({})).toBeNull()
  })

  it('merges normalized health into current state without deleting existing training context', () => {
    const merged = mergeHealthIntoCurrentState({ ...current, latest_race_cost: 80 }, normalizeHealthData([
      { source: 'garmin', date: '2026-05-02', hrv7dAvgMs: 62, hrvTrend: 'improving', restingHr7dAvg: 47, sleepHours: 8.1, sleepScore: 88, bodyWeightKg: 73.8, bodyBattery: 82, stressAvg: 18, trainingReadiness: 79, hrvStatus: 'balanced', vo2max: 60 },
    ]))

    expect(merged).toMatchObject({
      latest_race_cost: 80,
      last_updated: '2026-05-02',
      resting_hr_14d_avg: 47,
      hrv_14d_avg: 62,
      hrv_trend: 'improving',
      sleep_hours_14d_avg: 8.1,
      sleep_score: 88,
      body_weight_kg: 73.8,
      garmin_body_battery: 82,
      garmin_stress_avg: 18,
      garmin_training_readiness: 79,
      garmin_sleep_score: 88,
      garmin_hrv_status: 'balanced',
      vo2max: 60,
    })
    expect(merged.recovery_score).toBeGreaterThan(70)
  })
})
