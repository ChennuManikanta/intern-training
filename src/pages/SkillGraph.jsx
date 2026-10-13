import { SKILLS, READY, roleSkills, depth } from '../data.js'
import { useApp, go } from '../ui.jsx'

const W = 210, H = 64, GX = 90, GY = 26

export default function SkillGraph() {
  const { profile, levels } = useApp()
  const set = roleSkills(profile.role), memo = {}
  const cols = {}
  set.forEach((s) => (cols[depth(s, set, memo)] ||= []).push(s))
  const ncol = Object.keys(cols).length, nrow = Math.max(...Object.values(cols).map((c) => c.length))
  const width = ncol * W + (ncol - 1) * GX + 20, height = nrow * H + (nrow - 1) * GY + 20
  const pos = {}
  Object.entries(cols).forEach(([d, list]) => list.forEach((s, r) => {
    const off = ((nrow - list.length) * (H + GY)) / 2
    pos[s] = { x: 10 + d * (W + GX), y: 10 + off + r * (H + GY) }
  }))
  const tone = (v) => (v == null ? 'none' : v >= READY ? 'good' : v >= 45 ? 'mid' : 'low')

  return (
    <div className="stack">
      <section className="page-head">
        <h1>Skill graph</h1>
        <p className="muted">How {profile.role} skills connect. Arrows point from a prerequisite to the skill it unlocks. Tap a skill to study it.</p>
        <div className="legend">
          <span><i className="good" />Ready (≥{READY})</span><span><i className="mid" />Developing</span><span><i className="low" />Gap</span><span><i className="none" />Not assessed</span>
        </div>
      </section>
      <div className="card graph-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: Math.min(width, 640) }} role="img" aria-label="Skill prerequisite graph">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" className="edge-head" /></marker>
          </defs>
          {set.flatMap((s) => SKILLS[s].pre.filter((p) => pos[p]).map((p) => {
            const a = pos[p], b = pos[s], x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x - 2, y2 = b.y + H / 2, mx = (x1 + x2) / 2
            return <path key={p + s} d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} className={`edge ${(levels[p] ?? 0) >= READY ? 'met' : ''}`} markerEnd="url(#arr)" />
          }))}
          {set.map((s) => {
            const { x, y } = pos[s], v = levels[s]
            return (
              <g key={s} className={`node ${tone(v)}`} transform={`translate(${x} ${y})`} onClick={() => go(`/learn/${s}`)} tabIndex={0} role="button" onKeyDown={(e) => e.key === 'Enter' && go(`/learn/${s}`)}>
                <rect width={W} height={H} rx="14" />
                <text x="16" y="27" className="node-name">{SKILLS[s].name}</text>
                <text x="16" y="47" className="node-sub">{v == null ? 'Not assessed' : `Level ${v}`}</text>
                <rect x="16" y={H - 9} width={W - 32} height="4" rx="2" className="node-track" />
                <rect x="16" y={H - 9} width={((W - 32) * (v ?? 0)) / 100} height="4" rx="2" className="node-fill" />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
