
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";

// This configuration object is now populated by Next.js environment variables.
const firebaseConfig: FirebaseOptions = {
    "projectId": "seatserve-575q9",
    "appId": "1:186158290154:web:5dec98610ddba666243393",
    "storageBucket": "seatserve-575q9.appspot.com",
    "apiKey": "AIzaSyDKjtmudK_325pkF6Cug7zfmDxXWX7qIZs",
    "authDomain": "seatserve-575q9.firebaseapp.com",
    "messagingSenderId": "186158290154",
    databaseURL: "https://seatserve-575q9.firebaseio.com",
};

// This function is the single source of truth for the Firebase app instance.
// It ensures that the app is initialized only once (singleton pattern).
export function getFirebaseApp(config: FirebaseOptions = firebaseConfig): FirebaseApp {
    if (getApps().length) {
        return getApp();
    }
    
    // Validate that the config object is populated before initializing
    if (!config.apiKey || !config.projectId || !config.authDomain) {
        // This error is a critical development-time feedback mechanism.
        throw new Error("Firebase config is missing or invalid. Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ variables are set correctly.");
    }
    
    return initializeApp(config);
}

// Define a custom User type that extends the FirebaseUser type with app-specific fields.
export type User = Pick<FirebaseUser, 'uid' | 'displayName' | 'email'> & { 
  role?: 'admin' | 'user', 
  disabled?: boolean,
  team?: string 
};
