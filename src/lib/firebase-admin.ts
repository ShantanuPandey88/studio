
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cert, type ServiceAccount } from 'firebase-admin/app';

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  db: Firestore;
}

// This is a global singleton to ensure we only initialize once.
let adminServices: FirebaseAdminServices | null = null;

export function initializeAdminApp(): FirebaseAdminServices {
  // If the app is already initialized, return the existing services.
  if (admin.apps.length && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');
  
  try {
    const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

    if (!serviceAccountString) {
        throw new Error('CRITICAL: SERVICE_ACCOUNT_JSON environment variable is not set. The application cannot start.');
    }

    const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
    const credential = cert(serviceAccount);
    
    // Initialize the app with the provided service account.
    const app = admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // Set the database ID for all Firestore operations.
    db.settings({ databaseId: 'seatservesb' });
    
    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully via environment variable.');
    return adminServices;

  } catch (e: any) {
    console.error('CRITICAL: Failed to parse credentials or initialize Firebase Admin SDK.', e);
    throw new Error('Firebase Admin SDK initialization failed due to invalid or missing service account credentials.');
  }
}
