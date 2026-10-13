import { createContext, useContext } from 'react'
import { band } from './data.js'

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)
export const go = (path) => { location.hash = path }
export const mentorInbox = { prompt: '' } // other pages drop a message here, Mentor sends it on open

const C = (r, x = 12, y = 12) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0` // circle as path
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  test: 'M9 4h6M9 4a2 2 0 0 0-2 2H5v15h14V6h-2a2 2 0 0 0-2-2M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M8 13l2.5 2.5L16 10',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  graph: `${C(2, 6, 6)}${C(2, 18, 6)}${C(2, 12, 18)}M7.5 7.5l3.5 9M16.5 7.5l-3.5 9M8 6h8`,
  chart: 'M3 3v18h18M7 15l4-4 3 3 6-7',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  book: 'M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h8',
  play: 'M7 4.5v15l12-7.5z',
  send: 'M12 19V5M5 12l7-7 7 7',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6 6 18',
  refresh: 'M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 13 2M19 9A7 7 0 0 0 6 7',
  brain: 'M9.5 3A2.5 2.5 0 0 0 7 5.5 3 3 0 0 0 4.5 9a3 3 0 0 0 0 5A3 3 0 0 0 7 18.5 2.5 2.5 0 0 0 12 19V5.5A2.5 2.5 0 0 0 9.5 3zM14.5 3A2.5 2.5 0 0 1 17 5.5 3 3 0 0 1 19.5 9a3 3 0 0 1 0 5 3 3 0 0 1-2.5 4.5A2.5 2.5 0 0 1 12 19',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
  radio: `${C(2)}M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2`,
  zap: 'M13 2 4 14h7l-1 8 9-12h-7z',
  cog: `${C(3)}M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1`,
  building: 'M4 21V5l8-3v19M12 9l8 3v9M2 21h20M8 9h.01M8 13h.01M8 17h.01M16 15h.01M16 18h.01',
  bars: 'M4 20V11M10 20V4M16 20v-7M21 20H3',
  flask: 'M9 3h6M10 3v6L4.5 19a1 1 0 0 0 .9 1.5h13.2a1 1 0 0 0 .9-1.5L14 9V3M7 15h10',
  cpu: 'M6 6h12v12H6zM9.5 9.5h5v5h-5zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
  globe: `${C(9)}M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18`,
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  plug: 'M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4',
  target: `${C(9)}${C(5)}${C(1)}`,
  briefcase: 'M3 7h18v13H3zM8 7V4h8v3M3 13h18',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  clock: `${C(9)}M12 7v5l3 2`,
  pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.6-.6-2.5z',
  award: `${C(6, 12, 9)}M8.5 14 7 22l5-3 5 3-1.5-8`,
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5',
  cap: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
  calendar: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4',
  mic: 'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3',
}
export const Icon = ({ n, s = 20, w = 2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={P[n] || P.target} />
  </svg>
)

// Brand mark: used for the logo and for Vox (the mentor) — one consistent identity, no generic "AI" glyphs.
export const Mark = ({ s = 32, className = '' }) => (
  <span className={`mark ${className}`} style={{ width: s, height: s }}>
    <svg viewBox="0 0 32 32" width={s * 0.62} height={s * 0.62} aria-hidden="true">
      <path d="M6 7.5h9.5a5 5 0 0 1 0 10H6z" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M13 17.5l4.5 7L27 7" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
    </svg>
  </span>
)
export const Logo = ({ light }) => <a className={`logo ${light ? 'light' : ''}`} href="#/dashboard"><Mark s={34} />BriVox</a>

// Icon on a coloured gradient tile
export const Tile = ({ n, c = 'var(--brand)', s = 44 }) => (
  <span className="tile" style={{ '--c': c, width: s, height: s }}><Icon n={n} s={Math.round(s * 0.48)} /></span>
)

export const Spinner = ({ label }) => (
  <div className="center-load"><div className="spinner" />{label && <p>{label}</p>}</div>
)

// Circular IRI gauge
export function Gauge({ value, size = 190 }) {
  const r = 72, c = 2 * Math.PI * r, b = band(value)
  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180">
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a5b4fc" /><stop offset=".5" stopColor="#c084fc" /><stop offset="1" stopColor="#67e8f9" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={r} className="gauge-track" />
        <circle cx="90" cy="90" r={r} stroke="url(#gg)" strokeWidth="13" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 90 90)" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="gauge-label"><strong>{value}</strong><span>IRI score</span></div>
      <span className={`pill ${b.tone}`}>{b.label}</span>
    </div>
  )
}

export const Bar = ({ value }) => {
  const tone = value == null ? 'none' : value >= 70 ? 'good' : value >= 45 ? 'mid' : 'low'
  return <div className="bar"><div className={`bar-fill ${tone}`} style={{ width: `${value ?? 0}%` }} /></div>
}
