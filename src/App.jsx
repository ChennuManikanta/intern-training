import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, getProfile, listAttempts } from './firebase.js'
import { skillLevels, iri, ROLES } from './data.js'
import { AppCtx, Icon, Spinner, Logo, Tile, go } from './ui.jsx'
import Auth from './pages/Auth.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Assessment from './pages/Assessment.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Learn from './pages/Learn.jsx'
import SkillGraph from './pages/SkillGraph.jsx'
import Progress from './pages/Progress.jsx'
import Mentor from './pages/Mentor.jsx'
import CodeLab from './pages/CodeLab.jsx'
import Profile from './pages/Profile.jsx'

const NAV = [
  ['dashboard', 'home', 'Dashboard'],
  ['assess', 'test', 'Assessment'],
  ['roadmap', 'map', 'Roadmap'],
  ['graph', 'graph', 'Skill Graph'],
  ['progress', 'chart', 'Progress'],
  ['code', 'code', 'Code Lab'],
  ['mentor', 'chat', 'AI Mentor'],
  ['profile', 'user', 'Profile'],
]
const MOBILE = ['dashboard', 'assess', 'code', 'mentor', 'progress']

const useHash = () => {
  const [h, setH] = useState(location.hash.slice(2))
  useEffect(() => { const f = () => { setH(location.hash.slice(2)); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [editGoal, setEditGoal] = useState(false)
  const hash = useHash()

  const reload = async (u = user) => {
    const [p, a] = await Promise.all([getProfile(u.uid), listAttempts(u.uid)])
    setProfile(p); setAttempts(a)
  }

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (u) await reload(u).catch(console.error)
    setUser(u)
  }), [])

  // Only attempts for the current role count toward its IRI.
  const ctx = useMemo(() => {
    const mine = attempts.filter((a) => a.role === profile?.role)
    const levels = skillLevels(mine)
    return { user, profile, attempts: mine, levels, iri: profile?.role ? iri(profile.role, levels) : 0, reload, setProfile }
  }, [user, profile, attempts])

  if (user === undefined) return <Spinner label="Loading BriVox…" />
  if (!user) return <Auth />
  if (!profile?.role || !ROLES[profile.role] || editGoal)
    return <AppCtx.Provider value={ctx}><Onboarding done={() => setEditGoal(false)} /></AppCtx.Provider>

  const [page, arg] = hash.split('/')
  const view = {
    assess: <Assessment skill={arg} key={arg || 'all'} />,
    roadmap: <Roadmap />,
    learn: <Learn skill={arg} key={arg} />,
    graph: <SkillGraph />,
    progress: <Progress />,
    mentor: <Mentor />,
    code: <CodeLab />,
    profile: <Profile />,
  }[page] || <Dashboard />
  const active = page === 'learn' ? 'roadmap' : (NAV.find((n) => n[0] === page) ? page : 'dashboard')
  const initials = (profile.name || user.email || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const r = ROLES[profile.role]
  const sub = {
    dashboard: 'Your readiness at a glance', assess: 'Measure your skills with fresh, role-based questions', roadmap: 'Your prioritised plan to close skill gaps',
    graph: 'How your role skills connect', progress: 'Track how your skills improve over time', mentor: 'Your personal career mentor',
    code: 'Write, run and debug programs', profile: 'Manage your details, goal and security',
  }[active]

  return (
    <AppCtx.Provider value={ctx}>
      <div className="shell">
        <aside className="sidebar">
          <Logo light />
          <small className="nav-label">Menu</small>
          <nav>
            {NAV.map(([id, ic, label]) => (
              <a key={id} href={`#/${id}`} className={active === id ? 'active' : ''}><Icon n={ic} />{label}</a>
            ))}
          </nav>
          <div className="side-goal" style={{ '--c': r.color }}>
            <Tile n={r.icon} c={r.color} s={38} />
            <div className="grow"><small>Target role</small><strong>{profile.role}</strong></div>
            <button className="side-edit" onClick={() => setEditGoal(true)} aria-label="Change goal" title="Change goal"><Icon n="pen" s={16} /></button>
          </div>
          <div className="side-user">
            <a className="side-me" href="#/profile" title="View profile">
              <div className="avatar">{initials}</div>
              <div className="grow"><strong>{profile.name}</strong><small>View profile</small></div>
            </a>
            <button className="side-edit" onClick={() => signOut(auth)} aria-label="Sign out" title="Sign out"><Icon n="logout" s={18} /></button>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <span className="mobile-only"><Logo /></span>
            <div className="topbar-title desktop-only"><h1>{NAV.find((n) => n[0] === active)?.[2]}</h1><p>{sub}</p></div>
            <div className="topbar-right">
              <button className="chip goal-chip" onClick={() => setEditGoal(true)} style={{ '--c': r.color }}><Icon n={r.icon} s={16} /><span>{profile.role}</span></button>
              <button className="icon-btn mobile-only" onClick={() => go('/graph')} aria-label="Skill graph"><Icon n="graph" s={20} /></button>
              <a className="avatar" href="#/profile" title="Profile">{initials}</a>
            </div>
          </header>
          <main className={`content ${page === 'mentor' ? 'full' : page === 'code' ? 'wide' : ''}`}>{view}</main>
        </div>

        <nav className="bottom-nav">
          {MOBILE.map((id) => { const [, ic, label] = NAV.find((n) => n[0] === id); return (
            <a key={id} href={`#/${id}`} className={active === id ? 'active' : ''}><span className="bn-ic"><Icon n={ic} /></span><span>{label.replace('AI ', '')}</span></a>
          ) })}
        </nav>
      </div>
    </AppCtx.Provider>
  )
}
