import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

interface UserProfile {
  name: string;
  surname: string;
  phone: string;
  address: string;
  role?: "user" | "admin";
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

// Register user
export const registerUser = async (
  email: string,
  password: string,
  profile?: UserProfile
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const uid = userCredential.user.uid;

  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email,
      role: profile?.role || "user",
      ...profile,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return userCredential;
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Logout
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Check if logged-in user is admin
export const isAdmin = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return false;

  return snap.data().role === "admin";
};
