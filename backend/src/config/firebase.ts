import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!getApps().length) {
  if (serviceAccountKey) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountKey)),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    initializeApp({
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
}

export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();
