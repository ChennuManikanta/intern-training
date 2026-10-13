// Mapped content: every skill belongs to roles; every question/note/video is tagged with a skill id.
// Branch → internship roles that fit it (first = most common). Unknown/typed branches see every role.
export const BRANCHES = {
  'AI & Data Science': { icon: 'brain', color: '#8b5cf6', roles: ['Data Analyst', 'Data Scientist', 'ML Engineer', 'Software Developer', 'Backend Developer', 'Web Developer'] },
  'CSE':               { icon: 'code', color: '#3b82f6', roles: ['Software Developer', 'Web Developer', 'Backend Developer', 'Data Analyst', 'ML Engineer', 'Data Scientist'] },
  'IT':                { icon: 'server', color: '#06b6d4', roles: ['Web Developer', 'Software Developer', 'Backend Developer', 'Data Analyst', 'Data Scientist'] },
  'ECE':               { icon: 'radio', color: '#f59e0b', roles: ['Embedded Engineer', 'Software Developer', 'Data Analyst', 'Web Developer', 'ML Engineer'] },
  'EEE':               { icon: 'zap', color: '#eab308', roles: ['Embedded Engineer', 'Data Analyst', 'Software Developer', 'Web Developer'] },
  'Mechanical':        { icon: 'cog', color: '#ef4444', roles: ['Design Engineer', 'Data Analyst', 'Software Developer'] },
  'Civil':             { icon: 'building', color: '#10b981', roles: ['Design Engineer', 'Data Analyst'] },
}
export const rolesFor = (branch) => BRANCHES[branch]?.roles || Object.keys(ROLES)

// name, prerequisites (skill graph edges), topic hint for AI + video search
export const SKILLS = {
  aptitude:      { name: 'Aptitude & Reasoning', pre: [], topic: 'quantitative aptitude, logical reasoning, data interpretation' },
  communication: { name: 'Communication', pre: [], topic: 'professional communication, explaining technical ideas, workplace emails' },
  python:        { name: 'Python Basics', pre: [], topic: 'Python syntax, data types, loops, functions, lists, dicts' },
  pandas:        { name: 'Pandas & NumPy', pre: ['python'], topic: 'pandas DataFrames, groupby, merge, NumPy arrays' },
  sqlBasics:     { name: 'SQL Basics', pre: [], topic: 'SELECT, WHERE, ORDER BY, GROUP BY, aggregate functions' },
  sqlJoins:      { name: 'SQL Joins & Subqueries', pre: ['sqlBasics'], topic: 'INNER/LEFT/RIGHT/FULL joins, subqueries, CTEs, window functions' },
  statistics:    { name: 'Statistics', pre: [], topic: 'mean, median, variance, distributions, hypothesis testing, correlation' },
  excel:         { name: 'Excel', pre: [], topic: 'Excel formulas, VLOOKUP/XLOOKUP, pivot tables, conditional formatting' },
  dataViz:       { name: 'Data Visualization', pre: ['pandas'], topic: 'chart selection, matplotlib, Power BI/Tableau dashboards, storytelling' },
  ml:            { name: 'Machine Learning', pre: ['pandas', 'statistics'], topic: 'regression, classification, overfitting, train/test split, scikit-learn' },
  deepLearning:  { name: 'Deep Learning', pre: ['ml'], topic: 'neural networks, backpropagation, CNNs, transformers, PyTorch' },
  dsa:           { name: 'Data Structures & Algorithms', pre: ['python'], topic: 'arrays, linked lists, stacks, trees, sorting, Big-O, recursion' },
  oop:           { name: 'OOP', pre: ['python'], topic: 'classes, inheritance, polymorphism, encapsulation, SOLID' },
  dbms:          { name: 'DBMS', pre: ['sqlBasics'], topic: 'normalization, indexing, transactions, ACID, ER diagrams' },
  git:           { name: 'Git & Version Control', pre: [], topic: 'git commit, branch, merge, pull requests, resolving conflicts' },
  html:          { name: 'HTML & CSS', pre: [], topic: 'semantic HTML, flexbox, grid, responsive design' },
  javascript:    { name: 'JavaScript', pre: ['html'], topic: 'ES6+, DOM, promises, async/await, closures' },
  react:         { name: 'React', pre: ['javascript'], topic: 'components, props, state, hooks, effects' },
  apis:          { name: 'REST APIs & Backend', pre: ['javascript'], topic: 'HTTP methods, REST design, Node/Express, auth, status codes' },
  cProg:         { name: 'C Programming', pre: [], topic: 'pointers, memory, structs, arrays, bit manipulation in C' },
  digital:       { name: 'Digital Electronics', pre: [], topic: 'logic gates, flip-flops, counters, K-maps, combinational circuits' },
  microcontrollers: { name: 'Microcontrollers', pre: ['cProg', 'digital'], topic: 'GPIO, timers, interrupts, UART/I2C/SPI, Arduino/STM32' },
  circuits:      { name: 'Circuit Analysis', pre: [], topic: 'KVL, KCL, Thevenin, op-amps, AC analysis' },
  cad:           { name: 'CAD & Design', pre: [], topic: 'AutoCAD, SolidWorks, engineering drawing, GD&T' },
  mechanics:     { name: 'Engineering Mechanics', pre: [], topic: 'statics, strength of materials, thermodynamics basics' },
}

