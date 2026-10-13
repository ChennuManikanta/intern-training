// Run: node src/check.test.js
import assert from 'node:assert'
import { iri, skillLevels, roadmap } from './data.js'

const lv = skillLevels([
  { date: 1, skillScores: { python: 40, sqlJoins: 20 } },
  { date: 2, skillScores: { python: 90 } },
])
assert.equal(lv.python, 90)
assert.equal(lv.sqlJoins, 20)
assert.ok(iri('Data Analyst', lv) > 0 && iri('Data Analyst', lv) < 100)
assert.equal(iri('Data Analyst', {}), 0)

const r = roadmap('Data Analyst', { python: 90, sqlBasics: 30, sqlJoins: 20 })
assert.ok(!r.find((s) => s.id === 'python'))
assert.ok(r.findIndex((s) => s.id === 'sqlBasics') < r.findIndex((s) => s.id === 'sqlJoins'))
console.log('ok')
