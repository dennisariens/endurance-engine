import { baselineConfig } from '../config/baselineConfig'

const pendingRequirements = [
  'running LTHR',
  'running AeT / drift test',
  'cycling LTHR',
  'cycling AeT / endurance decoupling check',
]

const ftpZones = [
  ['Z1 recovery', baselineConfig.cycling_power_zones.z1_recovery],
  ['Z2 endurance', baselineConfig.cycling_power_zones.z2_endurance],
  ['Z3 tempo', baselineConfig.cycling_power_zones.z3_tempo],
  ['Z4 threshold', baselineConfig.cycling_power_zones.z4_threshold],
  ['Z5 VO2', baselineConfig.cycling_power_zones.z5_vo2],
  ['Z6 anaerobic', baselineConfig.cycling_power_zones.z6_anaerobic],
] as const

function CapTile({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'yellow' | 'green' }) {
  return (
    <div className="baseline-tile">
      <span className="field-label">{label}</span>
      <strong>≤ {value}</strong>
      <p>Cap / ceiling</p>
      <span className={`pill ${tone}`}>Provisional zones</span>
    </div>
  )
}

export function BaselineZonesPanel() {
  return (
    <section className="panel baseline-zones-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Baseline / zones</p>
          <h2>Active provisional baseline</h2>
        </div>
        <span className="pill blue">Provisional zones</span>
      </div>

      <div className="baseline-grid">
        <div className="baseline-section athlete-baseline">
          <span className="field-label">Athlete baseline</span>
          <div className="baseline-value-row"><strong>{baselineConfig.weight_kg} kg</strong><span>weight</span></div>
          <div className="baseline-value-row"><strong>RHR {baselineConfig.recovery.resting_hr_14d_avg}</strong><span>14d avg</span></div>
          <div className="baseline-value-row"><strong>HRV {baselineConfig.recovery.hrv_14d_avg}</strong><span>14d avg</span></div>
          <div className="baseline-value-row"><strong>Sleep {baselineConfig.recovery.sleep_hours_14d_avg}h</strong><span>14d avg</span></div>
        </div>

        <div className="baseline-section">
          <span className="field-label">Running caps</span>
          <div className="baseline-cap-grid">
            <CapTile label="Run recovery cap" value={`${baselineConfig.running.recovery_cap_bpm} bpm`} />
            <CapTile label="Run easy aerobic cap" value={`${baselineConfig.running.easy_cap_bpm} bpm`} tone="green" />
            <CapTile label="Run upper aerobic warning" value={`${baselineConfig.running.upper_aerobic_warning_bpm} bpm`} tone="yellow" />
          </div>
        </div>

        <div className="baseline-section">
          <span className="field-label">Cycling caps</span>
          <div className="baseline-cap-grid">
            <CapTile label="Bike recovery cap" value={`${baselineConfig.cycling.recovery_cap_bpm} bpm`} />
            <CapTile label="Bike easy aerobic cap" value={`${baselineConfig.cycling.easy_cap_bpm} bpm`} tone="green" />
            <CapTile label="Bike upper aerobic warning" value={`${baselineConfig.cycling.upper_aerobic_warning_bpm} bpm`} tone="yellow" />
          </div>
        </div>

        <div className="baseline-section ftp-section">
          <span className="field-label">Cycling FTP zones · FTP {baselineConfig.cycling.ftp_watts} W</span>
          <div className="ftp-zone-list">
            {ftpZones.map(([label, range]) => (
              <div className="ftp-zone-row" key={label}>
                <strong>{label}</strong>
                <span>{range}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="baseline-section zone-policy">
          <span className="field-label">Zone policy</span>
          <ul className="manual-list">
            <li><strong>HR caps are ceilings, not targets.</strong></li>
            <li>Yellow fatigue lowers easy/Z2 cap by 3–5 bpm and reduces duration 10–25%.</li>
            <li>Red fatigue lowers easy cap by 5–10 bpm and disables strength/fasting unless mandatory race.</li>
            <li>Mandatory race override remains active unless injury or illness is present.</li>
          </ul>
        </div>

        <div className="baseline-section pending-zones">
          <span className="field-label">Why not final yet</span>
          <p>Exact HR zones stay provisional until these checks exist:</p>
          <div className="pending-list">
            {pendingRequirements.map((item) => <span className="pill slate" key={item}>{item}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}
