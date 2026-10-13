import { SKILLS, ROLES } from './data.js'

const URL = '/api/groq/chat/completions' // proxied by Vite; key is added server-side
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b'

async function call(body) {
  const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODEL, ...body }) })
  if (!r.ok) {
    const msg = (await r.json().catch(() => ({})))?.error?.message
    throw new Error(r.status === 401 ? 'Groq API key missing or invalid — check GROQ_API_KEY in .env and restart.' : msg || `AI request failed (${r.status})`)
  }
  return r
}

export async function ask(messages, { json = false, temperature = 0.7 } = {}) {
  const r = await call({ messages, temperature, ...(json && { response_format: { type: 'json_object' } }) })
  const text = (await r.json()).choices[0].message.content
  return json ? JSON.parse(text) : text
}

// Streams tokens via SSE; calls onToken(fullTextSoFar).
export async function stream(messages, onToken) {
  const r = await call({ messages, stream: true, temperature: 0.7 })
  const reader = r.body.getReader(), dec = new TextDecoder()
  let buf = '', out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop()
    for (const l of lines) {
      if (!l.startsWith('data: ') || l === 'data: [DONE]') continue
      const t = JSON.parse(l.slice(6)).choices[0]?.delta?.content
      if (t) onToken((out += t))
    }
  }
  return out
}

const skillList = (ids) => ids.map((s) => `- ${s}: ${SKILLS[s].name} (${SKILLS[s].topic})`).join('\n')

// Generates an assessment. Every item is tagged with a skill id (mapped content).
export async function genAssessment({ role, branch, skills, perSkill, levels = {}, avoid = [], openTasks = true }) {
  const lvl = skills.map((s) => `${s}: ${levels[s] ?? 'unknown'}`).join(', ')
  const codeSkill = skills.find((s) => ['python', 'pandas', 'sqlJoins', 'sqlBasics', 'dsa', 'javascript', 'react', 'apis', 'cProg', 'oop', 'ml'].includes(s))
  const data = await ask([
    { role: 'system', content: 'You are an expert technical interviewer who writes accurate internship assessment questions. Respond only with valid JSON.' },
    { role: 'user', content: `Create an internship readiness assessment for a ${branch} student targeting a "${role}" internship.

Skills (id: name (topics)):
${skillList(skills)}

Current levels 0-100 (adapt difficulty; unknown = medium): ${lvl}

Write exactly ${perSkill} multiple-choice questions per skill. Mix conceptual, practical and scenario questions at real internship-interview level. Exactly one correct option. For "aptitude" use quantitative/logical puzzles; for "communication" use workplace scenario questions.
${openTasks ? `Also write ${codeSkill ? 'one "coding" task for skill "' + codeSkill + '" (solvable in under 15 lines) and ' : ''}one "written" practical task for skill "communication" (e.g. explain a finding to a non-technical manager in 3-5 sentences).` : 'Do not write any tasks (empty array).'}
${avoid.length ? `Do NOT repeat or paraphrase these previous questions:\n${avoid.slice(0, 40).map((q) => '- ' + q).join('\n')}` : ''}

JSON format:
{"questions":[{"skill":"<skill id>","question":"...","code":"<optional code snippet or empty string>","options":["...","...","...","..."],"answer":<0-3>,"explanation":"<one sentence why>"}],
 "tasks":[{"skill":"<skill id>","kind":"coding|written","prompt":"..."}]}` },
  ], { json: true, temperature: 0.8 })

  const questions = (data.questions || []).filter((q) => SKILLS[q.skill] && skills.includes(q.skill) && q.options?.length === 4 && q.answer >= 0 && q.answer < 4)
  const tasks = openTasks ? (data.tasks || []).filter((t) => SKILLS[t.skill] && t.prompt) : []
  if (!questions.length) throw new Error('The AI returned no usable questions. Please try again.')
  return { questions, tasks }
}

export async function gradeTasks(tasks, answers) {
  const todo = tasks.map((t, i) => ({ ...t, answer: (answers[i] || '').trim() }))
  if (todo.every((t) => !t.answer)) return todo.map(() => ({ score: 0, feedback: 'No answer submitted.' }))
  const { results = [] } = await ask([
    { role: 'system', content: 'You are a fair but strict internship evaluator. Respond only with valid JSON.' },
    { role: 'user', content: `Grade each answer 0-100 (correctness, clarity, completeness). Empty answers get 0. Give 1-2 sentences of specific, actionable feedback.

${todo.map((t, i) => `#${i} [${t.kind}] Task: ${t.prompt}\nAnswer:\n${t.answer || '(empty)'}`).join('\n\n')}

JSON: {"results":[{"score":<0-100>,"feedback":"..."}]} in the same order.` },
  ], { json: true, temperature: 0.2 })
  return todo.map((t, i) => (t.answer ? { score: Math.max(0, Math.min(100, Number(results[i]?.score) || 0)), feedback: results[i]?.feedback || '' } : { score: 0, feedback: 'No answer submitted.' }))
}

export const genNotes = (skill, role, level) => ask([
  { role: 'system', content: 'You are a friendly, expert tutor. Write concise, well-structured study notes in Markdown (## headings, bullet lists, short ```code``` examples where useful, a **Key takeaways** section and 3 practice exercises at the end).' },
  { role: 'user', content: `Study notes on "${SKILLS[skill].name}" (${SKILLS[skill].topic}) for a student preparing for a ${role} internship. Their current level is ${level ?? 'unknown'}/100 — pitch it accordingly and focus on what interviewers actually ask.` },
], { temperature: 0.5 })

export function mentorPrompt(profile, levels, iriScore) {
  const skills = Object.keys(ROLES[profile.role].skills)
  return `You are "Vox", the AI mentor inside BriVox — an app that measures a student's Internship Readiness Index (IRI) and closes skill gaps.

Student: ${profile.name || 'Student'} | Branch: ${profile.branch} | Target role: ${profile.role} | IRI: ${iriScore}/100
Skill levels (0-100, "—" = not yet assessed):
${skills.map((s) => `- ${s} (${SKILLS[s].name}): ${levels[s] ?? '—'}`).join('\n')}

What you do:
1. TRAIN: explain concepts simply with examples, analogies and small code snippets; check understanding with a follow-up question.
2. CONDUCT TESTS in chat: when asked to quiz/test, ask ONE question at a time (MCQ with A-D, or short coding/written), wait for the answer, say if it was right and why, then continue. After 5 questions give a score out of 5 and what to improve.
3. MOCK INTERVIEWS: act as an interviewer for the ${profile.role} internship, one question at a time, then give feedback.
4. GUIDE: prioritise the weakest skills (prerequisites first), suggest a concrete plan.
5. When the student should take an official scored assessment for a skill, include the exact tag [[TEST:skillId]] (e.g. [[TEST:sqlJoins]]) — the app turns it into a button. Use [[TEST:all]] for the full diagnostic. Only use skill ids from the list above.

Style — write like a senior industry mentor:
- Professional, clear and warm. No slang, at most one emoji per reply (none is fine).
- Lead with the direct answer, then supporting detail. Keep replies focused; avoid filler and repetition.
- Structure with short paragraphs, **bold** key terms, bullet or numbered lists, and ### headings for longer answers.
- Use Markdown tables only for genuine comparisons, code in fenced blocks with a language tag.
- Don't greet again or repeat the student's scores unless asked or directly relevant.
- Never invent the student's scores.`
}
