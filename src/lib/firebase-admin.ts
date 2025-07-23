
'use server';

import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  db: Firestore;
}

let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes the Firebase Admin SDK using Application Default Credentials.
 * This function should only be called in a server-side environment.
 * It ensures the SDK is initialized only once (singleton pattern).
 * On Firebase App Hosting or other Google Cloud environments, the SDK
 * automatically finds the necessary credentials.
 */
export async function initializeAdminApp(): Promise<FirebaseAdminServices> {
  if (admin.apps.length > 0 && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');

  try {
    const app = admin.initializeApp();
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // This setting is crucial for connecting to your named database.
    db.settings({ databaseId: 'seatservesb' });

    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully.');
    return adminServices;

  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
    // This error will be thrown and should be caught by the calling function.
    throw new Error('Could not initialize Firebase Admin SDK. The server environment may not be set up correctly.');
  }
}
