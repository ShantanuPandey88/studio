
'use server';

import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { ServiceAccount, cert } from 'firebase-admin/app';

let app: App;

if (!admin.apps.length) {
  try {
    if (process.env.NODE_ENV === 'production') {
      // In production (App Hosting), use Application Default Credentials.
      // The GOOGLE_APPLICATION_CREDENTIALS environment variable is automatically set.
      console.log('Initializing Firebase Admin SDK for production...');
      app = admin.initializeApp();
    } else {
      // In local development, use the service account key file.
      console.log('Initializing Firebase Admin SDK for local development...');
      const serviceAccount = require('../../service-account.json');
      app = admin.initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
        projectId: 'seatserve-575q9', // Make sure this matches your project ID
      });
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(
        'service-account.json not found. Falling back to default credentials. This is expected in a deployed environment.'
      );
      // Fallback for environments that behave like production but aren't explicitly set.
      app = admin.initializeApp();
    } else {
      console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
      // To prevent the app from crashing entirely, we do not rethrow,
      // but server-dependent functions will fail.
    }
  }
} else {
  // Use the already-initialized app.
  app = admin.app();
}

const auth: Auth = admin.auth(app);
const db: Firestore = admin.firestore(app);

// Explicitly set the database for the Firestore instance.
// This is crucial for using a non-default database.
db.settings({ databaseId: 'seatservesb' });

export { app, auth, db };
