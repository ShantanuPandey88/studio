
'use server';

import * as admin from 'firebase-admin';
import { App, cert } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { getConfig } from 'next/config';

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  db: Firestore;
}

let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes the Firebase Admin SDK using a service account from an
 * environment variable. This ensures a single, explicit authentication method.
 * It ensures the SDK is initialized only once (singleton pattern).
 */
export async function initializeAdminApp(): Promise<FirebaseAdminServices> {
  if (admin.apps.length > 0 && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');

  try {
    // Get server-side environment variables from next.config.js
    const { serverRuntimeConfig } = getConfig();
    const serviceAccountString = serverRuntimeConfig.SERVICE_ACCOUNT_JSON;

    if (!serviceAccountString) {
      throw new Error('SERVICE_ACCOUNT_JSON environment variable is not set. Check next.config.ts and apphosting.yaml.');
    }
    
    // Parse the service account key from the environment variable.
    const serviceAccount = JSON.parse(serviceAccountString);

    const app = admin.initializeApp({
        credential: cert(serviceAccount)
    });
    
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // This setting is crucial for connecting to your named database.
    db.settings({ databaseId: 'seatservesb' });

    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully via environment variable.');
    return adminServices;

  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
    // This error will be thrown and should be caught by the calling function.
    throw new Error('Could not initialize Firebase Admin SDK. The server environment may not be set up correctly.');
  }
}
