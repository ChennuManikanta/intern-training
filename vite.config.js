import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// GROQ_API_KEY has no VITE_ prefix, so it never reaches the browser bundle.
// The browser calls /api/groq/* and the dev/preview server adds the key.
// ponytail: proxy lives in Vite; for Firebase Hosting deploy, move it to a Cloud Function.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = {
    '/api/groq': {
      target: 'https://api.groq.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api\/groq/, '/openai/v1'),
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
    },
    // Code execution sandbox (C, C++, Java, Python, JavaScript) — free Wandbox API, no key needed.
    '/api/run': {
      target: 'https://wandbox.org',
      changeOrigin: true,
      rewrite: () => '/api/compile.json',
      headers: { 'User-Agent': 'BriVox/1.0' },
    },
  }
  return { plugins: [react()], server: { proxy }, preview: { proxy } }
})
