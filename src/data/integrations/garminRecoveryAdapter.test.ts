import { describe, expect, it } from 'vitest'
import { garminRecoveryAdapter, normalizeGarminRecoverySnapshot, normalizeGarminRecoveryState, parseGarminRecoveryFixture } from './garminRecoveryAdapter'

describe('garminRecoveryAdapter', () => {
  it('declares a server-only no-secret recovery snapshot boundary', () => {
    expect(garminRecoveryAdapter.descriptor).toMatchObject({
      id: 'garmin',
      serverOnly: true,
      secretPolicy: 'no-client-secrets',
      role: 'recovery-snapshot',
    })
  })

  it('normalizes manual recovery fixture snapshots into health samples and current state', () => {
    const [snapshot] = parseGarminRecoveryFixture({
      snapshots: [{ date: '2026-05-02', hrv7dAvgMs: '62', restingHr7dAvg: 47, sleepSeconds: 28800, sleepScore: 86, bodyBattery: 73, stressAvg: 22, trainingReadiness: 75, hrvStatus: 'balanced', vo2max: 59 }],
    })

    expect(normalizeGarminRecoverySnapshot(snapshot)).toMatchObject({
      source: 'garmin',
      date: '2026-05-02',
      hrv7dAvgMs: 62,
      sleepHours: 8,
      bodyBattery: 73,
    })
    expect(normalizeGarminRecoveryState(snapshot)).toMatchObject({
      last_updated: '2026-05-02',
      hrv_14d_avg: 62,
      garmin_body_battery: 73,
      garmin_training_readiness: 75,
      garmin_hrv_status: 'balanced',
    })
  })
})
