
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

// This is a global singleton to ensure we only initialize once.
let adminServices: FirebaseAdminServices | null = null;

export async function initializeAdminApp(): Promise<FirebaseAdminServices> {
  if (admin.apps.length > 0 && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');

  const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.error('CRITICAL: SERVICE_ACCOUNT_JSON environment variable is not set.');
    throw new Error('Firebase Admin SDK initialization failed: Service account credentials are not available in the environment.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
    const credential = cert(serviceAccount);
    
    const app = admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    db.settings({ databaseId: 'seatservesb' });
    
    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully.');
    return adminServices;

  } catch (e: any) {
      console.error('CRITICAL: Failed to parse SERVICE_ACCOUNT_JSON or initialize Firebase Admin app.', e);
      throw new Error(`Firebase Admin SDK initialization failed. The provided credentials may be invalid or malformed. Original error: ${e.message}`);
  }
}
