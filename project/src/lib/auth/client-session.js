"use client";

import { signInWithCustomToken } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export async function establishSessionFromCustomToken(customToken) {
  const token = String(customToken || "").trim();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  const credential = await signInWithCustomToken(getFirebaseClientAuth(), token);
  const idToken = await credential.user.getIdToken(true);

  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("Unable to establish server session.");
  }

  return true;
}
