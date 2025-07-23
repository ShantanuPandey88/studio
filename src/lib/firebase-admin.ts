
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cert, ServiceAccount } from 'firebase-admin/app';

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  db: Firestore;
}

// This is a global singleton to ensure we only initialize once.
let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes the Firebase Admin SDK using a singleton pattern.
 * It relies on the SERVICE_ACCOUNT_JSON environment variable.
 */
export function initializeAdminApp(): FirebaseAdminServices {
  // If the singleton is already initialized, return it.
  if (adminServices) {
    return adminServices;
  }

  // If there are already initialized apps, use the first one.
  // This handles hot-reloading in development.
  if (admin.apps.length > 0) {
    const app = admin.apps[0]!;
    const auth = admin.auth(app);
    const db = admin.firestore(app);
    db.settings({ databaseId: 'seatservesb' });
    adminServices = { app, auth, db };
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');
  const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.error('CRITICAL: SERVICE_ACCOUNT_JSON environment variable is not set. Admin SDK cannot be initialized.');
    throw new Error('Service account credentials are not available. Check your App Hosting backend configuration and secrets.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;

    const app = admin.initializeApp({
      credential: cert(serviceAccount),
    });

    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // This setting is crucial for connecting to your named database.
    db.settings({ databaseId: 'seatservesb' });

    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully.');
    return adminServices;

  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed. The SERVICE_ACCOUNT_JSON might be malformed.', error);
    throw new Error('Could not initialize Firebase Admin SDK due to an error with credentials.');
  }
}
