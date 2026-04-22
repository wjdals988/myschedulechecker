import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Firebase 환경변수가 없습니다: ${missing.join(", ")}. .env.local을 설정해 주세요.`,
    );
  }
}

export function getFirebaseApp() {
  if (app) return app;

  assertFirebaseConfig();
  app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }

  return authInstance;
}

export function getDb() {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp());
  }

  return firestoreInstance;
}

export function ensureAnonymousAuth() {
  return new Promise<string>((resolve, reject) => {
    const auth = getFirebaseAuth();
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (user) {
        resolve(user.uid);
        return;
      }

      try {
        const result = await signInAnonymously(auth);
        resolve(result.user.uid);
      } catch (error) {
        reject(error);
      }
    });
  });
}
