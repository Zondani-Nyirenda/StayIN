import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAjLE2glC_1Lf5xyy8BwMmrwoe_OClbRy0",
  authDomain: "stayin123-ea145.firebaseapp.com",   // 🔑 derived from project_id
  projectId: "stayin123-ea145",
  storageBucket: "stayin123-ea145.firebasestorage.app",
  messagingSenderId: "414033473044",
  appId: "1:414033473044:android:85fde17f8c434a8c390101"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
