import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCB_n3m7nFaLhmnV8zV6vLp82Pj3W5WI_0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "threadzw-e8607.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "threadzw-e8607",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "threadzw-e8607.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "571676701681",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:571676701681:web:9b77e9f93501c1ae790a50",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5FD9W0HDVT"
};

// Initialize Firebase app safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics conditionally (only in browser environments where supported)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn('Firebase Analytics not supported in this environment:', err);
  });
}
