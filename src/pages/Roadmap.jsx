import { SKILLS, READY, roadmap, roleSkills } from '../data.js'
import { useApp, Icon, Tile, Bar, go } from '../ui.jsx'

export default function Roadmap() {
  const { profile, levels, attempts } = useApp()
  const plan = roadmap(profile.role, levels)
  const done = roleSkills(profile.role).filter((s) => (levels[s] ?? 0) >= READY)

  return (
    <div className="stack narrow">
      <section className="page-head">
        <h1>Your learning roadmap</h1>
        <p className="muted">Ordered by prerequisites first, then by how much each gap costs your {profile.role} readiness.</p>
      </section>

      {!attempts.length && (
        <div className="card empty">
          <p>Take the diagnostic first so BriVox can find your gaps.</p>
          <button className="btn primary" onClick={() => go('/assess')}>Start diagnostic</button>
        </div>
      )}

      <ol className="timeline">
        {plan.map((s, i) => (
          <li key={s.id} className={s.blocked ? 'blocked' : i === 0 ? 'current' : ''}>
            <span className="tl-dot">{s.blocked ? <Icon n="lock" s={14} /> : i + 1}</span>
            <div className="card tl-card">
              <div className="row between wrap">
                <div>
                  <h3>{s.name} {s.weight >= 3 && <span className="tag">Core</span>}</h3>
                  <small className="muted">{s.level == null ? 'Not assessed yet' : `Level ${s.level} → target ${READY}`}
                    {s.blocked && ` · Unlock after: ${s.pre.filter((p) => (levels[p] ?? 0) < READY).map((p) => SKILLS[p].name).join(', ')}`}</small>
                </div>
                <div className="row">
                  <button className="btn sm outline" onClick={() => go(`/assess/${s.id}`)}>Practice test</button>
                  <button className="btn sm primary" onClick={() => go(`/learn/${s.id}`)}>Learn</button>
                </div>
              </div>
              <Bar value={s.level} />
              <p className="muted small">{s.topic}</p>
            </div>
          </li>
        ))}
      </ol>

      {done.length > 0 && (
        <section className="card">
          <div className="row card-head"><Tile n="award" c="#10b981" s={36} /><h2>Internship-ready skills</h2></div>
          <div className="chips">{done.map((s) => <span key={s} className="chip lg on">{SKILLS[s].name} · {levels[s]}</span>)}</div>
        </section>
      )}
    </div>
  )
}
