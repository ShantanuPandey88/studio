
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

export function initializeAdminApp(): FirebaseAdminServices {
  // If the app is already initialized, return the existing services.
  if (admin.apps.length && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');
  
  // The SERVICE_ACCOUNT_JSON environment variable is the single source of truth for credentials.
  const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    console.error('CRITICAL: SERVICE_ACCOUNT_JSON environment variable not set.');
    throw new Error('Firebase Admin SDK initialization failed: Service account credentials are not available.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
    
    // Initialize the app with the provided service account.
    const app = admin.initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // Set the database ID for all Firestore operations.
    db.settings({ databaseId: 'seatservesb' });
    
    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully.');
    return adminServices;

  } catch (e: any) {
    console.error('CRITICAL: Failed to parse SERVICE_ACCOUNT_JSON or initialize Firebase Admin SDK.', e);
    throw new Error('Firebase Admin SDK initialization failed due to invalid service account credentials.');
  }
}
