import { SKILLS, roleSkills } from '../data.js'
import { useApp, go } from '../ui.jsx'

function LineChart({ points }) {
  const w = 640, h = 220, p = 32
  const x = (i) => p + (points.length < 2 ? (w - 2 * p) / 2 : (i * (w - 2 * p)) / (points.length - 1))
  const y = (v) => h - p - (v / 100) * (h - 2 * p)
  const line = points.map((pt, i) => `${i ? 'L' : 'M'}${x(i)} ${y(pt.v)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="line-chart" role="img" aria-label="IRI over time">
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--brand)" stopOpacity=".3" /><stop offset="1" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
      {[0, 25, 50, 75, 100].map((g) => <g key={g}><line x1={p} x2={w - p} y1={y(g)} y2={y(g)} className="grid" /><text x={p - 8} y={y(g) + 4} className="axis" textAnchor="end">{g}</text></g>)}
      {points.length > 1 && <path d={`${line} L${x(points.length - 1)} ${h - p} L${x(0)} ${h - p}Z`} fill="url(#area)" />}
      <path d={line} className="series" />
      {points.map((pt, i) => <g key={i}><circle cx={x(i)} cy={y(pt.v)} r="5" className="pt" /><text x={x(i)} y={y(pt.v) - 12} textAnchor="middle" className="pt-label">{pt.v}</text><title>{pt.label}: {pt.v}</title></g>)}
    </svg>
  )
}

const Spark = ({ vals }) => {
  if (vals.length < 2) return <span className="muted small">{vals.length ? 'one test' : '—'}</span>
  const pts = vals.map((v, i) => `${(i * 80) / (vals.length - 1)},${24 - (v / 100) * 22}`).join(' ')
  return <svg viewBox="0 0 80 26" className="spark"><polyline points={pts} /></svg>
}

export default function Progress() {
  const { profile, attempts } = useApp()
  const chron = [...attempts].reverse()

  if (!attempts.length) return (
    <div className="card empty narrow"><h2>No progress yet</h2><p className="muted">Take your first diagnostic to start tracking.</p><button className="btn primary" onClick={() => go('/assess')}>Start diagnostic</button></div>
  )

  return (
    <div className="stack">
      <section className="page-head">
        <h1>Progress</h1>
        <p className="muted">How your demonstrated skills and IRI for {profile.role} change over time.</p>
      </section>
      <section className="card">
        <h2>IRI over time</h2>
        <div className="chart-wrap"><LineChart points={chron.map((a) => ({ v: a.iri, label: new Date(a.date).toLocaleDateString() }))} /></div>
      </section>
      <div className="grid-2">
        <section className="card">
          <h2>Skill trends</h2>
          <table className="table">
            <thead><tr><th>Skill</th><th>First</th><th>Latest</th><th>Trend</th></tr></thead>
            <tbody>
              {roleSkills(profile.role).map((s) => {
                const vals = chron.map((a) => a.skillScores?.[s]).filter((v) => v != null)
                const d = vals.length > 1 ? vals.at(-1) - vals[0] : null
                return (
                  <tr key={s}>
                    <td>{SKILLS[s].name}</td><td>{vals[0] ?? '—'}</td>
                    <td><b>{vals.at(-1) ?? '—'}</b>{d != null && d !== 0 && <span className={d > 0 ? 'up' : 'down'}> {d > 0 ? '+' : ''}{d}</span>}</td>
                    <td><Spark vals={vals} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        <section className="card">
          <h2>Test history</h2>
          <ul className="recent">
            {attempts.map((a) => (
              <li key={a.id}>
                <span>{a.kind === 'skill' ? `${SKILLS[a.focus]?.name} practice` : 'Full diagnostic'}<small className="block">{new Date(a.date).toLocaleString()} · IRI {a.iri}</small></span>
                <b>{a.score}%</b>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
