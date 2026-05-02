export const baselineConfig = {
  athlete_id: 'i478692',
  weight_kg: 74.0,
  recovery: {
    resting_hr_14d_avg: 49.4,
    hrv_14d_avg: 49.2,
    hrv_trend: 'unknown',
    sleep_hours_14d_avg: 7.9,
    sleep_score: null,
    recovery_score: null,
  },
  running: {
    max_hr_6m: 200,
    lthr: null,
    aet: null,
    recovery_cap_bpm: 140,
    easy_cap_bpm: 150,
    upper_aerobic_warning_bpm: 160,
  },
  cycling: {
    max_hr_6m: 193,
    ftp_watts: 333,
    lthr: null,
    aet: null,
    best_recent_race_avg_hr: 172,
    recovery_cap_bpm: 135,
    easy_cap_bpm: 145,
    upper_aerobic_warning_bpm: 154,
  },
  cycling_power_zones: {
    z1_recovery: '<=183W',
    z2_endurance: '186–250W',
    z3_tempo: '253–300W',
    z4_threshold: '303–350W',
    z5_vo2: '353–400W',
    z6_anaerobic: '403–500W',
  },
  rules: {
    hr_caps_are_ceilings_not_targets: true,
    hr_zones_provisional_until: ['LTHR', 'AeT', 'drift tests'],
    yellow_fatigue: 'Lower easy/Z2 cap by 3–5 bpm and reduce duration 10–25%.',
    red_fatigue: 'Z1/recovery only unless mandatory race; lower easy cap by 5–10 bpm; no strength; no fasting.',
    mandatory_race_override: 'Active unless injury or illness is present.',
  },
} as const

export type BaselineConfig = typeof baselineConfig

export function isHrZoneProvisional(config: BaselineConfig = baselineConfig): boolean {
  return config.running.lthr === null
    || config.running.aet === null
    || config.cycling.lthr === null
    || config.cycling.aet === null
    || config.rules.hr_zones_provisional_until.length > 0
}
