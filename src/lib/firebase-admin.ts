
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

// This is a global singleton to ensure we only initialize once.
let adminServices: FirebaseAdminServices | null = null;

export async function initializeAdminApp(): Promise<FirebaseAdminServices> {
  if (admin.apps.length > 0 && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');

  let credential;
  const serviceAccountString = process.env.SERVICE_ACCOUNT_JSON;

  if (serviceAccountString) {
      try {
          console.log('Attempting to initialize with service account from environment variable.');
          const serviceAccount = JSON.parse(serviceAccountString) as ServiceAccount;
          credential = cert(serviceAccount);
      } catch(e: any) {
          console.error('CRITICAL: Failed to parse SERVICE_ACCOUNT_JSON from environment variable.', e.message);
          throw new Error('Firebase Admin SDK initialization failed: The provided SERVICE_ACCOUNT_JSON is not valid JSON.');
      }
  } else {
      console.log('SERVICE_ACCOUNT_JSON env var not found. Falling back to local service-account.json file.');
      try {
          const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
          if (!fs.existsSync(serviceAccountPath)) {
               throw new Error(`Local service-account.json file not found at path: ${serviceAccountPath}`);
          }
          const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf-8');
          const serviceAccount = JSON.parse(serviceAccountFile) as ServiceAccount;
          credential = cert(serviceAccount);
      } catch (e: any) {
           console.error('CRITICAL: Failed to initialize from local service-account.json file.', e.message);
           throw new Error(`Firebase Admin SDK initialization failed due to an error with the local service account file: ${e.message}`);
      }
  }

  try {
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
      console.error('CRITICAL: Failed to initialize Firebase Admin app with the provided credentials.', e);
      throw new Error(`Firebase Admin SDK initialization failed. The credentials may be invalid. Original error: ${e.message}`);
  }
}
