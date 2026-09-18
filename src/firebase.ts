import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "aqueous-facet-96shk",
  appId: "1:419739197632:web:c53756a506f0dfec354d25",
  apiKey: "AIzaSyDEzprGRTGtv3niZQgvHk5UytT5ESd6iHI",
  authDomain: "aqueous-facet-96shk.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-easymoneyledger-120c4848-c572-4fef-98f5-9798e26ebb4c",
  storageBucket: "aqueous-facet-96shk.firebasestorage.app",
  messagingSenderId: "419739197632",
  oAuthClientId: "419739197632-5n7sbdm4b6bpm89vlln7ovonmll9job4.apps.googleusercontent.com",
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with the named database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export {
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
};
export type { User, Unsubscribe };
