# BriVox — Internship Readiness

Find out if you're ready for an internship, see your skill gaps, learn, and prove progress.

## Setup

1. `npm install`
2. Fill in `.env`:
   - `GROQ_API_KEY` — from https://console.groq.com/keys
   - `VITE_FIREBASE_*` — Firebase console → Project settings → Your apps → Web app
3. In the Firebase console:
   - **Authentication → Sign-in method:** enable *Email/Password* and *Google*
   - **Firestore Database:** create a database, then paste `firestore.rules` into the *Rules* tab and publish
4. `npm run dev` → http://localhost:5173

`npm run build && npm run preview` serves the production build (the Groq proxy works there too).

## How it works

| Piece | Where |
|---|---|
| Roles, skills, skill graph, IRI & roadmap logic | `src/data.js` (self-check: `node src/check.test.js`) |
| Groq calls (tests, grading, notes, mentor chat) | `src/ai.js` |
| Firebase Auth + Firestore | `src/firebase.js` |
| Pages | `src/pages/` |

The Groq key has no `VITE_` prefix, so it never reaches the browser — the Vite server proxies `/api/groq/*` and adds it.
To deploy to Firebase Hosting, move that proxy into a Cloud Function (needs the Blaze plan).
