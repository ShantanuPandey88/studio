
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { cert, getApps } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { getConfig } from 'next/config';

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  db: Firestore;
}

// This is a global singleton to ensure we only initialize once.
let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes the Firebase Admin SDK using a service account from an
 * environment variable. This function uses a singleton pattern to ensure
 * that `initializeApp` is only called once.
 */
export function initializeAdminApp(): FirebaseAdminServices {
  if (adminServices) {
    return adminServices;
  }

  // Use the server-side runtime configuration from next.config.js
  const { serverRuntimeConfig } = getConfig();
  const serviceAccountString = serverRuntimeConfig.SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.error('CRITICAL: SERVICE_ACCOUNT_JSON is not available in serverRuntimeConfig. Check next.config.ts and apphosting.yaml.');
    throw new Error('Firebase Admin SDK service account credentials are not configured on the server.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);

    if (getApps().length === 0) {
      console.log('Initializing Firebase Admin SDK...');
      const app = admin.initializeApp({
        credential: cert(serviceAccount),
      });

      const auth = admin.auth(app);
      const db = admin.firestore(app);

      // This setting is crucial for connecting to your named database.
      db.settings({ databaseId: 'seatservesb' });

      adminServices = { app, auth, db };
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      // If the app is already initialized, just get the services.
      // This handles hot-reloading in development environments.
      const app = admin.app();
      const auth = admin.auth(app);
      const db = admin.firestore(app);
      adminServices = { app, auth, db };
    }

    return adminServices;
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
    throw new Error(`Could not initialize Firebase Admin SDK: ${error.message}`);
  }
}
