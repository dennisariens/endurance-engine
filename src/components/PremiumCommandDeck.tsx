import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Brain, CalendarClock, Database, Flag, Home, ShieldCheck, Target } from 'lucide-react'
import type { NavItem, PremiumCommandDeckProps, ScreenId } from './premium/types'
import { formatLabel } from './premium/ui'


const HomeScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.HomeScreen })))
const PerformanceScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.PerformanceScreen })))
const HistoryScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.HistoryScreen })))
const RacesScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.RacesScreen })))
const TrainingScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.TrainingScreen })))
const RecoveryScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.RecoveryScreen })))
const GoalsScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.GoalsScreen })))
const AiCoachScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.AiCoachScreen })))
const SettingsDataScreen = lazy(() => import('./premium/screens').then((module) => ({ default: module.SettingsDataScreen })))

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'history', label: 'History', icon: CalendarClock },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'races', label: 'Races', icon: Flag },
  { id: 'training', label: 'Training', icon: Activity },
  { id: 'recovery', label: 'Recovery', icon: ShieldCheck },
  { id: 'goals', label: 'Goal Path', icon: Target },
  { id: 'coach', label: 'AI Coach', icon: Brain },
  { id: 'settings', label: 'Data Hub', icon: Database },
]

function daysUntil(today: string, date?: string): number | undefined {
  if (!date) return undefined
  return Math.round((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000)
}

export function PremiumCommandDeck(props: PremiumCommandDeckProps) {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home')
  const { today, decision, races, state, readiness, syncStatus } = props
  const readyScore = readiness?.overallReadiness ?? state.recovery_score ?? 72
  const nextRace = useMemo(() => [...races].filter((race) => race.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ?? decision.nextRace, [races, today, decision.nextRace])
  const nextRaceDays = daysUntil(today, nextRace?.date)
  const activeNav = navItems.find((item) => item.id === activeScreen) ?? navItems[0]
  const connectionTone = syncStatus.state === 'fresh' ? 'connected' : syncStatus.state === 'syncing' ? 'syncing' : syncStatus.state === 'error' ? 'error' : 'offline'
  const connectionLabel = syncStatus.state === 'fresh' ? 'Connected' : syncStatus.state === 'syncing' ? 'Connecting' : syncStatus.state === 'error' ? 'Sync error' : 'Offline'

  useEffect(() => {
    const handleDesktopNavigation = (event: Event) => {
      const detail = (event as CustomEvent<ScreenId>).detail
      if (navItems.some((item) => item.id === detail)) setActiveScreen(detail)
    }
    window.addEventListener('aerion:navigate', handleDesktopNavigation)
    return () => window.removeEventListener('aerion:navigate', handleDesktopNavigation)
  }, [])

  return (
    <section className="premium-command-deck premium-app-shell" aria-label="AERION premium product app">
      <aside className="premium-sidebar" aria-label="AERION navigation">
        <div className="premium-brand">
          <svg className="aerion-brand-mark" viewBox="0 0 64 64" role="img" aria-label="AERION mark">
            <rect width="64" height="64" rx="16" />
            <path className="mark-stripe ice" d="M13 58 43 6h7L20 58z" />
            <path className="mark-stripe white" d="M25 58 55 6h5L30 58z" />
            <circle className="mark-ring" cx="32" cy="32" r="18" />
            <path className="mark-a" d="M17 50 29 14h8l12 36h-8l-3-9H27l-3 9zm13-17h6l-3-10z" />
          </svg>
          <div><strong>AERION</strong><small>Race OS</small></div>
        </div>
        <div className="premium-nav-links paginated-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={activeScreen === id ? 'active' : ''} onClick={() => setActiveScreen(id)}>
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-status">
          <span className={`aerion-connection-pill ${connectionTone}`}>{connectionLabel}</span>
          <p>{syncStatus.state === 'fresh' ? `${syncStatus.activityCount ?? 0} activities synced` : syncStatus.message}</p>
          <p>{formatLabel(decision.mode)} · {decision.status}</p>
          <p>{nextRace ? `Next race ${nextRaceDays === 0 ? 'today' : `in ${nextRaceDays}d`}` : 'No fixed race loaded'}</p>
        </div>
      </aside>

      <div className="premium-page">
        <div className="desktop-race-strip" aria-hidden="true"><span></span><span></span><span></span></div>
        <header className="premium-page-header">
          <div><p className="eyebrow">{activeNav.label}</p><h1>Race Control</h1></div>
          <div className="page-header-meta"><span>{today}</span><strong>{nextRace?.name ?? 'No fixed race'}</strong></div>
        </header>

        <Suspense fallback={<div className="premium-screen active aerion-screen-loading">Loading AERION screen…</div>}>
          {activeScreen === 'home' && <HomeScreen {...props} readyScore={readyScore} nextRace={nextRace} />}
          {activeScreen === 'history' && <HistoryScreen {...props} />}
          {activeScreen === 'performance' && <PerformanceScreen {...props} />}
          {activeScreen === 'races' && <RacesScreen {...props} />}
          {activeScreen === 'training' && <TrainingScreen {...props} />}
          {activeScreen === 'recovery' && <RecoveryScreen {...props} />}
          {activeScreen === 'goals' && <GoalsScreen {...props} />}
          {activeScreen === 'coach' && <AiCoachScreen {...props} />}
          {activeScreen === 'settings' && <SettingsDataScreen {...props} />}
        </Suspense>
      </div>
    </section>
  )
}
