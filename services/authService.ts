/**
 * authService.ts
 *
 * TWO completely separate auth systems:
 *  👤  REGULAR USERS  → Firebase Authentication + Firestore
 *  🔑  ADMIN          → Hardcoded mock, stored in AsyncStorage only
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  User,
} from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ═══════════════════════════════════════════════════════════════════
//  ADMIN — MOCK STORAGE  (zero Firebase calls)
// ═══════════════════════════════════════════════════════════════════

const ADMIN_EMAIL       = "adminFoodhub@gmail.com";
const ADMIN_PASSWORD    = "admin12345";
const ADMIN_SESSION_KEY = "@foodhub_admin_session";

export const MOCK_ADMIN = {
  uid:     "admin-mock-uid-001",
  email:   ADMIN_EMAIL,
  role:    "admin" as const,
  name:    "Admin",
  surname: "",
};

export const loginAdmin = async (
  email: string,
  password: string
): Promise<typeof MOCK_ADMIN> => {
  const ok =
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD;
  if (!ok) throw new Error("Invalid admin credentials.");
  await AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(MOCK_ADMIN));
  return MOCK_ADMIN;
};

export const logoutAdmin = async (): Promise<void> => {
  await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
};

export const getAdminSession = async (): Promise<typeof MOCK_ADMIN | null> => {
  try {
    const raw = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as typeof MOCK_ADMIN) : null;
  } catch {
    return null;
  }
};

export const isAdminLoggedIn = async (): Promise<boolean> => {
  return (await getAdminSession()) !== null;
};

// ═══════════════════════════════════════════════════════════════════
//  REGULAR USERS — Firebase Auth + Firestore
// ═══════════════════════════════════════════════════════════════════

export interface UserProfile {
  name:        string;
  surname:     string;
  phone:       string;
  address:     string;
  cardNumber?: string;
  expiry?:     string;
  cvv?:        string;
  role?:       "user";
}

export const registerUser = async (
  email: string,
  password: string,
  profile: Partial<UserProfile> = {}
): Promise<UserCredential> => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid  = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    email:      email.trim().toLowerCase(),
    role:       "user",
    name:       profile.name       ?? "",
    surname:    profile.surname    ?? "",
    phone:      profile.phone      ?? "",
    address:    profile.address    ?? "",
    cardNumber: profile.cardNumber ?? "",
    expiry:     profile.expiry     ?? "",
    cvv:        profile.cvv        ?? "",
    createdAt:  serverTimestamp(),
  });

  return cred;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
};

/**
 * ✅ logoutUser — fully awaits Firebase signOut before returning.
 * This ensures the caller can safely navigate after this resolves.
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

// ═══════════════════════════════════════════════════════════════════
//  SHARED — boot session detection
// ═══════════════════════════════════════════════════════════════════

export type SessionInfo =
  | { type: "admin"; data: typeof MOCK_ADMIN }
  | { type: "user";  data: User }
  | { type: "none" };

export const getCurrentSession = async (): Promise<SessionInfo> => {
  const adminSession = await getAdminSession();
  if (adminSession) return { type: "admin", data: adminSession };
  const firebaseUser = auth.currentUser;
  if (firebaseUser) return { type: "user", data: firebaseUser };
  return { type: "none" };
};