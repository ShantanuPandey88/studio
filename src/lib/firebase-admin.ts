
'use server';

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

// This function initializes the Firebase Admin SDK.
// It is designed to be called wherever admin services are needed.
// The firebase-admin SDK handles singleton behavior internally, preventing re-initialization.
export async function initializeAdminApp(): Promise<FirebaseAdminServices> {
  // If the default app is already initialized, return its services.
  if (admin.apps.length > 0 && admin.apps[0]) {
    const app = admin.apps[0];
    const auth = admin.auth(app);
    const db = admin.firestore(app);
    return { app, auth, db };
  }

  const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.error('CRITICAL: SERVICE_ACCOUNT_JSON environment variable not set.');
    throw new Error('Firebase Admin SDK initialization failed: Service account credentials are not available in the environment.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
    
    console.log('Initializing Firebase Admin SDK...');
    const app = admin.initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // Set the database ID for all Firestore operations.
    db.settings({ databaseId: 'seatservesb' });
    
    console.log('Firebase Admin SDK initialized successfully.');
    return { app, auth, db };

  } catch (e: any) {
    console.error('CRITICAL: Failed to parse SERVICE_ACCOUNT_JSON or initialize Firebase Admin SDK.', e);
    throw new Error('Firebase Admin SDK initialization failed due to invalid service account credentials.');
  }
}
