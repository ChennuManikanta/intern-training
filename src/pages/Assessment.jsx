import { useEffect, useState } from 'react'
import { genAssessment, gradeTasks } from '../ai.js'
import { addAttempt } from '../firebase.js'
import { SKILLS, SECTIONS, TECH, roleSkills, iri as calcIri, READY } from '../data.js'
import { LANGS, SKILL_LANG, runCode, runSummary } from '../runner.js'
import { md } from '../md.js'
import CodeRunner from '../CodeRunner.jsx'
import { useApp, Icon, Tile, Spinner, Bar, go } from '../ui.jsx'

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// What each test mode contains. Returns null if the mode isn't available for the role.
function planFor(mode, role) {
  const tech = TECH(role), runnable = tech.filter((s) => SKILL_LANG[s])
  switch (mode) {
    case 'full': return { skills: roleSkills(role), perSkill: 2, coding: runnable.slice(0, 1), written: true }
    case 'aptitude': return { skills: ['aptitude'], perSkill: 10 }
    case 'technical': return { skills: tech, perSkill: Math.max(2, Math.ceil(12 / tech.length)) }
    case 'coding': return runnable.length ? { skills: [], perSkill: 0, coding: [0, 1, 2].map((i) => runnable[i % runnable.length]) } : null
    case 'communication': return { skills: ['communication'], perSkill: 6, written: true }
    default: return { skills: [mode], perSkill: 8 } // single skill
  }
}
const describe = (p) => [p.skills.length * p.perSkill && `${p.skills.length * p.perSkill} MCQs`, p.coding?.length && `${p.coding.length} coding task${p.coding.length > 1 ? 's' : ''}`, p.written && '1 written task'].filter(Boolean).join(' · ')

