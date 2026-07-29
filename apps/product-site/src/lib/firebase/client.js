import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { assertPublicEnv } from "@/lib/config/env";

function getClientConfig() {
  const env = assertPublicEnv();

  return {
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain,
    projectId: env.firebaseProjectId,
    storageBucket: env.firebaseStorageBucket,
    messagingSenderId: env.firebaseMessagingSenderId,
    appId: env.firebaseAppId,
  };
}

export function getFirebaseClientApp() {
  return getApps().length ? getApp() : initializeApp(getClientConfig());
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}
