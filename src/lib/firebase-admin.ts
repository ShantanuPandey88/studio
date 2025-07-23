
'use server';

import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cert, ServiceAccount } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

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

  let serviceAccount: ServiceAccount;
  const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

  if (serviceAccountString) {
    // Use service account from environment variable (for deployed environments)
    console.log('Initializing Firebase Admin with service account from environment variable.');
    serviceAccount = JSON.parse(serviceAccountString);
  } else {
    // Fallback for local development: use a local file
    console.log('Service account environment variable not found. Falling back to local service-account.json file.');
    try {
      const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
      const serviceAccountFileContent = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFileContent);
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            console.error('CRITICAL: service-account.json file not found in the project root. Please upload it.');
            throw new Error('Firebase Admin SDK initialization failed: Service account credentials are not available.');
        }
        console.error('CRITICAL: Failed to read or parse service-account.json file.', e);
        throw new Error('Firebase Admin SDK initialization failed due to invalid local service account credentials.');
    }
  }
    
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
}
