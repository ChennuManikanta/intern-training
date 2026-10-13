// Runs code in a remote sandbox (Wandbox via the /api/run proxy in vite.config.js).
export const LANGS = {
  python: { label: 'Python', compiler: 'cpython-3.13.8', ext: 'py', starter: '# Read input with input(), print output with print()\nname = input()\nprint(f"Hello, {name}!")\n' },
  c: { label: 'C', compiler: 'gcc-13.2.0-c', ext: 'c', starter: '#include <stdio.h>\n\nint main(void) {\n    char name[100];\n    scanf("%99s", name);\n    printf("Hello, %s!\\n", name);\n    return 0;\n}\n' },
  cpp: { label: 'C++', compiler: 'gcc-13.2.0', ext: 'cpp', starter: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cin >> name;\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}\n' },
  java: { label: 'Java', compiler: 'openjdk-jdk-22+36', ext: 'java', starter: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.next();\n        System.out.println("Hello, " + name + "!");\n    }\n}\n' },
  javascript: { label: 'JavaScript', compiler: 'nodejs-20.17.0', ext: 'js', starter: '// Read all of stdin\nconst input = require("fs").readFileSync(0, "utf8").trim();\nconsole.log(`Hello, ${input}!`);\n' },
}

// Skill → language used for its coding tasks. Skills not listed here are tested with MCQs only.
export const SKILL_LANG = { python: 'python', dsa: 'python', oop: 'python', cProg: 'c', microcontrollers: 'c', javascript: 'javascript' }

const post = async (body) => {
  const r = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
  if (!r.ok) throw new Error(`Code runner unavailable (${r.status}). Try again in a moment.`)
  return r.json()
}
// The sandbox occasionally fails to start a container (exit 126/127, "failed to exec").
const sandboxGlitch = (d) => ['126', '127'].includes(String(d.status)) && /exec|catatonit/i.test(d.program_message || d.program_error || '')

export async function runCode(lang, code, stdin = '') {
  const t0 = performance.now()
  // Wandbox saves Java as prog.java, so a *public* class named Main won't compile.
  const src = lang === 'java' ? code.replace(/public\s+(final\s+)?class\s+/g, '$1class ') : code
  const body = JSON.stringify({ code: src, compiler: LANGS[lang].compiler, stdin })
  let d = await post(body)
  if (sandboxGlitch(d)) d = await post(body)
  if (sandboxGlitch(d)) throw new Error('The code sandbox is busy. Please run again.')
  const compileError = d.compiler_error || ''
  return {
    stdout: d.program_output || '',
    stderr: d.program_error || '',
    compileError,
    exitCode: Number(d.status ?? 0),
    signal: d.signal || '',
    ok: !compileError.match(/error/i) && Number(d.status ?? 0) === 0 && !d.signal,
    ms: Math.round(performance.now() - t0),
  }
}

// Plain-text summary for graders and the AI debugger.
export const runSummary = (r) => !r ? 'Not run.' : [
  r.compileError && `Compiler output:\n${r.compileError}`,
  `Program output:\n${r.stdout || '(empty)'}`,
  r.stderr && `Runtime errors:\n${r.stderr}`,
  `Exit code: ${r.exitCode}${r.signal ? ` (${r.signal})` : ''}`,
].filter(Boolean).join('\n\n')
