import { ROLES, SKILLS, READY, roadmap, roleSkills } from '../data.js'
import { useApp, Gauge, Bar, Icon, Tile, go } from '../ui.jsx'

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

export default function Dashboard() {
  const { profile, attempts, levels, iri } = useApp()
  const w = ROLES[profile.role].skills
  const skills = roleSkills(profile.role).sort((a, b) => w[b] - w[a])
  const assessed = skills.filter((s) => levels[s] != null)
  const ready = skills.filter((s) => (levels[s] ?? 0) >= READY)
  const next = roadmap(profile.role, levels).slice(0, 3)
  const delta = attempts.length > 1 ? iri - attempts.at(-1).iri : null

  const stats = [
    ['target', '#6366f1', 'Readiness index', <>{iri}<em>/100</em></>, delta != null && <span className={delta >= 0 ? 'up' : 'down'}><Icon n="trend" s={14} /> {delta >= 0 ? '+' : ''}{delta} since first test</span>],
    ['layers', '#8b5cf6', 'Skills assessed', <>{assessed.length}<em>/{skills.length}</em></>, <span className="muted">{skills.length - assessed.length ? `${skills.length - assessed.length} still to assess` : 'All assessed'}</span>],
    ['award', '#10b981', 'Internship-ready skills', <>{ready.length}<em>/{skills.length}</em></>, <span className="muted">Level {READY}+ required</span>],
    ['test', '#f59e0b', 'Tests completed', attempts.length, <span className="muted">{attempts[0] ? `Last on ${new Date(attempts[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'None yet'}</span>],
  ]

  return (
    <div className="stack">
      <section className="hero-dark">
        <div className="orb o1" /><div className="orb o2" />
        <div className="hero-text">
          <span className="hero-eyebrow">{greeting()}, {profile.name?.split(' ')[0] || 'there'}</span>
          <h1>{attempts.length ? <>You're on track for your <span className="grad-light">{profile.role}</span> internship</> : <>Let's measure your readiness for <span className="grad-light">{profile.role}</span></>}</h1>
          <p>{attempts.length
            ? `${ready.length} of ${skills.length} skills are at internship level. ${next[0] ? `Your highest-impact focus right now is ${next[0].name}.` : 'All skills are ready — keep practising and start applying.'}`
            : 'Complete a 15-minute diagnostic covering aptitude, technical knowledge, coding and communication. We will identify your gaps and build your roadmap.'}</p>
          <div className="row wrap">
            <button className="btn light lg" onClick={() => go('/assess')}><Icon n="play" s={18} />{attempts.length ? 'Retake diagnostic' : 'Start diagnostic'}</button>
            <button className="btn glass lg" onClick={() => go('/mentor')}><Icon n="chat" s={18} />Talk to mentor</button>
          </div>
        </div>
        <Gauge value={iri} />
      </section>

      <section className="stats">
        {stats.map(([ic, c, label, val, foot]) => (
          <div key={label} className="stat">
            <div className="stat-top"><small>{label}</small><Tile n={ic} c={c} s={38} /></div>
            <strong>{val}</strong>
            {foot || <span className="muted">&nbsp;</span>}
          </div>
        ))}
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><div className="row"><Tile n="bars" c="#6366f1" s={36} /><h2>Skill breakdown</h2></div><a href="#/graph" className="link sm">View skill graph <Icon n="arrow" s={14} /></a></div>
          <ul className="skill-list">
            {skills.map((s) => (
              <li key={s}>
                <div className="row between"><span>{SKILLS[s].name} {w[s] >= 3 && <span className="tag">Core</span>}</span><b>{levels[s] ?? '—'}</b></div>
                <Bar value={levels[s]} />
              </li>
            ))}
          </ul>
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head"><div className="row"><Tile n="map" c="#8b5cf6" s={36} /><h2>Recommended next steps</h2></div><a href="#/roadmap" className="link sm">Full roadmap <Icon n="arrow" s={14} /></a></div>
            {!attempts.length ? <p className="muted">Complete the diagnostic to unlock your personalised roadmap.</p>
              : !next.length ? <p className="muted">No gaps remaining. Try a mock interview with your mentor to stay sharp.</p>
              : <ol className="next-list">
                {next.map((s, i) => (
                  <li key={s.id} onClick={() => go(`/learn/${s.id}`)}>
                    <span className="num">{i + 1}</span>
                    <div className="grow">
                      <strong>{s.name}</strong>
                      <small>{s.level == null ? 'Not assessed yet' : `Current ${s.level} · Target ${READY}`}{s.blocked && ' · Complete prerequisites first'}</small>
                    </div>
                    <Icon n="arrow" s={18} />
                  </li>
                ))}
              </ol>}
          </section>

          <section className="card">
            <div className="card-head"><div className="row"><Tile n="clock" c="#f59e0b" s={36} /><h2>Recent tests</h2></div><a href="#/progress" className="link sm">All progress <Icon n="arrow" s={14} /></a></div>
            {attempts.length ? <ul className="recent">
              {attempts.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <span className="grow">{a.kind === 'skill' ? `${SKILLS[a.focus]?.name} practice` : 'Full diagnostic'}<small className="block">{new Date(a.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</small></span>
                  <b className={`score-chip ${a.score >= READY ? 'good' : a.score >= 45 ? 'mid' : 'low'}`}>{a.score}%</b>
                </li>
              ))}
            </ul> : <p className="muted">You haven't taken any tests yet.</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
