import { useState } from 'react'
import { signOut, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail, linkWithCredential, sendPasswordResetEmail } from 'firebase/auth'
import { auth, saveProfile } from '../firebase.js'
import { BRANCHES, ROLES, READY, roleSkills } from '../data.js'
import { useApp, Icon, Tile } from '../ui.jsx'

const friendly = (e) => ({
  'auth/invalid-credential': 'Your current password is incorrect.',
  'auth/wrong-password': 'Your current password is incorrect.',
  'auth/weak-password': 'The new password must be at least 6 characters.',
  'auth/requires-recent-login': 'For security, please sign out and sign in again, then retry.',
  'auth/email-already-in-use': 'That email is already used by another account.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/provider-already-linked': 'A password is already set for this account.',
  'permission-denied': 'Saving was blocked by Firestore rules. Publish firestore.rules in the Firebase console.',
}[e.code] || e.message)

// Small form helper: status message + busy flag per section.
function useAction() {
  const [state, set] = useState({ busy: false, ok: '', err: '' })
  const run = (fn, okMsg) => async (e) => {
    e?.preventDefault(); set({ busy: true, ok: '', err: '' })
    try { await fn(); set({ busy: false, ok: okMsg, err: '' }) } catch (x) { set({ busy: false, ok: '', err: friendly(x) }) }
  }
  const msg = (state.ok && <div className="alert ok">{state.ok}</div>) || (state.err && <div className="alert error">{state.err}</div>)
  return [run, state.busy, msg]
}

