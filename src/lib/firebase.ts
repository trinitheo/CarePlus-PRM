import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import fileConfig from '../../firebase-applet-config.json';

// Support both environment variables and firebase-applet-config.json fallback
const envKeys = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID
};

const hasEnvConfig = !!envKeys.apiKey;

const firebaseConfig = hasEnvConfig ? {
  apiKey: envKeys.apiKey,
  authDomain: envKeys.authDomain,
  projectId: envKeys.projectId,
  storageBucket: envKeys.storageBucket,
  messagingSenderId: envKeys.messagingSenderId,
  appId: envKeys.appId,
  firestoreDatabaseId: envKeys.firestoreDatabaseId
} : fileConfig;

// THE SMOKING GUN TEST:
console.log("Firebase Config Check:", firebaseConfig);

// Initialize Firebase safely (prevents hot-reload crashes)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const dbId = (firebaseConfig as any).firestoreDatabaseId || undefined;

let firestoreInstance: ReturnType<typeof initializeFirestore>;
let authInstance: ReturnType<typeof getAuth>;

if (typeof window !== 'undefined') {
  const g = globalThis as any;
  if (!g.__firebase_db) {
    g.__firebase_db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, dbId);
    
    // Connect emulator only on the first initialization
    if (import.meta.env.VITE_USE_EMULATOR === 'true') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        connectFirestoreEmulator(g.__firebase_db, 'localhost', 8080);
        console.log('Firebase Firestore Emulator connected (Port: 8080)');
      }
    }
  }
  firestoreInstance = g.__firebase_db;

  if (!g.__firebase_auth) {
    g.__firebase_auth = getAuth(app);
    
    // Connect emulator only on the first initialization
    if (import.meta.env.VITE_USE_EMULATOR === 'true') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        connectAuthEmulator(g.__firebase_auth, 'http://localhost:9099');
        console.log('Firebase Auth Emulator connected (Port: 9099)');
      }
    }
  }
  authInstance = g.__firebase_auth;
} else {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, dbId);
  authInstance = getAuth(app);
}

export const db = firestoreInstance;
export const auth = authInstance;

// Warnings for emulator requests in production cloud environments
if (typeof window !== 'undefined' && import.meta.env.VITE_USE_EMULATOR === 'true') {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.warn('Firebase Emulator requested but window.location is not localhost. Falling back to production Firebase to avoid network failure in cloud environment.');
  }
}
