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
  // If the app is already initialized, return the existing services.
  if (admin.apps.length && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');
  
  try {
    let credential;
    const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

    if (serviceAccountString) {
      // Use service account from environment variable (for deployed environments)
      console.log('Initializing with service account from environment variable.');
      const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
      credential = cert(serviceAccount);
    } else {
      // Fallback for local development: use a local file
      console.log('Service account environment variable not found. Falling back to local service-account.json file.');
      const serviceAccount = require('../../../service-account.json');
      credential = cert(serviceAccount);
    }
    
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
    console.log('Firebase Admin SDK initialized successfully.');
    return adminServices;

  } catch (e: any) {
    if (e.code === 'MODULE_NOT_FOUND' || e.code === 'ENOENT') {
         console.error('CRITICAL: Failed to find service account. Please ensure SERVICE_ACCOUNT_JSON env var is set or service-account.json file exists in the root.');
         throw new Error('Firebase Admin SDK initialization failed: Service account credentials are not available.');
    }
    console.error('CRITICAL: Failed to parse credentials or initialize Firebase Admin SDK.', e);
    throw new Error('Firebase Admin SDK initialization failed due to invalid service account credentials.');
  }
}
