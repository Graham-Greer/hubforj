import "server-only";

import { getAuth as getFirebaseAdminAuth } from "firebase-admin/auth";
import {
  getCommercialAccountByAuthUid,
  getCommercialAccountByEmail,
  updateCommercialAccountAuthUid,
  updateCommercialAccountVerificationState,
} from "@/lib/data/commercial-accounts";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeEmailVerified(value) {
  return value === true;
}

function buildAuthUserFromDecodedToken(decodedToken) {
  return {
    uid: normalizeString(decodedToken?.uid),
    emailVerified: normalizeEmailVerified(decodedToken?.email_verified),
  };
}

export async function ensureCommercialAccountAuthUser({ account, password }) {
  const normalizedPassword = String(password || "");

  if (!account?.id) {
    throw new Error("Commercial account is required.");
  }

  if (!normalizedPassword || normalizedPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());
  const ownerEmail = normalizeEmail(account.ownerEmail);

  if (!ownerEmail) {
    throw new Error("Account email is required.");
  }

  let user = null;

  if (account.authUid) {
    try {
      user = await auth.getUser(account.authUid);
    } catch {
      user = null;
    }
  }

  if (!user) {
    try {
      user = await auth.getUserByEmail(ownerEmail);
    } catch {
      user = null;
    }
  }

  if (user) {
    await auth.updateUser(user.uid, {
      displayName: account.ownerFullName || user.displayName || undefined,
      password: normalizedPassword,
      email: ownerEmail,
      emailVerified: Boolean(user.emailVerified),
      disabled: false,
    });
  } else {
    user = await auth.createUser({
      email: ownerEmail,
      password: normalizedPassword,
      displayName: account.ownerFullName || undefined,
      emailVerified: false,
      disabled: false,
    });
  }

  const accountWithAuthUid = await updateCommercialAccountAuthUid(account.id, user.uid);

  return syncCommercialAccountVerificationState({
    account: accountWithAuthUid,
    authUser: user,
  });
}

export async function getCommercialAccountAuthUser(account) {
  if (!account?.authUid && !account?.ownerEmail) {
    return null;
  }

  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());

  if (account.authUid) {
    try {
      return await auth.getUser(account.authUid);
    } catch {
      return null;
    }
  }

  try {
    return await auth.getUserByEmail(normalizeEmail(account.ownerEmail));
  } catch {
    return null;
  }
}

export async function syncCommercialAccountVerificationState({ account, authUser = null } = {}) {
  if (!account?.id) {
    throw new Error("Commercial account is required.");
  }

  const resolvedAuthUser = authUser || (await getCommercialAccountAuthUser(account));

  if (!resolvedAuthUser) {
    return account;
  }

  const verifiedAt =
    resolvedAuthUser.emailVerified && !account.emailVerified
      ? new Date().toISOString()
      : account.emailVerifiedAt || "";
  const emailVerified = Boolean(resolvedAuthUser.emailVerified);
  const emailVerifiedAt = emailVerified ? verifiedAt : "";
  const verificationEmailSentAt = account.verificationEmailSentAt || "";

  if (
    Boolean(account.emailVerified) === emailVerified &&
    normalizeString(account.emailVerifiedAt) === normalizeString(emailVerifiedAt) &&
    normalizeString(account.verificationEmailSentAt) === normalizeString(verificationEmailSentAt)
  ) {
    return account;
  }

  return updateCommercialAccountVerificationState(account.id, {
    emailVerified,
    emailVerifiedAt,
    verificationEmailSentAt,
  });
}

export async function resolveCommercialAccountFromIdToken(idToken) {
  const normalizedIdToken = normalizeString(idToken);

  if (!normalizedIdToken) {
    throw new Error("Sign-in token is required.");
  }

  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());
  const decodedToken = await auth.verifyIdToken(normalizedIdToken, true);
  const authUser = buildAuthUserFromDecodedToken(decodedToken);
  const byUid = await getCommercialAccountByAuthUid(decodedToken.uid);

  if (byUid) {
    return syncCommercialAccountVerificationState({
      account: byUid,
      authUser,
    });
  }

  const email = normalizeEmail(decodedToken.email);
  const byEmail = email ? await getCommercialAccountByEmail(email) : null;

  if (!byEmail) {
    throw new Error("No commercial account exists for this customer.");
  }

  const accountWithUid = await updateCommercialAccountAuthUid(byEmail.id, decodedToken.uid);

  return syncCommercialAccountVerificationState({
    account: accountWithUid,
    authUser,
  });
}