// weight = importance for the role (drives IRI and roadmap priority)
export const ROLES = {
  'Data Analyst':        { icon: 'bars', color: '#6366f1', desc: 'Turn raw data into insights with SQL, Python & dashboards', skills: { aptitude: 1, communication: 1, python: 2, pandas: 2, sqlBasics: 2, sqlJoins: 3, statistics: 2, excel: 1, dataViz: 2 } },
  'Data Scientist':      { icon: 'flask', color: '#a855f7', desc: 'Build statistical & ML models that answer business questions', skills: { aptitude: 1, communication: 1, python: 2, pandas: 2, sqlBasics: 1, sqlJoins: 1, statistics: 3, ml: 3, dataViz: 1 } },
  'ML Engineer':         { icon: 'cpu', color: '#ec4899', desc: 'Train, tune and ship machine-learning & deep-learning models', skills: { aptitude: 1, communication: 1, python: 2, pandas: 2, statistics: 2, ml: 3, deepLearning: 3, dsa: 1, git: 1 } },
  'Software Developer':  { icon: 'code', color: '#3b82f6', desc: 'Write clean, efficient code and solve algorithmic problems', skills: { aptitude: 2, communication: 1, python: 2, dsa: 3, oop: 2, dbms: 1, sqlBasics: 1, git: 1 } },
  'Web Developer':       { icon: 'globe', color: '#06b6d4', desc: 'Build responsive websites and apps with modern JavaScript', skills: { aptitude: 1, communication: 1, html: 2, javascript: 3, react: 3, apis: 2, git: 1, sqlBasics: 1 } },
  'Backend Developer':   { icon: 'database', color: '#14b8a6', desc: 'Design APIs, databases and server-side logic', skills: { aptitude: 1, communication: 1, javascript: 2, apis: 3, sqlBasics: 2, sqlJoins: 1, dbms: 2, dsa: 1, git: 1 } },
  'Embedded Engineer':   { icon: 'plug', color: '#f59e0b', desc: 'Program microcontrollers and hardware-level systems in C', skills: { aptitude: 1, communication: 1, cProg: 3, digital: 2, microcontrollers: 3, circuits: 2, git: 1 } },
  'Design Engineer':     { icon: 'cog', color: '#ef4444', desc: 'Model and analyse mechanical / structural designs in CAD', skills: { aptitude: 2, communication: 1, cad: 3, mechanics: 3, excel: 1 } },
}

export const READY = 70 // skill level considered "ready"

export const roleSkills = (role) => Object.keys(ROLES[role]?.skills || {})

// Latest demonstrated level per skill, from newest attempt that tested it.
export function skillLevels(attempts) {
  const lv = {}
  for (const a of [...attempts].sort((x, y) => x.date - y.date)) Object.assign(lv, a.skillScores)
  return lv
}

// IRI = weighted mean of skill levels; a skill counts as 0 until assessed.
export function iri(role, levels) {
  const w = ROLES[role]?.skills || {}
  let sum = 0, tot = 0
  for (const [s, wt] of Object.entries(w)) { sum += (levels[s] ?? 0) * wt; tot += wt }
  return tot ? Math.round(sum / tot) : 0
}

export const band = (v) =>
  v >= 75 ? { label: 'Internship Ready', tone: 'good' } :
  v >= 50 ? { label: 'Almost There', tone: 'mid' } :
  v > 0   ? { label: 'Building Foundations', tone: 'low' } :
            { label: 'Not Assessed', tone: 'none' }

// Depth in the prerequisite graph (restricted to the role's skills) — used for layout and ordering.
export function depth(skill, set, memo = {}) {
  if (memo[skill] != null) return memo[skill]
  const pres = SKILLS[skill].pre.filter((p) => set.includes(p))
  return (memo[skill] = pres.length ? 1 + Math.max(...pres.map((p) => depth(p, set, memo))) : 0)
}

// Roadmap: gaps first, prerequisites before dependents, then by (weight × gap).
export function roadmap(role, levels) {
  const set = roleSkills(role), w = ROLES[role].skills, memo = {}
  return set
    .map((s) => ({ id: s, ...SKILLS[s], level: levels[s] ?? null, weight: w[s], depth: depth(s, set, memo) }))
    .filter((s) => (s.level ?? 0) < READY)
    .map((s) => ({ ...s, blocked: s.pre.some((p) => set.includes(p) && (levels[p] ?? 0) < READY) }))
    .sort((a, b) => a.blocked - b.blocked || a.depth - b.depth || b.weight * (100 - (b.level ?? 0)) - a.weight * (100 - (a.level ?? 0)))
}

export const videoSearch = (skill) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(SKILLS[skill].name + ' tutorial for beginners')}`
