try {
  await import("server-only");
} catch {
  // Keep plain Node compatibility for future unit tests.
}

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { assertServerEnv, getPublicEnv } from "@/lib/config/env";

function getAdminConfig() {
  const serverEnv = assertServerEnv();
  const publicEnv = getPublicEnv();

  return {
    projectId: serverEnv.firebaseAdminProjectId,
    clientEmail: serverEnv.firebaseAdminClientEmail,
    privateKey: serverEnv.firebaseAdminPrivateKey,
    storageBucket: publicEnv.firebaseStorageBucket,
  };
}

export function getFirebaseAdminApp() {
  const config = getAdminConfig();

  if (getApps().length) {
    return getApp();
  }

  return initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
    storageBucket: config.storageBucket,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}
