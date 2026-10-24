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

  it('retains per-field observation dates when preferred sources supply different metrics', () => {
    const metrics = normalizeHealthData([
      { source: 'garmin', date: '2026-10-10', trainingReadiness: 80 },
      { source: 'intervals', date: '2026-10-17', restingHr: 50 },
    ])
    const merged = mergeHealthIntoCurrentState(current, metrics)
    expect(merged.field_evidence?.garmin_training_readiness).toMatchObject({ observedAt: '2026-10-10', source: 'garmin' })
    expect(merged.field_evidence?.resting_hr_14d_avg).toMatchObject({ observedAt: '2026-10-17', source: 'intervals' })
    expect(merged.field_evidence?.recovery_score?.quality).toBe('derived')
    expect(merged.field_evidence?.recovery_score?.observedAt).toBe('2026-10-10')
  })

  it('chooses the latest observed sample per metric before source priority', () => {
    const metrics = normalizeHealthData([
      { source: 'garmin', date: '2026-10-10', restingHr: 45 },
      { source: 'garmin', date: '2026-10-16', sleepHours: 8 },
      { source: 'intervals', date: '2026-10-17', restingHr: 50 },
    ])
    expect(metrics.restingHr).toBe(50)
    expect(metrics.sleepHours).toBe(8)
  })

  it('does not overwrite newer local recovery through the general health merge path', () => {
    const merged = mergeHealthIntoCurrentState({ ...current, recovery_score: 0, last_updated: '2026-10-17' }, normalizeHealthData([{ source: 'garmin', date: '2026-10-10', recoveryScore: 80 }]))
    expect(merged.recovery_score).toBe(0)
    expect(merged.data_conflicts?.length).toBeGreaterThan(0)
  })
})
