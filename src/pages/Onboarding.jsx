import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth, saveProfile } from '../firebase.js'
import { BRANCHES, ROLES, SKILLS, rolesFor } from '../data.js'
import { useApp, Icon, Mark, Logo, Tile, go } from '../ui.jsx'

const friendly = (e) => e.code === 'permission-denied'
  ? 'Firestore is blocking saves. In Firebase console → Firestore Database → Rules, paste the contents of firestore.rules and click Publish.'
  : e.message

export default function Onboarding({ done }) {
  const { user, profile, setProfile } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile?.name || user.displayName || '')
  const [branch, setBranch] = useState(profile?.branch || '')
  const [other, setOther] = useState(profile?.branch && !BRANCHES[profile.branch] ? profile.branch : '')
  const [role, setRole] = useState(profile?.role || '')
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const first = name.trim().split(' ')[0]

  const pickBranch = (b) => { setBranch(b); setRole(''); setShowAll(false); setStep(2) }
  const pickRole = (r) => { setRole(r); setStep(3) }

  const save = async () => {
    setBusy(true); setErr('')
    const p = { name: name.trim(), branch, role, email: user.email, updatedAt: Date.now() }
    try { await saveProfile(user.uid, p); setProfile({ ...profile, ...p }); done(); go('/dashboard') }
    catch (e) { setErr(friendly(e)); setBusy(false) }
  }

  const fit = rolesFor(branch)
  const roles = showAll ? [...fit, ...Object.keys(ROLES).filter((r) => !fit.includes(r))] : fit

  const steps = [
    {
      q: "Welcome to BriVox. What should we call you?",
      body: (
        <form className="ob-input" onSubmit={(e) => { e.preventDefault(); name.trim() && setStep(1) }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Type your name" />
          <button className="btn primary" disabled={!name.trim()}>Continue <Icon n="arrow" s={16} /></button>
        </form>
      ),
    },
    {
      q: `Thanks, ${first}. Which branch are you studying?`,
      body: (
        <>
          <div className="ob-grid">
            {Object.entries(BRANCHES).map(([b, { icon, color }], k) => (
              <button key={b} className={`ob-opt ${branch === b ? 'on' : ''}`} style={{ '--c': color, animationDelay: `${k * 40}ms` }} onClick={() => pickBranch(b)}>
                <Tile n={icon} c={color} s={46} /><strong>{b}</strong>
              </button>
            ))}
          </div>
          <form className="ob-input" onSubmit={(e) => { e.preventDefault(); other.trim() && pickBranch(other.trim()) }}>
            <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Other branch? Type it here, e.g. Biotechnology" />
            <button className="btn outline" disabled={!other.trim()}>Use this</button>
          </form>
        </>
      ),
    },
    {
      q: BRANCHES[branch]
        ? `These internships are the best fit for ${branch} students. Which role are you targeting?`
        : `Select the internship track that best matches your goals.`,
      body: (
        <>
          <div className="ob-grid roles">
            {roles.map((r, k) => {
              const { icon, color, desc, skills } = ROLES[r]
              return (
                <button key={r} className={`ob-opt role ${role === r ? 'on' : ''}`} style={{ '--c': color, animationDelay: `${k * 40}ms` }} onClick={() => pickRole(r)}>
                  <Tile n={icon} c={color} s={46} />
                  <div>
                    <strong>{r}</strong>
                    <small>{desc}</small>
                    <span className="ob-skills">{Object.keys(skills).filter((s) => !['aptitude', 'communication'].includes(s)).slice(0, 4).map((s) => <i key={s}>{SKILLS[s].name}</i>)}</span>
                  </div>
                </button>
              )
            })}
          </div>
          {BRANCHES[branch] && !showAll && <button className="link" onClick={() => setShowAll(true)}>Show internships from other branches too →</button>}
        </>
      ),
    },
    {
      q: `Great choice, ${first}. Review your goal and confirm to begin.`,
      body: role && (
        <div className="ob-summary" style={{ '--c': ROLES[role].color }}>
          <div className="ob-big"><Tile n={ROLES[role].icon} c={ROLES[role].color} s={72} /></div>
          <h2>{role} Internship</h2>
          <p className="muted">{branch} student · {Object.keys(ROLES[role].skills).length} skills to assess</p>
          <div className="ob-skills center-row">{Object.keys(ROLES[role].skills).map((s) => <i key={s}>{SKILLS[s].name}</i>)}</div>
          {err && <div className="alert error">{err}</div>}
          <button className="btn primary lg full" onClick={save} disabled={busy}>{busy ? 'Saving…' : <>Confirm and continue <Icon n="arrow" s={18} /></>}</button>
        </div>
      ),
    },
  ]

  return (
    <div className="onboard">
      <div className="onboard-inner">
        <div className="row between">
          <Logo />
          {profile?.role ? <button className="btn ghost sm" onClick={done}>Cancel</button> : <button className="btn ghost sm" onClick={() => signOut(auth)}>Sign out</button>}
        </div>

        <div className="ob-progress">{steps.map((_, k) => <span key={k} className={k <= step ? 'on' : ''} />)}</div>

        {/* earlier answers, tap to change */}
        {step > 0 && (
          <div className="ob-answers">
            {[name, branch, role].slice(0, step).map((a, k) => a && (
              <button key={k} className="ob-answer" onClick={() => setStep(k)} title="Change"><Icon n={['user', 'cap', 'briefcase'][k]} s={15} />{a}<Icon n="pen" s={13} /></button>
            ))}
          </div>
        )}

        <div className="ob-step" key={step}>
          <div className="ob-q"><Mark s={40} /><p>{steps[step].q}</p></div>
          {steps[step].body}
        </div>

        {step > 0 && <button className="link back" onClick={() => setStep(step - 1)}>← Back</button>}
      </div>
    </div>
  )
}
