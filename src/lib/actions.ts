
'use server';

import { startOfDay } from "date-fns";
import type { User as AppUser } from "./firebase";
import type { Desk, Holiday } from "@/types";
import { initializeAdminApp } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendEmail } from "@/services/email";


/**
 * Checks if desks exist and if not, populates Firestore with desks
 * from 6.W.WS.019 to 6.W.WS.135.
 * This is a one-time setup function.
 */
export async function setupInitialDesks() {
  const { db } = initializeAdminApp();
  try {
    const desksCollectionRef = db.collection("desks");
    const existingDesksSnapshot = await desksCollectionRef.limit(1).get();

    if (!existingDesksSnapshot.empty) {
      console.log("Desks collection is not empty. Skipping initial setup.");
      return { success: true, message: "Desks already exist." };
    }

    console.log("Performing initial desk setup...");
    const batch = db.batch();
    const start = 19;
    const end = 135;

    for (let i = start; i <= end; i++) {
      const deskNumber = i.toString().padStart(3, '0');
      const deskId = `6.W.WS.${deskNumber}`;
      const deskRef = db.collection("desks").doc(deskId);
      batch.set(deskRef, {});
    }

    await batch.commit();
    console.log(`Successfully created ${end - start + 1} desks.`);
    return { success: true, message: `Successfully created ${end - start + 1} desks.` };
  } catch (error: any) {
    console.error("Error during initial desk setup:", error);
    if (error.code === 5) { // 5 is the gRPC code for NOT_FOUND
       return { success: false, message: "Firestore database not found. Please create a Firestore database in your Firebase project console before seeding." };
    }
    return { success: false, message: error.message || "Failed to create initial desks." };
  }
}

// Desk Actions
export async function addDesk(desk: Desk) {
    const { db } = initializeAdminApp();
    const deskRef = db.collection("desks").doc(desk.id);
    const deskSnap = await deskRef.get();
    if (deskSnap.exists) {
        throw new Error("This desk number already exists.");
    }
    await deskRef.set({});
}

export async function deleteDesk(deskId: string) {
    const { db } = initializeAdminApp();
    const bookingsCheck = await db.collection("bookings").where("deskId", "==", deskId).limit(1).get();
    if (!bookingsCheck.empty) {
        throw new Error("Cannot remove desk with active bookings.");
    }
    await db.collection("desks").doc(deskId).delete();
}

// Holiday Actions
export type AddHolidayPayload = { name: string, date: Date };
export async function addHoliday(holiday: AddHolidayPayload) {
    const { db } = initializeAdminApp();
    const normalizedDate = startOfDay(holiday.date);
    const q = db.collection("holidays").where("date", "==", admin.firestore.Timestamp.fromDate(normalizedDate));
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
        throw new Error("A holiday on this date already exists.");
    }
    await db.collection("holidays").add({
        name: holiday.name,
        date: admin.firestore.Timestamp.fromDate(normalizedDate)
    });
}

export async function deleteHoliday(holidayId: string) {
    const { db } = initializeAdminApp();
    await db.collection("holidays").doc(holidayId).delete();
}

// User and Auth Actions

export type SignupUserPayload = {
    email: string;
    password?: string;
    displayName: string;
};

export async function signupUser(payload: SignupUserPayload) {
    const { auth, db } = initializeAdminApp();
    if (!payload.email.endsWith('@t-systems.com')) {
        throw new Error('Only @t-systems.com emails are allowed to sign up.');
    }
    
    let userRecord;
    try {
        userRecord = await auth.createUser({
            email: payload.email,
            password: payload.password,
            displayName: payload.displayName,
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('auth/email-already-in-use');
        }
        throw error;
    }

    const usersCollection = db.collection('users');
    const existingUsersSnapshot = await usersCollection.limit(1).get();
    const isFirstUser = existingUsersSnapshot.empty;
    const userRole = isFirstUser ? 'admin' : 'user';

    if (userRole === 'admin') {
        await auth.setCustomUserClaims(userRecord.uid, { admin: true });
        console.log(`Set admin claim for first user: ${payload.email}`);
    }

    const userDoc: AppUser = {
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName: userRecord.displayName!,
        role: userRole,
        disabled: false,
        team: '',
    };

    await usersCollection.doc(userRecord.uid).set(userDoc);
    console.log(`Created Firestore document for user: ${payload.email}`);
    return { uid: userRecord.uid };
}


export type AddUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  team?: string;
};

