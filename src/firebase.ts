import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfig = [
  ["VITE_FIREBASE_API_KEY", config.apiKey],
  ["VITE_FIREBASE_AUTH_DOMAIN", config.authDomain],
  ["VITE_FIREBASE_PROJECT_ID", config.projectId],
  ["VITE_FIREBASE_STORAGE_BUCKET", config.storageBucket],
  ["VITE_FIREBASE_MESSAGING_SENDER_ID", config.messagingSenderId],
  ["VITE_FIREBASE_APP_ID", config.appId],
] as const;

export const missingFirebaseVariables = requiredConfig
  .filter(([, value]) => !value?.trim())
  .map(([name]) => name);
export const firebaseConfigured = missingFirebaseVariables.length === 0;

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
export let firebaseInitializationError: string | null = null;

if (firebaseConfigured) {
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    const reason =
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
        ? error.code
        : error instanceof Error
          ? error.name
          : "unknown error";
    app = null;
    auth = null;
    db = null;
    firebaseInitializationError = `Firebase initialization failed (${reason}). Verify the web app configuration and restart Vite.`;
  }
}

export { app, auth, db };
