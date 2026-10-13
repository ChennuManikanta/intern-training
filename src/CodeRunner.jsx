import { useRef, useState } from 'react'
import { LANGS, runCode } from './runner.js'
import { debugCode } from './ai.js'
import { md } from './md.js'
import { Icon } from './ui.jsx'

const isStarter = (code) => !code.trim() || Object.values(LANGS).some((l) => l.starter.trim() === code.trim())
const norm = (s) => s.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trim()

// Controlled editor + runner. value = { lang, code, stdin }, onChange(patch).
export default function CodeRunner({ value, onChange, expected, sampleInput, problem, onRun, tall }) {
  const { lang, code, stdin } = value
  const [res, setRes] = useState(null)
  const [running, setRunning] = useState(false)
  const [err, setErr] = useState('')
  const [debug, setDebug] = useState(''), [debugging, setDebugging] = useState(false)
  const gutter = useRef(null)
  const lines = code.split('\n').length

  const run = async () => {
    if (running) return
    setRunning(true); setErr('')
    try { const r = { ...(await runCode(lang, code, stdin)), stdin }; setRes(r); onRun?.(r) }
    catch (e) { setErr(e.message) }
    finally { setRunning(false) }
  }

  const askDebug = async () => {
    setDebugging(true); setDebug(''); setErr('')
    try { setDebug(await debugCode({ lang: LANGS[lang].label, code, stdin, result: res, problem, expected })) }
    catch (e) { setErr(e.message) }
    finally { setDebugging(false) }
  }

  const setLang = (l) => onChange({ lang: l, ...(isStarter(code) && { code: LANGS[l].starter }) })

  const onKey = (e) => {
    const ta = e.target, { selectionStart: s, selectionEnd: en } = ta
    const edit = (text, caret) => { onChange({ code: code.slice(0, s) + text + code.slice(en) }); requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = caret }) }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run() }
    else if (e.key === 'Tab') { e.preventDefault(); edit('    ', s + 4) }
    else if (e.key === 'Enter') {
      const indent = code.slice(code.lastIndexOf('\n', s - 1) + 1, s).match(/^\s*/)[0]
      const extra = /[{:(\[]\s*$/.test(code.slice(0, s)) ? '    ' : ''
      e.preventDefault(); edit('\n' + indent + extra, s + 1 + indent.length + extra.length)
    }
  }

  const checkable = res && expected != null && norm(res.stdin ?? '') === norm(sampleInput ?? '')
  const matches = checkable && norm(res.stdout) === norm(expected)
  const status = !res ? null
    : res.compileError && /error/i.test(res.compileError) ? ['bad', 'Compilation error']
    : res.signal || res.exitCode ? ['bad', 'Runtime error']
    : ['good', 'Ran successfully']

  return (
    <div className="ide">
      <div className="ide-bar">
        <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
          {Object.entries(LANGS).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}
        </select>
        <span className="ide-file">main.{LANGS[lang].ext}</span>
        <div className="grow" />
        <button className="ide-btn" onClick={() => onChange({ code: LANGS[lang].starter })} title="Reset to template"><Icon n="refresh" s={15} /><span>Reset</span></button>
        <button className="ide-btn" onClick={askDebug} disabled={debugging || !code.trim()} title="Find and fix bugs with AI"><Icon n="bulb" s={15} /><span>{debugging ? 'Analysing…' : 'Debug with AI'}</span></button>
        <button className="ide-run" onClick={run} disabled={running || !code.trim()} title="Run (Ctrl+Enter)"><Icon n="play" s={15} />{running ? 'Running…' : 'Run'}</button>
      </div>

      <div className={`ide-editor ${tall ? 'tall' : ''}`}>
        <pre className="ide-gutter" ref={gutter} aria-hidden="true">{Array.from({ length: lines }, (_, i) => i + 1).join('\n')}</pre>
        <textarea value={code} spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" wrap="off"
          onChange={(e) => onChange({ code: e.target.value })} onKeyDown={onKey}
          onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.target.scrollTop }} aria-label="Code editor" />
      </div>

      <div className="ide-io">
        <div className="ide-pane">
          <div className="ide-pane-head">Input (stdin)</div>
          <textarea value={stdin} onChange={(e) => onChange({ stdin: e.target.value })} placeholder="Program input, one value per line" spellCheck={false} />
        </div>
        <div className="ide-pane">
          <div className="ide-pane-head">
            Output
            {status && <span className={`ide-status ${status[0]}`}>{status[1]} · {res.ms} ms</span>}
          </div>
          <div className="ide-console">
            {running ? <span className="dim">Running your program…</span>
              : !res ? <span className="dim">Press Run or Ctrl+Enter to execute your code.</span>
              : <>
                {res.compileError && <pre className={/error/i.test(res.compileError) ? 'err' : 'warn'}>{res.compileError}</pre>}
                {res.stdout && <pre>{res.stdout}</pre>}
                {res.stderr && <pre className="err">{res.stderr}</pre>}
                {!res.stdout && !res.stderr && !res.compileError && <span className="dim">(no output)</span>}
                <span className="dim exit">Process exited with code {res.exitCode}{res.signal && ` · ${res.signal}`}</span>
              </>}
          </div>
        </div>
      </div>

      {checkable && (
        <div className={`ide-check ${matches ? 'good' : 'bad'}`}>
          <Icon n={matches ? 'check' : 'x'} s={16} />
          {matches ? 'Output matches the expected output for the sample input.' : <>Output differs from expected. Expected: <code>{expected}</code></>}
        </div>
      )}
      {err && <div className="alert error">{err}</div>}
      {debug && (
        <div className="ide-debug">
          <div className="row between"><strong className="row"><Icon n="bulb" s={16} />AI debugging report</strong><button className="link sm" onClick={() => setDebug('')}>Close</button></div>
          <div className="prose" dangerouslySetInnerHTML={{ __html: md(debug) }} />
        </div>
      )}
    </div>
  )
}
