import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

export const addRestaurant = async (restaurant: any) => {
  const docRef = await addDoc(collection(db, "restaurants"), restaurant);
  return docRef.id; // returns the restaurant ID
};

export const addMenuItem = async (item: any) => {
  await addDoc(collection(db, "menuItems"), item);
};
