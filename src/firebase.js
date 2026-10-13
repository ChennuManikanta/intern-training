import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'

const e = import.meta.env
const app = initializeApp({
  apiKey: e.VITE_FIREBASE_API_KEY,
  authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: e.VITE_FIREBASE_PROJECT_ID,
  storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: e.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)
export const google = new GoogleAuthProvider()
const db = getFirestore(app)

// Data layout: users/{uid} = profile + chat; users/{uid}/attempts/{id} = assessment results
export const getProfile = async (uid) => (await getDoc(doc(db, 'users', uid))).data() || null
export const saveProfile = (uid, data) => setDoc(doc(db, 'users', uid), data, { merge: true })

export const addAttempt = (uid, a) => addDoc(collection(db, 'users', uid, 'attempts'), a)
export const listAttempts = async (uid) =>
  (await getDocs(query(collection(db, 'users', uid, 'attempts'), orderBy('date', 'desc'))))
    .docs.map((d) => ({ id: d.id, ...d.data() }))
