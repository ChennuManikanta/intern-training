import { useEffect, useState } from 'react'
import { genProblem } from '../ai.js'
import { LANGS, SKILL_LANG } from '../runner.js'
import { TECH, SKILLS } from '../data.js'
import { md } from '../md.js'
import CodeRunner from '../CodeRunner.jsx'
import { useApp, Icon, Tile, Spinner } from '../ui.jsx'

const KEY = 'brivox-codelab'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* private mode */ } }

export default function CodeLab() {
  const { profile } = useApp()
  const roleLang = TECH(profile.role).map((s) => SKILL_LANG[s]).find(Boolean) || 'python'
  const saved = load()
  const [ed, setEd] = useState(() => saved.ed || { lang: roleLang, code: LANGS[roleLang].starter, stdin: 'BriVox' })
  const [problem, setProblem] = useState(saved.problem || null)
  const [difficulty, setDifficulty] = useState('Easy')
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [hint, setHint] = useState(false)

  useEffect(() => { save({ ed, problem }) }, [ed, problem])

  const newProblem = async () => {
    setBusy(true); setErr(''); setHint(false)
    try {
      const p = await genProblem({ role: profile.role, lang: ed.lang, difficulty, topic: topic.trim() })
      setProblem({ ...p, lang: ed.lang })
      setEd({ ...ed, code: p.starter || LANGS[ed.lang].starter, stdin: p.sampleInput || '' })
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  const topics = TECH(profile.role).filter((s) => SKILL_LANG[s]).map((s) => SKILLS[s].name).concat(['Arrays', 'Strings', 'Recursion', 'Sorting'])

  return (
    <div className="lab">
      <section className="card lab-side">
        <div className="row"><Tile n="code" c="#06b6d4" s={40} /><div><h2>Code Lab</h2><small className="muted">Write, run and debug programs in 5 languages</small></div></div>

        <div className="lab-gen">
          <div className="seg">
            {['Easy', 'Medium', 'Hard'].map((d) => <button key={d} className={difficulty === d ? 'on' : ''} onClick={() => setDifficulty(d)}>{d}</button>)}
          </div>
          <input list="lab-topics" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (optional), e.g. Strings" />
          <datalist id="lab-topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
          <button className="btn primary full" onClick={newProblem} disabled={busy}><Icon n="bulb" s={16} />{busy ? 'Generating…' : problem ? 'New practice problem' : 'Get a practice problem'}</button>
          {err && <div className="alert error">{err}</div>}
        </div>

        {busy ? <Spinner label="Writing a problem for you…" />
          : problem ? (
            <div className="lab-problem">
              <div className="row between"><h3>{problem.title}</h3><button className="link sm" onClick={() => setProblem(null)}>Free coding</button></div>
              <div className="prose" dangerouslySetInnerHTML={{ __html: md(problem.description) }} />
              {problem.inputFormat && <><h4 className="io-label">Input</h4><p>{problem.inputFormat}</p></>}
              {problem.outputFormat && <><h4 className="io-label">Output</h4><p>{problem.outputFormat}</p></>}
              {problem.constraints && <><h4 className="io-label">Constraints</h4><p>{problem.constraints}</p></>}
              <h4 className="io-label">Sample input</h4><pre><code>{problem.sampleInput || '(none)'}</code></pre>
              <h4 className="io-label">Expected output</h4><pre><code>{problem.sampleOutput}</code></pre>
              <div className="row wrap">
                <button className="btn outline sm" onClick={() => setEd({ ...ed, stdin: problem.sampleInput || '' })}>Use sample input</button>
                {problem.hint && <button className="btn ghost sm" onClick={() => setHint(!hint)}>{hint ? 'Hide hint' : 'Show hint'}</button>}
              </div>
              {hint && <p className="feedback mt"><b>Hint:</b> {problem.hint}</p>}
            </div>
          ) : (
            <div className="lab-free">
              <h3>Free coding mode</h3>
              <ul>
                <li>Pick a language, write your program and press <b>Run</b> (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>).</li>
                <li>Type program input in the <b>Input</b> box — it's passed to your program as stdin.</li>
                <li>Stuck on an error? <b>Debug with AI</b> explains the bug and shows a fixed version.</li>
                <li>Your code is saved in this browser automatically.</li>
              </ul>
            </div>
          )}
      </section>

      <CodeRunner tall value={ed} onChange={(patch) => setEd((v) => ({ ...v, ...patch }))}
        expected={problem ? problem.sampleOutput : undefined} sampleInput={problem?.sampleInput || ''}
        problem={problem ? `${problem.title}\n${problem.description}\nInput: ${problem.inputFormat}\nOutput: ${problem.outputFormat}` : undefined} />
    </div>
  )
}
