
'use server';

import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { cert, ServiceAccount } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

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

  try {
    let credential;
    const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

    if (serviceAccountString) {
      console.log('Initializing with service account from environment variable.');
      const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
      credential = cert(serviceAccount);
    } else {
      console.log('Service account environment variable not found. Falling back to local service-account.json file.');
      const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error("Local service account file not found at project root.");
      }

      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent) as ServiceAccount;
      credential = cert(serviceAccount);
    }
    
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
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.', e);
    throw new Error('Firebase Admin SDK initialization failed due to invalid service account credentials.');
  }
}
