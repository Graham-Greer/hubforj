import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { assertServerEnv } from "@/lib/config/env";

function getAdminConfig() {
  const env = assertServerEnv();

  return {
    projectId: env.firebaseAdminProjectId,
    clientEmail: env.firebaseAdminClientEmail,
    privateKey: env.firebaseAdminPrivateKey,
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
  });
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
