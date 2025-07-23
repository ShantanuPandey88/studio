
'use server';

import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cert, ServiceAccount } from 'firebase-admin/app';
import getConfig from 'next/config';

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  db: Firestore;
}

// This is a global singleton to ensure we only initialize once.
let adminServices: FirebaseAdminServices | null = null;

export async function initializeAdminApp(): Promise<FirebaseAdminServices> {
  if (admin.apps.length && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');

  // Get the server runtime config from Next.js
  const { serverRuntimeConfig } = getConfig();
  const serviceAccountString = serverRuntimeConfig.SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
      // This fallback is for local development when `service-account.json` is used.
      console.log('Service account environment variable not found. Falling back to local service-account.json file.');
      try {
        const serviceAccount = require('../../../service-account.json');
        const app = admin.initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        const auth = admin.auth(app);
        const db = admin.firestore(app);
        db.settings({ databaseId: 'seatservesb' });
        adminServices = { app, auth, db };
        console.log('Firebase Admin SDK initialized successfully from local file.');
        return adminServices;
      } catch (e: any) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.error('CRITICAL: Failed to find service-account.json file in the root directory.');
            throw new Error('Firebase Admin SDK initialization failed: Local service account file not found.');
        }
         console.error('CRITICAL: Failed to initialize Firebase Admin SDK from local file.', e);
        throw new Error('Firebase Admin SDK initialization failed due to an error with the local service account file.');
      }
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
    
    const app = admin.initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    db.settings({ databaseId: 'seatservesb' });
    
    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully from environment variable.');
    return adminServices;

  } catch (e: any) {
    console.error('CRITICAL: Failed to parse credentials or initialize Firebase Admin SDK.', e);
    throw new Error('Firebase Admin SDK initialization failed due to invalid service account credentials.');
  }
}
