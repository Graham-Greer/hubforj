try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getSuperadminByAuthUid } from "@/lib/data/users";
import { createSignedSessionValue, sessionDurationSeconds } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/config/env";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function createPlatformSessionFromIdToken(idToken) {
  const normalizedIdToken = normalizeString(idToken);

  if (!normalizedIdToken) {
    throw new Error("Sign-in token is required.");
  }

  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(normalizedIdToken, true);
  const user = await getSuperadminByAuthUid(decodedToken.uid);

  if (!user || user.role !== "superadmin") {
    throw new Error("No superadmin account exists for this operator.");
  }

  if (user.status !== "active") {
    throw new Error("This superadmin account is not currently active.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const sessionValue = createSignedSessionValue(
    {
      userId: user.id,
      hubId: "",
      role: user.role,
      email: user.email,
      name: user.name,
      expiresAt,
    },
    getServerEnv().sessionHmacSecret
  );

  return {
    user,
    expiresAt,
    sessionValue,
  };
}
