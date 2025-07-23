
import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc, 
    getDoc,
    query,
    onSnapshot,
    Timestamp,
    orderBy,
    Firestore,
} from "firebase/firestore";

import type { Booking, Desk, Holiday } from "@/types";
import type { User as AppUser } from "./firebase";

export type Unsubscribe = () => void;

// Desks (Client-side functions)
export function getDesks(
  db: Firestore,
  callback: (desks: Desk[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  // Corrected the query to be simple and stable.
  // The previous implementation had a faulty `orderBy` clause that caused crashes.
  const q = query(collection(db, "desks"));
  
  return onSnapshot(q, 
    (querySnapshot) => {
      const desks: Desk[] = [];
      querySnapshot.forEach((doc) => {
          desks.push({ id: doc.id, ...doc.data() } as Desk);
      });
      callback(desks);
    },
    (error) => {
      console.error("FIRESTORE_ERROR in getDesks:", error);
      onError(error);
    }
  );
}


// Bookings (Client-side functions)
export function getBookings(db: Firestore, callback: (bookings: Booking[]) => void): Unsubscribe {
    const q = query(collection(db, "bookings"));
    return onSnapshot(q, (querySnapshot) => {
        const bookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            bookings.push({
                id: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as Booking);
        });
        callback(bookings);
    });
}
export type AddBookingPayload = Omit<Booking, 'id'>;
export async function addBooking(db: Firestore, booking: AddBookingPayload) {
    await addDoc(collection(db, "bookings"), booking);
}
export async function deleteBooking(db: Firestore, bookingId: string) {
    await deleteDoc(doc(db, "bookings", bookingId));
}

// Holidays (Client-side functions)
export function getHolidays(db: Firestore, callback: (holidays: Holiday[]) => void): Unsubscribe {
    const q = query(collection(db, "holidays"), orderBy("date"));
    return onSnapshot(q, (querySnapshot) => {
        const holidays: Holiday[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            holidays.push({
                id: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as Holiday);
        });
        callback(holidays);
    });
}

// User Management (Client-side functions)
export async function getUserFromFirestore(db: Firestore, uid: string): Promise<AppUser | null> {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return docSnap.data() as AppUser;
  }
  return null;
}

export async function getUsers(db: Firestore): Promise<AppUser[]> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: AppUser[] = [];
    usersSnapshot.forEach((doc) => {
        users.push(doc.data() as AppUser);
    });
    return users;
}

