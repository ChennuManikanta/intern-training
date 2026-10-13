import { useEffect, useState } from 'react'
import { genAssessment, gradeTasks } from '../ai.js'
import { addAttempt } from '../firebase.js'
import { SKILLS, roleSkills, iri as calcIri, READY } from '../data.js'
import { useApp, Icon, Tile, Spinner, Bar, go } from '../ui.jsx'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function Assessment({ skill }) {
  const { user, profile, attempts, levels, iri, reload } = useApp()
  const focus = skill && roleSkills(profile.role).includes(skill) ? skill : null
  const [stage, setStage] = useState('intro') // intro | loading | test | grading | result
  const [test, setTest] = useState(null)
  const [i, setI] = useState(0)
  const [picks, setPicks] = useState({})
  const [texts, setTexts] = useState({})
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (stage !== 'test') return
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [stage])

  const start = async () => {
    setStage('loading'); setErr('')
    try {
      const t = await genAssessment({
        role: profile.role, branch: profile.branch,
        skills: focus ? [focus] : roleSkills(profile.role),
        perSkill: focus ? 8 : 2, openTasks: !focus, levels,
        avoid: attempts.flatMap((a) => a.stems || []),
      })
      setTest(t); setI(0); setPicks({}); setTexts({}); setSecs(0); setStage('test')
    } catch (e) { setErr(e.message); setStage('intro') }
  }

  const submit = async () => {
    setStage('grading'); setErr('')
    try {
      const graded = await gradeTasks(test.tasks, test.tasks.map((_, k) => texts[k]))
      const per = {}
      const push = (s, v) => (per[s] ||= []).push(v)
      test.questions.forEach((q, k) => push(q.skill, picks[k] === q.answer ? 100 : 0))
      test.tasks.forEach((t, k) => { push(t.skill, graded[k].score); push(t.skill, graded[k].score) }) // open task counts as 2 MCQs
      const skillScores = Object.fromEntries(Object.entries(per).map(([s, v]) => [s, Math.round(v.reduce((a, b) => a + b, 0) / v.length)]))
      const all = Object.values(per).flat()
      const newIri = calcIri(profile.role, { ...levels, ...skillScores })
      const attempt = {
        role: profile.role, branch: profile.branch, kind: focus ? 'skill' : 'full', focus: focus || null,
        date: Date.now(), duration: secs, score: Math.round(all.reduce((a, b) => a + b, 0) / all.length),
        skillScores, iri: newIri, stems: test.questions.map((q) => q.question.slice(0, 140)),
      }
      await addAttempt(user.uid, attempt)
      setResult({ ...attempt, graded, before: iri })
      setStage('result')
      reload()
    } catch (e) { setErr(e.message); setStage('test') }
  }

  if (stage === 'loading') return <Spinner label={`Generating a fresh ${focus ? SKILLS[focus].name + ' practice set' : 'diagnostic'} for ${profile.role}…`} />
  if (stage === 'grading') return <Spinner label="Evaluating your answers…" />

  if (stage === 'intro') {
    const parts = focus
      ? [['target', '#6366f1', `8 questions on ${SKILLS[focus].name}`, 'Adapted to your current level']]
      : [['brain', '#8b5cf6', 'Aptitude & reasoning', 'Quantitative and logical'], ['layers', '#6366f1', 'Technical MCQs', `${roleSkills(profile.role).length} role skills`], ['code', '#06b6d4', 'Coding task', 'Short and practical'], ['chat', '#ec4899', 'Communication', 'Scenario and written task']]
    return (
      <div className="stack narrow">
        <section className="card intro-card">
          <span className="eyebrow">{focus ? 'Skill practice' : 'Full diagnostic'}</span>
          <h1>{focus ? `${SKILLS[focus].name} check` : `${profile.role} readiness diagnostic`}</h1>
          <p className="muted">Each assessment is generated fresh for your role, so questions are never repeated. Your results update your skill levels and Internship Readiness Index.</p>
          <div className="parts">{parts.map(([ic, c, t, d]) => <div key={t} className="part"><Tile n={ic} c={c} s={42} /><strong>{t}</strong><small>{d}</small></div>)}</div>
          {err && <div className="alert error">{err}</div>}
          <button className="btn primary lg full" onClick={start}><Icon n="play" s={18} />Start {focus ? 'practice' : 'diagnostic'}</button>
        </section>
        {!focus && (
          <section className="card">
            <h2>Or practise one skill</h2>
            <div className="chips">
              {roleSkills(profile.role).map((s) => (
                <button key={s} className="chip lg" onClick={() => go(`/assess/${s}`)}>{SKILLS[s].name} {levels[s] != null && <b className={levels[s] >= READY ? 'ok' : ''}>{levels[s]}</b>}</button>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  if (stage === 'result') {
    const r = result
    return (
      <div className="stack narrow">
        <section className="card result-hero">
          <span className="eyebrow">Results</span>
          <div className="result-score">{r.score}<em>%</em></div>
          <div className="iri-move">
            <div><small>IRI before</small><strong>{r.before}</strong></div>
            <Icon n="arrow" s={22} />
            <div><small>IRI now</small><strong className="grad">{r.iri}</strong></div>
          </div>
          <div className="row wrap center-row">
            <button className="btn primary" onClick={() => go('/roadmap')}>See my roadmap</button>
            <button className="btn outline" onClick={() => go('/dashboard')}>Dashboard</button>
          </div>
        </section>

        <section className="card">
          <h2>Skill scores</h2>
          <ul className="skill-list">
            {Object.entries(r.skillScores).map(([s, v]) => (
              <li key={s}>
                <div className="row between"><span>{SKILLS[s].name}</span><b>{v}</b></div>
                <Bar value={v} />
                {v < READY && <button className="link sm" onClick={() => go(`/learn/${s}`)}>Improve {SKILLS[s].name} →</button>}
              </li>
            ))}
          </ul>
        </section>

        {test.tasks.length > 0 && (
          <section className="card">
            <h2>Task feedback</h2>
            {test.tasks.map((t, k) => (
              <div key={k} className="review">
                <div className="row between"><span className="tag">{t.kind} · {SKILLS[t.skill].name}</span><b>{r.graded[k].score}/100</b></div>
                <p>{t.prompt}</p>
                <p className="feedback"><b>Feedback:</b> {r.graded[k].feedback}</p>
              </div>
            ))}
          </section>
        )}

        <section className="card">
          <h2>Review answers</h2>
          {test.questions.map((q, k) => {
            const ok = picks[k] === q.answer
            return (
              <div key={k} className={`review ${ok ? 'ok' : 'bad'}`}>
                <div className="row between"><span className="tag">{SKILLS[q.skill].name}</span><span className={ok ? 'ok' : 'bad'}><Icon n={ok ? 'check' : 'x'} s={18} /></span></div>
                <p><strong>{k + 1}.</strong> {q.question}</p>
                {q.code && <pre><code>{q.code}</code></pre>}
                {!ok && <p className="muted">Your answer: {picks[k] != null ? q.options[picks[k]] : 'skipped'}</p>}
                <p><b>Correct:</b> {q.options[q.answer]}</p>
                {q.explanation && <p className="feedback"><b>Explanation:</b> {q.explanation}</p>}
              </div>
            )
          })}
        </section>
      </div>
    )
  }

  // stage === 'test'
  const total = test.questions.length + test.tasks.length
  const isTask = i >= test.questions.length
  const q = isTask ? null : test.questions[i]
  const t = isTask ? test.tasks[i - test.questions.length] : null
  const answered = Object.keys(picks).length + Object.values(texts).filter((x) => x?.trim()).length

  return (
    <div className="stack narrow">
      <div className="test-top">
        <span>Question {i + 1} of {total}</span>
        <span className="timer"><Icon n="clock" s={16} /> {fmt(secs)}</span>
      </div>
      <div className="bar"><div className="bar-fill brand" style={{ width: `${((i + 1) / total) * 100}%` }} /></div>

      <section className="card question" key={i}>
        <span className="tag">{isTask ? `${t.kind === 'coding' ? 'Coding' : 'Written'} task · ${SKILLS[t.skill].name}` : SKILLS[q.skill].name}</span>
        {isTask ? (
          <>
            <h2 className="q-text">{t.prompt}</h2>
            <textarea className={t.kind === 'coding' ? 'mono' : ''} rows={t.kind === 'coding' ? 12 : 7} placeholder={t.kind === 'coding' ? '# write your code here' : 'Write your answer…'}
              value={texts[i - test.questions.length] || ''} onChange={(e) => setTexts({ ...texts, [i - test.questions.length]: e.target.value })} spellCheck={t.kind !== 'coding'} />
          </>
        ) : (
          <>
            <h2 className="q-text">{q.question}</h2>
            {q.code && <pre><code>{q.code}</code></pre>}
            <div className="options">
              {q.options.map((o, k) => (
                <button key={k} className={`option ${picks[i] === k ? 'on' : ''}`} onClick={() => setPicks({ ...picks, [i]: k })}>
                  <span className="opt-key">{'ABCD'[k]}</span><span>{o}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {err && <div className="alert error">{err}</div>}
      <div className="row between">
        <button className="btn outline" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < total - 1
          ? <button className="btn primary" onClick={() => setI(i + 1)}>Next <Icon n="arrow" s={16} /></button>
          : <button className="btn primary" onClick={submit}>Submit ({answered}/{total})</button>}
      </div>

      <div className="dots">
        {Array.from({ length: total }, (_, k) => {
          const done = k < test.questions.length ? picks[k] != null : !!texts[k - test.questions.length]?.trim()
          return <button key={k} className={`dot ${k === i ? 'cur' : ''} ${done ? 'done' : ''}`} onClick={() => setI(k)} aria-label={`Question ${k + 1}`}>{k + 1}</button>
        })}
      </div>
    </div>
  )
}