export default function Assessment({ skill }) {
  const { user, profile, attempts, levels, iri, reload } = useApp()
  const section = skill?.startsWith('sec-') && SECTIONS[skill.slice(4)] ? skill.slice(4) : null
  const focus = !section && roleSkills(profile.role).includes(skill) ? skill : null
  const mode = section || focus || 'full'
  const plan = planFor(mode, profile.role)

  const [stage, setStage] = useState('intro') // intro | loading | test | grading | result
  const [test, setTest] = useState(null)
  const [i, setI] = useState(0)
  const [picks, setPicks] = useState({})
  const [texts, setTexts] = useState({}) // written answers by task index
  const [codes, setCodes] = useState({}) // {lang, code, stdin} by task index
  const [runs, setRuns] = useState({})   // last run result by task index
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (stage !== 'test') return
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [stage])

  const title = section ? SECTIONS[section].name : focus ? SKILLS[focus].name : `${profile.role} readiness diagnostic`

  const start = async () => {
    setStage('loading'); setErr('')
    try {
      const t = await genAssessment({ role: profile.role, branch: profile.branch, levels, avoid: attempts.flatMap((a) => a.stems || []), ...plan })
      setTest(t); setI(0); setPicks({}); setTexts({}); setRuns({}); setSecs(0)
      setCodes(Object.fromEntries(t.tasks.map((x, k) => [k, { lang: x.lang, code: x.starter, stdin: x.sampleInput || '' }]).filter(([k]) => t.tasks[k].kind === 'coding')))
      setStage('test')
    } catch (e) { setErr(e.message); setStage('intro') }
  }

  const submit = async () => {
    setStage('grading'); setErr('')
    try {
      // Run any coding answer the student didn't run themselves, on the sample input.
      const finalRuns = { ...runs }
      await Promise.all(test.tasks.map(async (t, k) => {
        const c = codes[k]
        if (t.kind !== 'coding' || finalRuns[k] || !c?.code.trim() || c.code === t.starter) return
        finalRuns[k] = await runCode(c.lang, c.code, t.sampleInput || '').catch(() => null)
      }))
      const answers = test.tasks.map((t, k) => t.kind === 'coding'
        ? (codes[k]?.code.trim() && codes[k].code !== t.starter ? `Language: ${LANGS[codes[k].lang].label}\n${codes[k].code}\n\n[Run results]\n${runSummary(finalRuns[k])}` : '')
        : texts[k])
      const graded = await gradeTasks(test.tasks, answers)
      const per = {}
      const push = (s, v) => (per[s] ||= []).push(v)
      test.questions.forEach((q, k) => push(q.skill, picks[k] === q.answer ? 100 : 0))
      test.tasks.forEach((t, k) => { push(t.skill, graded[k].score); push(t.skill, graded[k].score) }) // open task counts as 2 MCQs
      const skillScores = Object.fromEntries(Object.entries(per).map(([s, v]) => [s, Math.round(v.reduce((a, b) => a + b, 0) / v.length)]))
      const all = Object.values(per).flat()
      const attempt = {
        role: profile.role, branch: profile.branch, kind: section ? 'section' : focus ? 'skill' : 'full', focus: section || focus || null,
        date: Date.now(), duration: secs, score: Math.round(all.reduce((a, b) => a + b, 0) / all.length),
        skillScores, iri: calcIri(profile.role, { ...levels, ...skillScores }),
        stems: [...test.questions.map((q) => q.question), ...test.tasks.map((t) => t.prompt)].map((x) => x.slice(0, 140)),
      }
      await addAttempt(user.uid, attempt)
      setRuns(finalRuns)
      setResult({ ...attempt, graded, before: iri })
      setStage('result')
      reload()
    } catch (e) { setErr(e.message); setStage('test') }
  }

  if (stage === 'loading') return <Spinner label={`Preparing your ${title} test…`} />
  if (stage === 'grading') return <Spinner label="Running and evaluating your answers…" />

  if (stage === 'intro') {
    if (mode !== 'full') {
      const meta = section ? SECTIONS[section] : { icon: 'target', color: '#6366f1' }
      return (
        <div className="stack narrow">
          <button className="link back" onClick={() => go('/assess')}>← All assessments</button>
          <section className="card intro-card">
            <div className="ob-big"><Tile n={meta.icon} c={meta.color} s={64} /></div>
            <span className="eyebrow">{section ? 'Section test' : 'Skill practice'}</span>
            <h1>{title}</h1>
            {plan ? <>
              <p className="muted">{section === 'coding'
                ? 'Write real programs, run them against sample input and debug in the built-in editor. Your code is executed and evaluated for correctness.'
                : 'Questions are generated fresh for your role and level. Results update the related skill levels and your Internship Readiness Index.'}</p>
              <div className="chips center-row mt">{plan.skills.concat(plan.coding || []).filter((s, k, a) => a.indexOf(s) === k).map((s) => <span key={s} className="chip">{SKILLS[s].name}</span>)}</div>
              <p className="muted small">{describe(plan)}</p>
              {err && <div className="alert error">{err}</div>}
              <button className="btn primary lg full" onClick={start}><Icon n="play" s={18} />Start test</button>
            </> : <p className="muted">Your {profile.role} track doesn't include programming skills, so there is no coding test. Try the Code Lab for open practice.</p>}
          </section>
        </div>
      )
    }
    return (
      <div className="stack narrow">
        <section className="card intro-card">
          <span className="eyebrow">Full diagnostic</span>
          <h1>{title}</h1>
          <p className="muted">Covers every section in one sitting: {describe(plan)}. Questions are generated fresh for your role and never repeated.</p>
          {err && <div className="alert error">{err}</div>}
          <button className="btn primary lg full" onClick={start}><Icon n="play" s={18} />Start full diagnostic</button>
        </section>

        <section className="card">
          <div className="card-head"><div><h2>Section tests</h2><p className="muted small" style={{ margin: 0 }}>Take one section at a time.</p></div></div>
          <div className="sections">
            {Object.entries(SECTIONS).map(([id, s]) => {
              const p = planFor(id, profile.role)
              return (
                <button key={id} className="section-card" style={{ '--c': s.color }} onClick={() => go(`/assess/sec-${id}`)} disabled={!p}>
                  <Tile n={s.icon} c={s.color} s={44} />
                  <strong>{s.name}</strong>
                  <small>{p ? describe(p) : 'Not part of this role'}</small>
                  {p && <span className="section-go">Start <Icon n="arrow" s={14} /></span>}
                </button>
              )
            })}
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Practise one skill</h2></div>
          <div className="chips">
            {roleSkills(profile.role).map((s) => (
              <button key={s} className="chip lg" onClick={() => go(`/assess/${s}`)}>{SKILLS[s].name} {levels[s] != null && <b className={levels[s] >= READY ? 'ok' : ''}>{levels[s]}</b>}</button>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (stage === 'result') {
    const r = result
    return (
      <div className="stack narrow">
        <section className="card result-hero">
          <span className="eyebrow">{title} · Results</span>
          <div className="result-score">{r.score}<em>%</em></div>
          <div className="iri-move">
            <div><small>IRI before</small><strong>{r.before}</strong></div>
            <Icon n="arrow" s={22} />
            <div><small>IRI now</small><strong className="grad">{r.iri}</strong></div>
          </div>
          <div className="row wrap center-row">
            <button className="btn primary" onClick={() => go('/roadmap')}>See my roadmap</button>
            <button className="btn outline" onClick={() => go('/assess')}>More tests</button>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Skill scores</h2></div>
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
            <div className="card-head"><h2>Task feedback</h2></div>
            {test.tasks.map((t, k) => (
              <div key={k} className="review">
                <div className="row between"><span className="tag">{t.kind} · {SKILLS[t.skill].name}</span><b>{r.graded[k].score}/100</b></div>
                <div className="prose" dangerouslySetInnerHTML={{ __html: md(t.prompt) }} />
                {t.kind === 'coding' && codes[k] && <pre><code>{codes[k].code}</code></pre>}
                {t.kind === 'coding' && runs[k] && <p className="muted small">Output on sample input: <code>{(runs[k].stdout || runs[k].stderr || runs[k].compileError || '(none)').trim().slice(0, 200)}</code></p>}
                <p className="feedback"><b>Feedback:</b> {r.graded[k].feedback}</p>
              </div>
            ))}
          </section>
        )}

        {test.questions.length > 0 && (
          <section className="card">
            <div className="card-head"><h2>Review answers</h2></div>
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
        )}
      </div>
    )
  }

  // stage === 'test'
  const nq = test.questions.length
  const total = nq + test.tasks.length
  const isTask = i >= nq
  const q = isTask ? null : test.questions[i]
  const ti = i - nq, t = isTask ? test.tasks[ti] : null
  const done = (k) => k < nq ? picks[k] != null
    : test.tasks[k - nq].kind === 'coding' ? !!codes[k - nq]?.code.trim() && codes[k - nq].code !== test.tasks[k - nq].starter
    : !!texts[k - nq]?.trim()
  const answered = Array.from({ length: total }, (_, k) => done(k)).filter(Boolean).length

  return (
    <div className={`stack ${t?.kind === 'coding' ? '' : 'narrow'}`}>
      <div className="test-top">
        <span>{title} · Question {i + 1} of {total}</span>
        <span className="timer"><Icon n="clock" s={16} /> {fmt(secs)}</span>
      </div>
      <div className="bar"><div className="bar-fill brand" style={{ width: `${((i + 1) / total) * 100}%` }} /></div>

      {t?.kind === 'coding' ? (
        <div className="code-task" key={i}>
          <section className="card problem">
            <span className="tag">Coding task · {SKILLS[t.skill].name}</span>
            <div className="prose mt" dangerouslySetInnerHTML={{ __html: md(t.prompt) }} />
            {t.sampleInput != null && <><h4 className="io-label">Sample input</h4><pre><code>{t.sampleInput || '(none)'}</code></pre></>}
            {t.sampleOutput != null && <><h4 className="io-label">Expected output</h4><pre><code>{t.sampleOutput}</code></pre></>}
          </section>
          <CodeRunner value={codes[ti]} onChange={(patch) => setCodes((c) => ({ ...c, [ti]: { ...c[ti], ...patch } }))}
            expected={t.sampleOutput} sampleInput={t.sampleInput || ''} problem={t.prompt} onRun={(r) => setRuns((x) => ({ ...x, [ti]: r }))} />
        </div>
      ) : (
        <section className="card question" key={i}>
          <span className="tag">{isTask ? `Written task · ${SKILLS[t.skill].name}` : SKILLS[q.skill].name}</span>
          {isTask ? (
            <>
              <h2 className="q-text">{t.prompt}</h2>
              <textarea rows={7} placeholder="Write your answer…" value={texts[ti] || ''} onChange={(e) => setTexts({ ...texts, [ti]: e.target.value })} />
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
      )}

      {err && <div className="alert error">{err}</div>}
      <div className="row between">
        <button className="btn outline" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < total - 1
          ? <button className="btn primary" onClick={() => setI(i + 1)}>Next <Icon n="arrow" s={16} /></button>
          : <button className="btn primary" onClick={submit}>Submit ({answered}/{total})</button>}
      </div>

      <div className="dots">
        {Array.from({ length: total }, (_, k) => (
          <button key={k} className={`dot ${k === i ? 'cur' : ''} ${done(k) ? 'done' : ''}`} onClick={() => setI(k)} aria-label={`Question ${k + 1}`}>{k + 1}</button>
        ))}
      </div>
    </div>
  )
}
