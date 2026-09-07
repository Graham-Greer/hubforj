import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const projectId = 'demo-hubforj-recovery';
if (process.env.GCLOUD_PROJECT !== projectId || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18089' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:19099') {
  throw new Error('Integration tests require the dedicated loopback emulators and demo project.');
}
for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_ADMIN_PRIVATE_KEY', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY']) {
  if (process.env[key]) throw new Error(`Integration tests must not receive ${key}.`);
}
const app = initializeApp({ projectId });
const db = getFirestore(app);
export const getFirebaseAdminApp = () => app;
export const getFirebaseAdminDb = () => db;
export const getFirebaseAdminAuth = () => getAuth(app);
export const getFirebaseAdminStorage = () => { throw new Error('Storage is outside this test boundary.'); };