export default function Profile() {
  const { user, profile, setProfile, attempts, iri, levels } = useApp()
  const [f, setF] = useState({
    name: profile.name || '', phone: profile.phone || '', college: profile.college || '', gradYear: profile.gradYear || '',
    city: profile.city || '', linkedin: profile.linkedin || '', github: profile.github || '', bio: profile.bio || '',
  })
  const [goal, setGoal] = useState({ branch: profile.branch, role: profile.role })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [mail, setMail] = useState({ email: '', current: '' })
  const set = (setter, obj, k) => (e) => setter({ ...obj, [k]: e.target.value })

  const [runDetails, busyDetails, msgDetails] = useAction()
  const [runGoal, busyGoal, msgGoal] = useAction()
  const [runPw, busyPw, msgPw] = useAction()
  const [runMail, busyMail, msgMail] = useAction()
  const [runMisc, , msgMisc] = useAction()
  const [runAcct, , msgAcct] = useAction()

  const hasPassword = user.providerData.some((p) => p.providerId === 'password')
  const viaGoogle = user.providerData.some((p) => p.providerId === 'google.com')
  const initials = (f.name || user.email).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const ready = roleSkills(profile.role).filter((s) => (levels[s] ?? 0) >= READY).length
  const reauth = (password) => reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))

  const saveDetails = runDetails(async () => {
    if (!f.name.trim()) throw new Error('Name cannot be empty.')
    const data = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()]))
    await saveProfile(user.uid, { ...data, updatedAt: Date.now() })
    if (data.name !== user.displayName) await updateProfile(user, { displayName: data.name })
    setProfile((p) => ({ ...p, ...data }))
  }, 'Your details have been saved.')

  const saveGoal = runGoal(async () => {
    if (!goal.branch.trim()) throw new Error('Branch cannot be empty.')
    await saveProfile(user.uid, { branch: goal.branch.trim(), role: goal.role, updatedAt: Date.now() })
    setProfile((p) => ({ ...p, branch: goal.branch.trim(), role: goal.role }))
  }, 'Career goal updated.')

  const changePassword = runPw(async () => {
    if (pw.next !== pw.confirm) throw new Error('New passwords do not match.')
    if (pw.next.length < 6) throw new Error('The new password must be at least 6 characters.')
    if (hasPassword) { await reauth(pw.current); await updatePassword(user, pw.next) }
    else await linkWithCredential(user, EmailAuthProvider.credential(user.email, pw.next)) // Google user adding a password
    setPw({ current: '', next: '', confirm: '' })
  }, hasPassword ? 'Password updated successfully.' : 'Password set. You can now also sign in with email and password.')

  const changeEmail = runMail(async () => {
    await reauth(mail.current)
    await verifyBeforeUpdateEmail(user, mail.email.trim())
    setMail({ email: '', current: '' })
  }, 'Verification link sent to your new email. Your email will change once you confirm it.')

  return (
    <div className="stack">
      <section className="profile-hero">
        <div className="orb o1" /><div className="orb o2" />
        <div className="avatar xl">{initials}</div>
        <div className="grow">
          <h1>{profile.name}</h1>
          <p>{user.email}</p>
          <div className="row wrap">
            <span className="hero-chip"><Icon n="cap" s={14} />{profile.branch}</span>
            <span className="hero-chip"><Icon n={ROLES[profile.role].icon} s={14} />{profile.role}</span>
            {profile.college && <span className="hero-chip"><Icon n="building" s={14} />{profile.college}</span>}
            <span className="hero-chip"><Icon n="calendar" s={14} />Joined {new Date(user.metadata.creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="profile-stats">
          <div><strong>{iri}</strong><small>IRI</small></div>
          <div><strong>{attempts.length}</strong><small>Tests</small></div>
          <div><strong>{ready}</strong><small>Ready skills</small></div>
        </div>
      </section>

      <div className="grid-2">
        <form className="card" onSubmit={saveDetails}>
          <div className="card-head"><div className="row"><Tile n="user" c="#6366f1" s={36} /><h2>Personal details</h2></div></div>
          <div className="form-grid">
            <label>Full name<input value={f.name} onChange={set(setF, f, 'name')} required /></label>
            <label>Phone<input type="tel" value={f.phone} onChange={set(setF, f, 'phone')} placeholder="+91 98765 43210" /></label>
            <label>College<input value={f.college} onChange={set(setF, f, 'college')} placeholder="Your college or university" /></label>
            <label>Graduation year<input type="number" min="2020" max="2035" value={f.gradYear} onChange={set(setF, f, 'gradYear')} placeholder="2027" /></label>
            <label>City<input value={f.city} onChange={set(setF, f, 'city')} placeholder="Hyderabad" /></label>
            <label>LinkedIn<input type="url" value={f.linkedin} onChange={set(setF, f, 'linkedin')} placeholder="https://linkedin.com/in/…" /></label>
            <label>GitHub<input type="url" value={f.github} onChange={set(setF, f, 'github')} placeholder="https://github.com/…" /></label>
            <label className="span-2">About you<textarea rows={3} value={f.bio} onChange={set(setF, f, 'bio')} placeholder="A short summary of your interests and goals" /></label>
          </div>
          {msgDetails}
          <button className="btn primary" disabled={busyDetails}>{busyDetails ? 'Saving…' : 'Save details'}</button>
        </form>

        <div className="stack">
          <form className="card" onSubmit={saveGoal}>
            <div className="card-head"><div className="row"><Tile n="target" c="#8b5cf6" s={36} /><h2>Career goal</h2></div></div>
            <label>Branch
              <input list="branches" value={goal.branch} onChange={set(setGoal, goal, 'branch')} />
              <datalist id="branches">{Object.keys(BRANCHES).map((b) => <option key={b} value={b} />)}</datalist>
            </label>
            <label>Target internship role
              <select value={goal.role} onChange={set(setGoal, goal, 'role')}>
                {Object.keys(ROLES).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            {goal.role !== profile.role && <p className="muted small">Your IRI is tracked per role. Switching shows your progress for {goal.role}; your {profile.role} results are kept.</p>}
            {msgGoal}
            <button className="btn primary" disabled={busyGoal || (goal.role === profile.role && goal.branch === profile.branch)}>{busyGoal ? 'Saving…' : 'Update goal'}</button>
          </form>

          <form className="card" onSubmit={changePassword}>
            <div className="card-head"><div className="row"><Tile n="lock" c="#10b981" s={36} /><h2>{hasPassword ? 'Change password' : 'Set a password'}</h2></div></div>
            {!hasPassword && viaGoogle && <p className="muted small">You sign in with Google. Set a password to also sign in with your email address.</p>}
            {hasPassword && <label>Current password<input type="password" value={pw.current} onChange={set(setPw, pw, 'current')} required autoComplete="current-password" /></label>}
            <div className="form-grid">
              <label>New password<input type="password" minLength={6} value={pw.next} onChange={set(setPw, pw, 'next')} required autoComplete="new-password" /></label>
              <label>Confirm new password<input type="password" minLength={6} value={pw.confirm} onChange={set(setPw, pw, 'confirm')} required autoComplete="new-password" /></label>
            </div>
            {msgPw}
            <div className="row wrap">
              <button className="btn primary" disabled={busyPw}>{busyPw ? 'Updating…' : hasPassword ? 'Update password' : 'Set password'}</button>
              {hasPassword && <button type="button" className="link sm" onClick={runMisc(() => sendPasswordResetEmail(auth, user.email), 'Password reset email sent.')}>Forgot current password?</button>}
            </div>
            {msgMisc}
          </form>

          {hasPassword && (
            <form className="card" onSubmit={changeEmail}>
              <div className="card-head"><div className="row"><Tile n="chat" c="#f59e0b" s={36} /><h2>Change email</h2></div></div>
              <label>New email address<input type="email" value={mail.email} onChange={set(setMail, mail, 'email')} required autoComplete="email" /></label>
              <label>Current password<input type="password" value={mail.current} onChange={set(setMail, mail, 'current')} required autoComplete="current-password" /></label>
              {msgMail}
              <button className="btn primary" disabled={busyMail}>{busyMail ? 'Sending…' : 'Send verification link'}</button>
            </form>
          )}

          <section className="card">
            <div className="card-head"><div className="row"><Tile n="cog" c="#64748b" s={36} /><h2>Account</h2></div></div>
            <div className="row wrap">
              <button className="btn outline" onClick={runAcct(async () => { await saveProfile(user.uid, { chat: [] }); setProfile((p) => ({ ...p, chat: [] })) }, 'Mentor chat history cleared.')}>Clear mentor chat history</button>
              <button className="btn outline danger" onClick={() => signOut(auth)}><Icon n="logout" s={16} />Sign out</button>
            </div>
            {msgAcct}
          </section>
        </div>
      </div>
    </div>
  )
}
