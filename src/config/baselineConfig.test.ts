import { describe, expect, it } from 'vitest'
import { baselineConfig, isHrZoneProvisional } from './baselineConfig'

describe('baselineConfig', () => {
  it('contains Dennis provisional AERION baseline anchors', () => {
    expect(baselineConfig.athlete_id).toBe('i478692')
    expect(baselineConfig.weight_kg).toBe(74.0)
    expect(baselineConfig.recovery.resting_hr_14d_avg).toBe(49.4)
    expect(baselineConfig.recovery.hrv_14d_avg).toBe(49.2)
    expect(baselineConfig.recovery.sleep_hours_14d_avg).toBe(7.9)
    expect(baselineConfig.running).toMatchObject({ max_hr_6m: 200, lthr: null, aet: null, recovery_cap_bpm: 140, easy_cap_bpm: 150, upper_aerobic_warning_bpm: 160 })
    expect(baselineConfig.cycling).toMatchObject({ max_hr_6m: 193, ftp_watts: 333, lthr: null, aet: null, best_recent_race_avg_hr: 172, recovery_cap_bpm: 135, easy_cap_bpm: 145, upper_aerobic_warning_bpm: 154 })
  })

  it('keeps cycling power zones explicit and credential-free', () => {
    expect(baselineConfig.cycling_power_zones).toEqual({
      z1_recovery: '<=183W',
      z2_endurance: '186–250W',
      z3_tempo: '253–300W',
      z4_threshold: '303–350W',
      z5_vo2: '353–400W',
      z6_anaerobic: '403–500W',
    })
    expect(JSON.stringify(baselineConfig)).not.toMatch(/INTERVALS_ICU_API_KEY|API_KEY/i)
  })

  it('marks HR zones provisional until LTHR, AeT, and drift tests are available', () => {
    expect(baselineConfig.rules.hr_caps_are_ceilings_not_targets).toBe(true)
    expect(baselineConfig.rules.hr_zones_provisional_until).toContain('LTHR')
    expect(baselineConfig.rules.hr_zones_provisional_until).toContain('AeT')
    expect(baselineConfig.rules.hr_zones_provisional_until).toContain('drift tests')
    expect(isHrZoneProvisional(baselineConfig)).toBe(true)
  })
})
