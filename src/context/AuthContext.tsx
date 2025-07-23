
"use client";

import * as React from "react";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    updatePassword,
    confirmPasswordReset,
    type User as FirebaseUser,
    type Auth
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp, type User } from "@/lib/firebase";
import { getUserFromFirestore } from "@/lib/firestore-adapter";
import { signupUser, sendPasswordResetLink } from "@/lib/actions";
import { useRouter } from "next/navigation";

type Claims = { admin?: boolean } | null;

// Initialize Firebase services ONCE and outside the component render cycle.
const app = getFirebaseApp();
const auth = getAuth(app);
// Ensure the client-side Firestore instance also points to the non-default database.
const db = getFirestore(app, 'seatservesb');

interface AuthContextType {
  user: User | null;
  claims: Claims;
  isLoading: boolean;
  db: Firestore;
  auth: Auth;
  login: (email: string, password: string) => Promise<{ claims: Claims }>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: { displayName?: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<void>;
}


const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
    children,
}: { 
    children: React.ReactNode, 
}) {
  const [user, setUser] = React.useState<User | null>(null);
  const [claims, setClaims] = React.useState<Claims | null>(null);
  const [isLoading, setIsLoading] = React.useState(true); 
  const [isInitialising, setIsInitialising] = React.useState(true);
  const router = useRouter();


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        // Force refresh the token to get the latest custom claims upon login.
        const idTokenResult = await firebaseUser.getIdTokenResult(true);
        const userClaims = idTokenResult.claims as { admin?: boolean };
        setClaims(userClaims);

        const userDoc = await getUserFromFirestore(db, firebaseUser.uid);
        
        if (userDoc) {
             const appUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName!,
                role: userDoc?.role || 'user',
                disabled: userDoc?.disabled || false,
                team: userDoc?.team || "",
            };

            if (appUser.disabled) {
                await signOut(auth);
                setUser(null);
                setClaims(null);
            } else {
                setUser(appUser);
            }
        } else {
            const tempUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName!,
                role: 'user', 
                disabled: false,
                team: '',
            };
            setUser(tempUser);
        }

      } else {
        setUser(null);
        setClaims(null);
      }
      setIsLoading(false);
      if (isInitialising) {
          setIsInitialising(false);
      }
    });

    return () => unsubscribe();
  }, [isInitialising]); 

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Force a token refresh to get the latest custom claims.
    const idTokenResult = await userCredential.user.getIdTokenResult(true);
    const userClaims = idTokenResult.claims as { admin?: boolean };
    return { claims: userClaims };
  };
  
  const signup = async (email: string, password: string, displayName: string) => {
    await signupUser({ email, password, displayName });
    // After signup, the onAuthStateChanged listener will automatically handle the new user state.
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const changePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    await updatePassword(auth.currentUser, newPassword);
  }

  const updateProfile = async (updates: { displayName?: string }) => {
     if (!auth.currentUser) throw new Error("Not authenticated");
     throw new Error("Profile updates should be handled by an admin.");
  }

  const forgotPassword = async (email: string) => {
      return await sendPasswordResetLink({ email });
  }

  const resetPassword = async (oobCode: string, newPassword: string) => {
    await confirmPasswordReset(auth, oobCode, newPassword);
  }

  const value = {
    user,
    claims,
    isLoading,
    db, 
    auth, 
    login,
    signup,
    logout,
    changePassword,
    updateProfile,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{!isInitialising && children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
