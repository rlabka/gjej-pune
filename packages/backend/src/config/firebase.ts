import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Full service account JSON (e.g. in production)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (projectId) {
    // Minimal init – sufficient for ID-token verification in dev
    admin.initializeApp({ projectId });
  } else {
    console.warn('[Firebase] No FIREBASE_PROJECT_ID set – Google auth will not work');
    admin.initializeApp();
  }
}

export const firebaseAdmin = admin;
