import { useEffect, useRef, useState } from 'react'
import { stream, mentorPrompt } from '../ai.js'
import { saveProfile } from '../firebase.js'
import { md } from '../md.js'
import { SKILLS, roadmap } from '../data.js'
import { useApp, Icon, Mark, Tile, go, mentorInbox } from '../ui.jsx'

const TAG = /\[\[TEST:(\w+)\]\]/g

export default function Mentor() {
  const { user, profile, setProfile, levels, iri } = useApp()
  const [msgs, setMsgs] = useState(profile.chat || [])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const end = useRef(null)
  const weakest = roadmap(profile.role, levels)[0]

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs])
  useEffect(() => { if (mentorInbox.prompt) { const p = mentorInbox.prompt; mentorInbox.prompt = ''; send(p) } }, [])

  async function send(text) {
    text = text.trim()
    if (!text || busy) return
    const next = [...msgs, { role: 'user', content: text }]
    setMsgs([...next, { role: 'assistant', content: '' }]); setInput(''); setBusy(true); setErr('')
    try {
      const reply = await stream(
        [{ role: 'system', content: mentorPrompt(profile, levels, iri) }, ...next.slice(-20)],
        (t) => setMsgs([...next, { role: 'assistant', content: t }]),
      )
      const saved = [...next, { role: 'assistant', content: reply }].slice(-40)
      setMsgs(saved)
      saveProfile(user.uid, { chat: saved }).then(() => setProfile((p) => ({ ...p, chat: saved }))).catch(console.error)
    } catch (e) { setErr(e.message); setMsgs(next) }
    finally { setBusy(false) }
  }

  const clear = () => { setMsgs([]); saveProfile(user.uid, { chat: [] }); setProfile((p) => ({ ...p, chat: [] })) }

  const quick = [
    ['target', '#6366f1', 'Practice quiz', `Quiz me on ${weakest?.name || 'my weakest skill'}`],
    ['briefcase', '#ec4899', 'Mock interview', `Run a mock ${profile.role} interview`],
    ['calendar', '#10b981', 'Study plan', 'Create a 2-week study plan based on my skill gaps'],
    ['bulb', '#f59e0b', 'Concept explainer', `Explain ${weakest?.name || 'a core concept'} clearly with examples`],
  ]

  const render = (m, k) => {
    const tests = [...m.content.matchAll(TAG)].map((x) => x[1]).filter((s) => s === 'all' || SKILLS[s])
    return (
      <div key={k} className={`msg ${m.role}`}>
        {m.role === 'assistant' && <Mark s={30} />}
        <div className={m.role === 'user' ? 'bubble' : 'answer'}>
          {m.role === 'user' ? <p>{m.content}</p>
            : m.content ? <div className="prose" dangerouslySetInnerHTML={{ __html: md(m.content.replace(TAG, '')) }} />
            : <div className="typing"><i /><i /><i /></div>}
          {tests.length > 0 && <div className="row wrap">
            {[...new Set(tests)].map((s) => <button key={s} className="btn sm primary" onClick={() => go(s === 'all' ? '/assess' : `/assess/${s}`)}><Icon n="play" s={14} />{s === 'all' ? 'Take full diagnostic' : `Take ${SKILLS[s].name} test`}</button>)}
          </div>}
        </div>
      </div>
    )
  }

  return (
    <div className="chat">
      <div className="chat-head">
        <div className="row chat-title"><Mark s={38} /><div><strong>Vox</strong><small className="block muted">Career mentor · {profile.role}</small></div></div>
        {msgs.length > 0 && <button className="btn ghost sm" onClick={clear} disabled={busy}>New chat</button>}
      </div>

      <div className="chat-body"><div className="chat-col">
        {!msgs.length && (
          <div className="chat-empty">
            <Mark s={60} className="xl" />
            <h2>How can I help you today, {profile.name?.split(' ')[0]}?</h2>
            <p className="muted">I'm Vox, your BriVox career mentor. I know your {profile.role} skill profile (IRI {iri}) and can explain concepts, quiz you, run mock interviews or plan your preparation.</p>
            <div className="quick">
              {quick.map(([ic, c, t, q]) => <button key={q} className="quick-btn" onClick={() => send(q)}><Tile n={ic} c={c} s={34} /><span><strong>{t}</strong><small>{q}</small></span></button>)}
            </div>
          </div>
        )}
        {msgs.map(render)}
        {err && <div className="alert error">{err}</div>}
        <div ref={end} />
      </div></div>

      <div className="composer-wrap">
        <form className="composer chat-col" onSubmit={(e) => { e.preventDefault(); send(input) }}>
          <textarea rows={1} value={input} placeholder="Message Vox…" onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }} />
          <button className="send" disabled={busy || !input.trim()} aria-label="Send"><Icon n="send" s={18} /></button>
        </form>
        <p className="disclaimer">Vox can make mistakes. Official scores come only from BriVox assessments.</p>
      </div>
    </div>
  )
}
