export const aerionColors = {
  surface: {
    void: '#050914',
    base: '#081125',
    navy: '#0d1830',
    panel: '#10203d',
    panelRaised: '#172a4f',
    panelGlass: 'rgba(255,255,255,.045)',
    panelGlassStrong: 'rgba(255,255,255,.075)',
  },
  text: {
    primary: '#e5eefc',
    secondary: '#cbd5e1',
    muted: '#94a3b8',
    inverse: '#06101a',
  },
  border: {
    default: 'rgba(148, 163, 184, .18)',
    soft: 'rgba(148, 163, 184, .14)',
    premium: 'rgba(255,255,255,.08)',
    active: 'rgba(125, 211, 252, .26)',
  },
  accent: {
    ice: '#f5f7fb',
    cyan: '#7dd3fc',
    blue: '#4fb7ff',
    violet: '#b7a6ff',
    amber: '#ffb86b',
    coral: '#ff4f8b',
  },
  readiness: {
    clear: '#55d997',
    hold: '#ffcf72',
    extend: '#ff5f7e',
    injury: '#a78bfa',
  },
} as const

export const aerionChartTheme = {
  grid: 'rgba(245,247,251,.075)',
  axis: '#9fb0c9',
  tooltipBackground: '#0b1630',
  tooltipBorder: 'rgba(255,79,139,.22)',
  series: {
    ctl: aerionColors.accent.ice,
    atl: aerionColors.accent.coral,
    tsb: aerionColors.accent.violet,
    raceCost: aerionColors.accent.coral,
    drift: aerionColors.readiness.extend,
    durability: aerionColors.readiness.clear,
    readiness: aerionColors.accent.ice,
    stage: aerionColors.accent.ice,
    cumulative: '#7a8fb3',
    risk: aerionColors.accent.amber,
  },
  area: {
    raceCost: 'url(#raceCostGradient)',
    readiness: 'rgba(14, 165, 233, .14)',
    lag: 'rgba(251, 113, 133, .13)',
  },
} as const

export const chartAxis = {
  tick: { fill: aerionChartTheme.axis, fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const

export const chartTooltip = {
  contentStyle: {
    background: aerionChartTheme.tooltipBackground,
    border: `1px solid ${aerionChartTheme.tooltipBorder}`,
    borderRadius: 12,
    color: aerionColors.text.primary,
  },
} as const
