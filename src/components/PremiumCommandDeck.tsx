import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Activity, BarChart3, Brain, CalendarClock, Plug, Flag, Home, ShieldCheck, Target, MoreHorizontal, X } from 'lucide-react'
import type { NavItem, PremiumCommandDeckProps, ScreenId } from './premium/types'
import masterLogo from '../assets/brand/AE-B-gradient.svg'
import '../v3.css'
const HomeScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.HomeScreen })))
const HistoryScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.HistoryScreen })))
const PerformanceScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.PerformanceScreen })))
const RacesScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.RacesScreen })))
const TrainingScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.TrainingScreen })))
const RecoveryScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.RecoveryScreen })))
const GoalsScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.GoalsScreen })))
const AiCoachScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.AiCoachScreen })))
const SettingsDataScreen = lazy(() => import('./premium/screens').then(m => ({ default: m.SettingsDataScreen })))
const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home }, { id: 'training', label: 'Training', icon: Activity },
  { id: 'performance', label: 'Performance', icon: BarChart3 }, { id: 'coach', label: 'Coach', icon: Brain },
  { id: 'goals', label: 'Goals', icon: Target }, { id: 'races', label: 'Races', icon: Flag },
  { id: 'recovery', label: 'Recovery', icon: ShieldCheck }, { id: 'history', label: 'History', icon: CalendarClock },
  { id: 'settings', label: 'Settings & data', icon: Plug },
]
export function AerionLogo() {
  return <div className="v3-brand"><img src={masterLogo} width="52" height="26" alt="AERION approved AE identity" /><span>AERION<small>ENDURANCE INTELLIGENCE</small></span></div>
}
export function PremiumCommandDeck(props: PremiumCommandDeckProps) {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home')
  const moreDialog = useRef<HTMLDialogElement>(null)
  const { today, syncStatus } = props
  const navigate = (id: ScreenId) => { setActiveScreen(id); moreDialog.current?.close(); window.scrollTo({ top: 0 }) }
  useEffect(() => {
    const handler = (event: Event) => {
      const id = (event as CustomEvent<ScreenId>).detail
      if (navItems.some(item => item.id === id)) navigate(id)
    }
    window.addEventListener('aerion:navigate', handler)
    return () => window.removeEventListener('aerion:navigate', handler)
  }, [])
  const navButton = ({ id, label, icon: Icon }: NavItem) => <button key={id} type="button" aria-current={activeScreen === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></button>
  const syncLabel = syncStatus.state === 'fresh' ? 'Sync received' : syncStatus.state === 'syncing' ? 'Syncing…' : syncStatus.state === 'error' ? 'Sync needs attention' : 'Local data'
  return <section className="v3-shell" aria-label="AERION endurance coach">
    <aside className="v3-sidebar"><AerionLogo /><p className="v3-nav-label">YOUR TRAINING</p><nav aria-label="Main navigation">{navItems.map(navButton)}</nav><div className="v3-sidebar-note"><span className="v3-status-dot" /> Local-first coaching<p>Your evidence. Your next move.</p></div></aside>
    <div className="v3-page"><header className="v3-topbar"><div className="v3-mobile-brand"><AerionLogo /></div><span className="v3-desktop-date">{new Date(today + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span><button className="v3-source-button" onClick={() => navigate('settings')}><span className="v3-status-dot" />{syncLabel}</button></header>
      <div className="v3-content"><Suspense fallback={<p role="status">Loading AERION…</p>}>
        {activeScreen === 'home' && <HomeScreen {...props} onNavigate={navigate} />}
        {activeScreen === 'history' && <HistoryScreen {...props} />}
        {activeScreen === 'performance' && <PerformanceScreen {...props} />}
        {activeScreen === 'races' && <RacesScreen {...props} />}
        {activeScreen === 'training' && <TrainingScreen {...props} />}
        {activeScreen === 'recovery' && <RecoveryScreen {...props} />}
        {activeScreen === 'goals' && <GoalsScreen {...props} />}
        {activeScreen === 'coach' && <AiCoachScreen {...props} />}
        {activeScreen === 'settings' && <SettingsDataScreen {...props} />}
      </Suspense></div>
    </div>
    <nav className="v3-bottom-nav" aria-label="Mobile navigation">{navItems.slice(0, 4).map(navButton)}<button type="button" aria-label="More navigation" aria-haspopup="dialog" onClick={() => moreDialog.current?.showModal()}><MoreHorizontal size={18} /><span>More</span></button></nav>
    <dialog ref={moreDialog} className="v3-more-dialog" aria-labelledby="v3-more-title"><div className="v3-section-heading"><h2 id="v3-more-title">Explore AERION</h2><button aria-label="Close navigation" onClick={() => moreDialog.current?.close()}><X size={20} /></button></div><nav aria-label="More navigation destinations">{navItems.slice(4).map(navButton)}</nav></dialog>
  </section>
}

