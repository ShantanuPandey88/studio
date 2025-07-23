
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

let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes the Firebase Admin SDK using a singleton pattern.
 * It prioritizes reading from a local 'service-account.json' file.
 */
export function initializeAdminApp(): FirebaseAdminServices {
  if (admin.apps.length > 0 && adminServices) {
    return adminServices;
  }

  console.log('Initializing Firebase Admin SDK...');

  try {
    // Construct a path to the root of the project to find the service account file.
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

    if (!fs.existsSync(serviceAccountPath)) {
        console.error('CRITICAL: service-account.json not found at project root.');
        throw new Error('Service account file is missing. Please ensure service-account.json exists in the project root.');
    }
    
    console.log(`Loading service account from: ${serviceAccountPath}`);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;

    const app = admin.initializeApp({
      credential: cert(serviceAccount),
    });

    const auth = admin.auth(app);
    const db = admin.firestore(app);
    db.settings({ databaseId: 'seatservesb' });

    adminServices = { app, auth, db };
    console.log('Firebase Admin SDK initialized successfully using local file.');
    return adminServices;

  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
    throw new Error(`Could not initialize Firebase Admin SDK. Error: ${error.message}`);
  }
}
