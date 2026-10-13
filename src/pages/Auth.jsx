import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, sendPasswordResetEmail } from 'firebase/auth'
import { auth, google } from '../firebase.js'
import { Icon, Mark, Tile } from '../ui.jsx'

const FEATURES = [
  ['test', '#818cf8', 'Role-based assessments', 'Aptitude, technical, coding and communication'],
  ['target', '#c084fc', 'Internship Readiness Index', 'One clear score for your target role'],
  ['map', '#22d3ee', 'Personalised roadmap', 'Know exactly which gaps to close first'],
  ['chat', '#f472b6', '1:1 career mentor', 'Guided practice and mock interviews'],
]

const friendly = (e) => ({
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow pop-ups and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/unauthorized-domain': `"${location.hostname}" is not an authorised domain. Add it in Firebase Console → Authentication → Settings → Authorized domains.`,
  'auth/invalid-api-key': 'Firebase is not configured. Check the VITE_FIREBASE_* values in .env.',
}[e.code] || e.message)

export default function Auth() {
  const [mode, setMode] = useState('in')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(''), [info, setInfo] = useState(''), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const run = (fn) => async (e) => {
    e?.preventDefault(); setErr(''); setInfo(''); setBusy(true)
    try { await fn() } catch (x) { setErr(friendly(x)) } finally { setBusy(false) }
  }
  const submit = run(async () => {
    if (mode === 'in') return signInWithEmailAndPassword(auth, f.email, f.password)
    const { user } = await createUserWithEmailAndPassword(auth, f.email, f.password)
    await updateProfile(user, { displayName: f.name })
  })
  const reset = run(async () => {
    if (!f.email) throw new Error('Enter your email address above, then select “Forgot password”.')
    await sendPasswordResetEmail(auth, f.email); setInfo('A password reset link has been sent to your email.')
  })

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
        <div className="auth-hero-inner">
          <div className="logo light"><Mark s={36} />BriVox</div>
          <h1>Get internship-ready with a <span className="grad-light">clear, measurable plan.</span></h1>
          <p className="lead">BriVox assesses your skills against real internship requirements, pinpoints your gaps and builds a personalised path to close them.</p>

          <div className="preview">
            <div className="preview-head">
              <div><small>Data Analyst · AI &amp; DS</small><strong>Readiness overview</strong></div>
              <span className="pill good">+18 this month</span>
            </div>
            <div className="preview-body">
              <div className="mini-gauge"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" /><circle cx="40" cy="40" r="32" className="fill" strokeDasharray="201" strokeDashoffset="44" /></svg><b>78</b></div>
              <ul>
                {[['Python', 86], ['SQL Joins', 64], ['Statistics', 72]].map(([k, v]) => (
                  <li key={k}><span>{k}<em>{v}</em></span><i><s style={{ width: `${v}%` }} /></i></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="features">
            {FEATURES.map(([ic, c, t, d]) => (
              <div key={t} className="feature"><Tile n={ic} c={c} s={38} /><div><strong>{t}</strong><small>{d}</small></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="logo auth-mobile-logo"><Mark s={34} />BriVox</div>
          <h2>{mode === 'in' ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="muted">{mode === 'in' ? 'Welcome back. Continue where you left off.' : 'Start measuring your internship readiness today.'}</p>

          <button type="button" className="btn outline full google" onClick={run(() => signInWithPopup(auth, google))} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Continue with Google
          </button>
          <div className="divider"><span>or continue with email</span></div>

          {mode === 'up' && <label>Full name<input required value={f.name} onChange={set('name')} placeholder="Enter your full name" autoComplete="name" /></label>}
          <label>Email address<input required type="email" value={f.email} onChange={set('email')} placeholder="name@college.edu" autoComplete="email" /></label>
          <label>
            <span className="row between">Password {mode === 'in' && <button type="button" className="link sm" onClick={reset}>Forgot password?</button>}</span>
            <span className="pw">
              <input required type={show ? 'text' : 'password'} minLength={6} value={f.password} onChange={set('password')} placeholder={mode === 'in' ? 'Enter your password' : 'At least 6 characters'} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
              <button type="button" className="pw-toggle" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
            </span>
          </label>

          {err && <div className="alert error">{err}</div>}
          {info && <div className="alert ok">{info}</div>}

          <button className="btn primary full lg" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
          <p className="muted center switch">
            {mode === 'in' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); setInfo('') }}>{mode === 'in' ? 'Sign up' : 'Sign in'}</button>
          </p>
        </form>
      </section>
    </div>
  )
}
