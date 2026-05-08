import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth();

// Emulator support for development
// Only connects if VITE_USE_EMULATOR is true AND we are running on localhost
// This prevents network failures in the cloud environment where the emulator cannot run (no Java)
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Firebase Emulators connected (Firestore: 8080, Auth: 9099)');
  } else {
    console.warn('Firebase Emulator requested but window.location is not localhost. Falling back to production Firebase to avoid network failure in cloud environment.');
  }
}