export async function addUser(payload: AddUserPayload) {
     const { auth, db } = initializeAdminApp();
     if (!payload.email.endsWith('@t-systems.com')) {
        throw new Error('Only @t-systems.com emails are allowed.');
    }
    const userRecord = await auth.createUser({
        email: payload.email,
        password: payload.password,
        displayName: `${payload.firstName} ${payload.lastName}`,
    });

    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({ 
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName: userRecord.displayName!,
        team: payload.team || '',
        role: payload.role || 'user',
        disabled: false,
     });

     if (payload.role === 'admin') {
         await auth.setCustomUserClaims(userRecord.uid, { admin: true });
     } else {
        await auth.setCustomUserClaims(userRecord.uid, {});
     }
}

export async function deleteUserAction(uid: string) {
    const { auth, db } = initializeAdminApp();
    const userToUpdate = await auth.getUser(uid);
    if (userToUpdate.customClaims?.admin) {
        const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        if (adminUsersSnapshot.size <= 1) {
            throw new Error("Cannot delete the only admin account.");
        }
    }

    await auth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
}

export type UpdateUserPayload = {
  displayName: string;
  role: 'admin' | 'user';
  team?: string;
};

export async function updateUser(uid: string, payload: UpdateUserPayload) {
    const { auth, db } = initializeAdminApp();
    await auth.updateUser(uid, { displayName: payload.displayName });
    await db.collection('users').doc(uid).update({ 
        displayName: payload.displayName,
        role: payload.role,
        team: payload.team || ''
    });
    
    if (payload.role === 'admin') {
        await auth.setCustomUserClaims(uid, { admin: true });
    } else {
        await auth.setCustomUserClaims(uid, {});
    }
}

export async function setUserDisabledStatusAction(uid: string, disabled: boolean) {
    const { auth, db } = initializeAdminApp();
    if (disabled) {
        const userToUpdate = await auth.getUser(uid);
        if (userToUpdate.customClaims?.admin) {
             const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').where('disabled', '==', false).get();
             if (adminUsersSnapshot.size <= 1) {
                throw new Error("Cannot disable the only active admin account.");
             }
        }
    }
    
    await auth.updateUser(uid, { disabled });
    await db.collection('users').doc(uid).update({ disabled });
}

export async function sendPasswordResetLink(payload: { email: string }) {
  const { auth } = initializeAdminApp();
  try {
    // Check if the user exists first.
    const user = await auth.getUserByEmail(payload.email);
    if (!user) {
        // Silently succeed to prevent user enumeration attacks.
        console.log(`Password reset requested for non-existent user: ${payload.email}`);
        return { success: true };
    }
    
    // The actionCodeSettings specify that the user should be redirected to your app's
    // reset-password page after clicking the link in the email.
    const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
        handleCodeInApp: true,
    };

    const link = await auth.generatePasswordResetLink(payload.email, actionCodeSettings);
    
    // Now, send the email.
    await sendEmail({
        to: payload.email,
        subject: 'Reset Your SeatServe Password',
        text: `Hello,\n\nPlease click the following link to reset your password: ${link}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe SeatServe Team`,
        html: `<p>Hello,</p><p>Please click the following link to reset your password:</p><p><a href="${link}">Reset Password</a></p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>The SeatServe Team</p>`,
    });

    return { success: true };

  } catch (error: any) {
    console.error("Error in sendPasswordResetLink action:", error);
    // If user is not found, we don't want to reveal that. Silently succeed.
    if (error.code === 'auth/user-not-found') {
        console.log(`Password reset requested for non-existent user: ${payload.email}`);
        return { success: true };
    }
    // For other errors (like email service failure), rethrow the error to be caught by the client.
    throw error;
  }
}

export type ResetPasswordPayload = {
  oobCode: string;
  newPassword: string;
};
export async function resetPasswordAction(payload: ResetPasswordPayload) {
    const { auth } = initializeAdminApp();
    // Verify the code first
    const email = await auth.verifyPasswordResetCode(payload.oobCode);
    
    // If verification is successful, update the password
    await auth.updateUser(email, { password: payload.newPassword });

    return { success: true, email };
}
