import { useEffect, useState } from 'react'
import { genNotes } from '../ai.js'
import { md } from '../md.js'
import { SKILLS, READY, videoSearch } from '../data.js'
import { useApp, Icon, Tile, Bar, Spinner, go, mentorInbox } from '../ui.jsx'

const cacheKey = (s, r) => `brivox-notes:${r}:${s}`
const load = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const store = (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }

export default function Learn({ skill }) {
  const { profile, levels } = useApp()
  const sk = SKILLS[skill]
  const [tab, setTab] = useState('notes')
  const [notes, setNotes] = useState(() => sk && load(cacheKey(skill, profile.role)))
  const [err, setErr] = useState('')

  const gen = async () => {
    setNotes(null); setErr('')
    try { const n = await genNotes(skill, profile.role, levels[skill]); setNotes(n); store(cacheKey(skill, profile.role), n) }
    catch (e) { setErr(e.message) }
  }
  useEffect(() => { if (sk && !notes) gen() }, [])

  if (!sk) return <div className="card empty"><p>Unknown skill.</p><button className="btn primary" onClick={() => go('/roadmap')}>Back to roadmap</button></div>

  const ask = (q) => { mentorInbox.prompt = q; go('/mentor') }
  const subtopics = sk.topic.split(',').map((t) => t.trim())

  return (
    <div className="stack narrow">
      <button className="link back" onClick={() => go('/roadmap')}>← Roadmap</button>
      <section className="card learn-head">
        <div className="row between wrap">
          <div>
            <span className="eyebrow">Skill module</span>
            <h1>{sk.name}</h1>
            <p className="muted">{sk.topic}</p>
          </div>
          <div className="lvl"><small>Your level</small><strong>{levels[skill] ?? '—'}</strong><small>target {READY}</small></div>
        </div>
        <Bar value={levels[skill]} />
        {sk.pre.length > 0 && <p className="small muted">Prerequisites: {sk.pre.map((p) => SKILLS[p].name).join(', ')}</p>}
      </section>

      <div className="tabs">
        {[['notes', 'book', 'Notes'], ['videos', 'play', 'Videos'], ['practice', 'test', 'Practice']].map(([id, ic, l]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}><Icon n={ic} s={16} />{l}</button>
        ))}
      </div>

      {tab === 'notes' && (
        <section className="card">
          {err ? <><div className="alert error">{err}</div><button className="btn primary" onClick={gen}>Try again</button></>
            : !notes ? <Spinner label="Writing personalised notes…" />
            : <>
              <div className="prose" dangerouslySetInnerHTML={{ __html: md(notes) }} />
              <div className="row wrap mt">
                <button className="btn outline sm" onClick={gen}><Icon n="refresh" s={16} />Regenerate</button>
                <button className="btn outline sm" onClick={() => ask(`I just read notes on ${sk.name}. Explain the hardest part simply with an example, then check my understanding.`)}><Icon n="chat" s={16} />Explain with Mentor</button>
              </div>
            </>}
        </section>
      )}

      {tab === 'videos' && (
        <section className="card">
          <p className="muted">Curated YouTube searches for each subtopic. Choose a recent, well-reviewed video.</p>
          <div className="video-grid">
            <a className="video-card" href={videoSearch(skill)} target="_blank" rel="noopener"><span className="vid-thumb"><Icon n="play" s={28} /></span><strong>{sk.name} — full course</strong><small>YouTube</small></a>
            {subtopics.map((t) => (
              <a key={t} className="video-card" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t + ' explained')}`} target="_blank" rel="noopener">
                <span className="vid-thumb"><Icon n="play" s={28} /></span><strong>{t}</strong><small>YouTube</small>
              </a>
            ))}
          </div>
        </section>
      )}

      {tab === 'practice' && (
        <section className="card practice">
          <div className="practice-opt">
            <Tile n="test" c="#6366f1" /><div className="grow"><strong>Scored practice test</strong><small>8 fresh questions. Updates your {sk.name} level and IRI.</small></div>
            <button className="btn primary sm" onClick={() => go(`/assess/${skill}`)}>Start</button>
          </div>
          <div className="practice-opt">
            <Tile n="chat" c="#ec4899" /><div className="grow"><strong>Quiz me in chat</strong><small>Your mentor asks one question at a time and explains each answer.</small></div>
            <button className="btn outline sm" onClick={() => ask(`Quiz me on ${sk.name} — 5 questions, one at a time, matched to my level.`)}>Start</button>
          </div>
          <div className="practice-opt">
            <Tile n="tool" c="#10b981" /><div className="grow"><strong>Practical task</strong><small>Get a realistic mini-project task for {profile.role} interns.</small></div>
            <button className="btn outline sm" onClick={() => ask(`Give me one realistic practical task on ${sk.name} that a ${profile.role} intern would do. When I submit my solution, review it.`)}>Start</button>
          </div>
        </section>
      )}
    </div>
  )
}
