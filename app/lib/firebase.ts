import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// getAuth()/getFirestore() throw immediately on an invalid/missing api key,
// and that runs at module-eval time (including during build-time static
// prerendering). Only touch the SDK once real config is present — every
// call site elsewhere checks `firebaseConfigured` before using these.
let auth: Auth;
let db: Firestore;

if (firebaseConfigured) {
  // initializeFirestore() may only be called once per app instance — on Fast
  // Refresh the module can re-run against an app that's already configured,
  // so only the first pass sets transport options; later passes just attach.
  const isNewApp = !getApps().length;
  const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = isNewApp
    ? // Forces Firestore's real-time listener onto long-polling instead of the
      // fetch-streams transport, which otherwise throws an unhandled
      // "AbortError: The user aborted a request" when a listener detaches
      // (e.g. client-side navigation) mid-stream.
      initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
    : getFirestore(app);
} else {
  auth = undefined as unknown as Auth;
  db = undefined as unknown as Firestore;
}

export { auth, db };
