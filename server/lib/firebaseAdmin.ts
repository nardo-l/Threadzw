import { initializeApp, getApps, getApp, cert, applicationDefault, App } from 'firebase-admin/app';

let adminApp: App | null = null;

export function getFirebaseAdmin(): App {
  if (!adminApp) {
    const existingApps = getApps();
    if (existingApps.length > 0 && existingApps[0]) {
      adminApp = existingApps[0];
      return adminApp;
    }

    const serviceAccountVar = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'threadzw-e8607';

    if (serviceAccountVar) {
      try {
        const serviceAccount = typeof serviceAccountVar === 'string' && serviceAccountVar.startsWith('{')
          ? JSON.parse(serviceAccountVar)
          : serviceAccountVar;

        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId
        });
      } catch (err) {
        console.warn('Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT JSON, falling back to default credentials:', err);
        adminApp = initializeApp({
          credential: applicationDefault(),
          projectId
        });
      }
    } else {
      adminApp = initializeApp({
        projectId
      });
    }
  }

  return adminApp;
}
