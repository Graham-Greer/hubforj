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

  // Anonymous signup is never an account recovery or credential-update path.
  if (normalizeString(account.authUid)) {
    throw new Error("This account already has sign-in details. Sign in or reset your password to recover access.");
  }

  const ownerEmail = normalizeEmail(account.ownerEmail);
  await assertCommercialSignupEmailAvailable(ownerEmail);
  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());
  let user;
  try {
    user = await auth.createUser({
      email: ownerEmail,
      password: normalizedPassword,
      displayName: account.ownerFullName || undefined,
      emailVerified: false,
      disabled: false,
    });
  } catch (error) {
    if (error?.code === "auth/email-already-exists") {
      throw new Error(existingIdentitySignupMessage);
    }
    throw error;
  }

  const accountWithAuthUid = await updateCommercialAccountAuthUid(account.id, user.uid);

  return syncCommercialAccountVerificationState({
    account: accountWithAuthUid,
    authUser: user,
  });
}

const existingIdentitySignupMessage =
  "This email already has sign-in details. Sign in or reset your password to access your existing account. To create a new workspace here, use a different email address.";

export async function assertCommercialSignupEmailAvailable(email) {
  const ownerEmail = normalizeEmail(email);
  if (!ownerEmail) {
    throw new Error("Account email is required.");
  }

  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());
  try {
    await auth.getUserByEmail(ownerEmail);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return;
    throw new Error("We could not check your sign-in details. Please try again shortly.");
  }
  throw new Error(existingIdentitySignupMessage);
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

export async function resolveCommercialAccountFromIdToken(idToken, { requireRecentAuthentication = false } = {}) {
  const normalizedIdToken = normalizeString(idToken);

  if (!normalizedIdToken) {
    throw new Error("Sign-in token is required.");
  }

  const auth = getFirebaseAdminAuth(getFirebaseAdminApp());
  const decodedToken = await auth.verifyIdToken(normalizedIdToken, true);
  if (requireRecentAuthentication) {
    const age = Math.floor(Date.now() / 1000) - Number(decodedToken.auth_time);
    if (!Number.isFinite(age) || age < 0 || age > 300) throw new Error("Sign in again to recover your setup.");
  }
  const authUser = buildAuthUserFromDecodedToken(decodedToken);
  const byUid = await getCommercialAccountByAuthUid(decodedToken.uid);

  if (byUid) {
    if (byUid.status && byUid.status !== "active") throw new Error("This account is not active.");
    return { ...(await syncCommercialAccountVerificationState({ account: byUid, authUser })), sessionAuthTime: Number(decodedToken.auth_time) * 1000 };
  }

  const email = normalizeEmail(decodedToken.email);
  if (!email || decodedToken.email_verified !== true) {
    throw new Error("Verify your email address before linking it to a commercial account.");
  }
  const byEmail = email ? await getCommercialAccountByEmail(email) : null;

  if (!byEmail || (byEmail.status && byEmail.status !== "active")) {
    throw new Error("No commercial account exists for this customer.");
  }

  if (normalizeString(byEmail.authUid) && normalizeString(byEmail.authUid) !== decodedToken.uid) {
    throw new Error("These sign-in details do not match this commercial account.");
  }

  const accountWithUid = await updateCommercialAccountAuthUid(byEmail.id, decodedToken.uid);

  return { ...(await syncCommercialAccountVerificationState({ account: accountWithUid, authUser })), sessionAuthTime: Number(decodedToken.auth_time) * 1000 };
}
