import "server-only";

import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import {
  normalizeCommercialAccountHubRecord,
  normalizeCommercialAccountInput,
  normalizeCommercialAccountRecord,
} from "@/lib/domain/commercial-accounts";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

const ACCOUNT_COLLECTION = "commercialAccounts";
const ACCOUNT_EMAIL_COLLECTION = "commercialAccountEmails";
const OWNED_HUBS_COLLECTION = "ownedHubs";
const ACCOUNT_AUDIT_COLLECTION = "auditEvents";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function buildCommercialAccountEmailKey(email) {
  return crypto.createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

function buildCommercialAccountId() {
  return `acct_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function getAccountRef(accountId) {
  return getFirebaseAdminDb().collection(ACCOUNT_COLLECTION).doc(accountId);
}

function getEmailRef(emailKey) {
  return getFirebaseAdminDb().collection(ACCOUNT_EMAIL_COLLECTION).doc(emailKey);
}

function normalizeAuditMetadata(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  );
}

export async function getCommercialAccountById(accountId) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    return null;
  }

  const doc = await getAccountRef(normalizedAccountId).get();

  if (!doc.exists) {
    return null;
  }

  return normalizeCommercialAccountRecord({
    id: doc.id,
    ...doc.data(),
  });
}

export async function getCommercialAccountByEmail(ownerEmail) {
  const normalizedEmail = normalizeEmail(ownerEmail);

  if (!normalizedEmail) {
    return null;
  }

  const emailRef = getEmailRef(buildCommercialAccountEmailKey(normalizedEmail));
  const emailDoc = await emailRef.get();

  if (!emailDoc.exists) {
    return null;
  }

  return getCommercialAccountById(emailDoc.data()?.accountId);
}

export async function getCommercialAccountByAuthUid(authUid) {
  const normalizedAuthUid = normalizeString(authUid);

  if (!normalizedAuthUid) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(ACCOUNT_COLLECTION)
    .where("authUid", "==", normalizedAuthUid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return normalizeCommercialAccountRecord({
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  });
}

export async function getCommercialAccountByStripeCustomerId(stripeCustomerId) {
  const normalizedStripeCustomerId = normalizeString(stripeCustomerId);

  if (!normalizedStripeCustomerId) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(ACCOUNT_COLLECTION)
    .where("stripeCustomerId", "==", normalizedStripeCustomerId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return normalizeCommercialAccountRecord({
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  });
}

export async function getCommercialAccountByStripeSubscriptionId(stripeSubscriptionId) {
  const normalizedStripeSubscriptionId = normalizeString(stripeSubscriptionId);

  if (!normalizedStripeSubscriptionId) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(ACCOUNT_COLLECTION)
    .where("stripeSubscriptionId", "==", normalizedStripeSubscriptionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return normalizeCommercialAccountRecord({
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  });
}

export async function createOrResolveCommercialAccount(values = {}) {
  const normalized = normalizeCommercialAccountInput(values);
  const now = new Date().toISOString();
  const emailKey = buildCommercialAccountEmailKey(normalized.ownerEmail);
  const emailRef = getEmailRef(emailKey);
  const db = getFirebaseAdminDb();

  const accountId = await db.runTransaction(async (transaction) => {
    const emailDoc = await transaction.get(emailRef);

    if (emailDoc.exists) {
      const existingAccountId = normalizeString(emailDoc.data()?.accountId);

      if (!existingAccountId) {
        throw new Error("Commercial account email mapping is invalid.");
      }

      const accountRef = getAccountRef(existingAccountId);
      const accountDoc = await transaction.get(accountRef);

      if (!accountDoc.exists) {
        transaction.set(accountRef, {
          ownerFullName: normalized.ownerFullName,
          ownerEmail: normalized.ownerEmail,
          ownerEmailKey: emailKey,
          authUid: "",
          status: "active",
          emailVerified: false,
          emailVerifiedAt: "",
          verificationEmailSentAt: "",
          stripeCustomerId: "",
          stripeSubscriptionId: "",
          stripeSubscriptionScheduleId: "",
          stripePriceId: "",
          packageCurrency: "",
          stripeSubscriptionStatus: "",
          stripeCancelAt: "",
          stripeCurrentPeriodEnd: "",
          stripeCancelAtPeriodEnd: false,
          stripeBillingEmail: normalized.ownerEmail,
          stripeLastCheckoutSessionId: "",
          stripeLastEventId: "",
          stripeLastEventType: "",
          stripeLastSyncedAt: "",
          pendingPackageTier: "",
          pendingPackageCurrency: "",
          pendingPackageStatus: "",
          pendingPackageEffectiveAt: "",
          pendingPackageUpdatedAt: "",
          primaryHubId: "",
          lastHubId: "",
          hubCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        transaction.update(accountRef, {
          ownerFullName: normalized.ownerFullName,
          updatedAt: now,
        });
      }

      transaction.set(
        emailRef,
        {
          accountId: existingAccountId,
          ownerEmail: normalized.ownerEmail,
          updatedAt: now,
        },
        { merge: true }
      );

      return existingAccountId;
    }

    const nextAccountId = buildCommercialAccountId();
    const accountRef = getAccountRef(nextAccountId);

    transaction.create(accountRef, {
      ownerFullName: normalized.ownerFullName,
      ownerEmail: normalized.ownerEmail,
      ownerEmailKey: emailKey,
      authUid: "",
      status: "active",
      emailVerified: false,
      emailVerifiedAt: "",
      verificationEmailSentAt: "",
      stripeCustomerId: "",
      stripeSubscriptionId: "",
      stripeSubscriptionScheduleId: "",
      stripePriceId: "",
      packageCurrency: "",
      stripeSubscriptionStatus: "",
      stripeCancelAt: "",
      stripeCurrentPeriodEnd: "",
      stripeCancelAtPeriodEnd: false,
      stripeBillingEmail: normalized.ownerEmail,
      stripeLastCheckoutSessionId: "",
      stripeLastEventId: "",
      stripeLastEventType: "",
      stripeLastSyncedAt: "",
      pendingPackageTier: "",
      pendingPackageCurrency: "",
      pendingPackageStatus: "",
      pendingPackageEffectiveAt: "",
      pendingPackageUpdatedAt: "",
      primaryHubId: "",
      lastHubId: "",
      hubCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    transaction.create(emailRef, {
      accountId: nextAccountId,
      ownerEmail: normalized.ownerEmail,
      createdAt: now,
      updatedAt: now,
    });

    return nextAccountId;
  });

  return getCommercialAccountById(accountId);
}

export async function updateCommercialAccountAuthUid(accountId, authUid) {
  const normalizedAccountId = normalizeString(accountId);
  const normalizedAuthUid = normalizeString(authUid);

  if (!normalizedAccountId || !normalizedAuthUid) {
    throw new Error("Account id and auth uid are required.");
  }

  const ref = getAccountRef(normalizedAccountId);
  const now = new Date().toISOString();

  await ref.set(
    {
      authUid: normalizedAuthUid,
      updatedAt: now,
    },
    { merge: true }
  );

  return getCommercialAccountById(normalizedAccountId);
}

export async function updateCommercialAccountVerificationState(
  accountId,
  { emailVerified = false, emailVerifiedAt = "", verificationEmailSentAt = "" } = {}
) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    throw new Error("Account id is required.");
  }

  const ref = getAccountRef(normalizedAccountId);
  const now = new Date().toISOString();

  await ref.set(
    {
      emailVerified: Boolean(emailVerified),
      emailVerifiedAt: Boolean(emailVerified) ? normalizeString(emailVerifiedAt) || now : "",
      verificationEmailSentAt: normalizeString(verificationEmailSentAt),
      updatedAt: now,
    },
    { merge: true }
  );

  return getCommercialAccountById(normalizedAccountId);
}

export async function updateCommercialAccountStripeCustomer(
  accountId,
  { stripeCustomerId = "", stripeBillingEmail = "" } = {}
) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    throw new Error("Account id is required.");
  }

  const ref = getAccountRef(normalizedAccountId);
  const now = new Date().toISOString();

  await ref.set(
    {
      stripeCustomerId: normalizeString(stripeCustomerId),
      stripeBillingEmail: normalizeEmail(stripeBillingEmail),
      updatedAt: now,
    },
    { merge: true }
  );

  return getCommercialAccountById(normalizedAccountId);
}

export async function updateCommercialAccountStripeSubscription(
  accountId,
  {
    stripeCustomerId = "",
    stripeSubscriptionId = "",
    stripeSubscriptionScheduleId = "",
    stripePriceId = "",
    packageCurrency = "",
    stripeSubscriptionStatus = "",
    stripeCancelAt = "",
    stripeCurrentPeriodEnd = "",
    stripeCancelAtPeriodEnd = false,
    stripeBillingEmail = "",
    stripeLastCheckoutSessionId = "",
    stripeLastEventId = "",
    stripeLastEventType = "",
    stripeLastSyncedAt = "",
  } = {}
) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    throw new Error("Account id is required.");
  }

  const ref = getAccountRef(normalizedAccountId);
  const now = new Date().toISOString();

  await ref.set(
    {
      stripeCustomerId: normalizeString(stripeCustomerId),
      stripeSubscriptionId: normalizeString(stripeSubscriptionId),
      stripeSubscriptionScheduleId: normalizeString(stripeSubscriptionScheduleId),
      stripePriceId: normalizeString(stripePriceId),
      packageCurrency: normalizeString(packageCurrency).toUpperCase(),
      stripeSubscriptionStatus: normalizeString(stripeSubscriptionStatus),
      stripeCancelAt: normalizeString(stripeCancelAt),
      stripeCurrentPeriodEnd: normalizeString(stripeCurrentPeriodEnd),
      stripeCancelAtPeriodEnd: Boolean(stripeCancelAtPeriodEnd),
      stripeBillingEmail: normalizeEmail(stripeBillingEmail),
      stripeLastCheckoutSessionId: normalizeString(stripeLastCheckoutSessionId),
      stripeLastEventId: normalizeString(stripeLastEventId),
      stripeLastEventType: normalizeString(stripeLastEventType),
      stripeLastSyncedAt: normalizeString(stripeLastSyncedAt) || now,
      updatedAt: now,
    },
    { merge: true }
  );

  return getCommercialAccountById(normalizedAccountId);
}

export async function updateCommercialAccountPackageIntent(
  accountId,
  {
    pendingPackageTier = "",
    pendingPackageCurrency = "",
    pendingPackageStatus = "",
    pendingPackageEffectiveAt = "",
    pendingPackageUpdatedAt = "",
  } = {}
) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    throw new Error("Account id is required.");
  }

  const ref = getAccountRef(normalizedAccountId);
  const now = new Date().toISOString();

  await ref.set(
    {
      pendingPackageTier: normalizeString(pendingPackageTier).toLowerCase(),
      pendingPackageCurrency: normalizeString(pendingPackageCurrency).toUpperCase(),
      pendingPackageStatus: normalizeString(pendingPackageStatus).toLowerCase(),
      pendingPackageEffectiveAt: normalizeString(pendingPackageEffectiveAt),
      pendingPackageUpdatedAt: normalizeString(pendingPackageUpdatedAt) || now,
      updatedAt: now,
    },
    { merge: true }
  );

  return getCommercialAccountById(normalizedAccountId);
}

export async function markCommercialAccountVerificationEmailSent(accountId, sentAt = new Date().toISOString()) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    throw new Error("Account id is required.");
  }

  const ref = getAccountRef(normalizedAccountId);
  const now = new Date().toISOString();

  await ref.set(
    {
      verificationEmailSentAt: normalizeString(sentAt) || now,
      updatedAt: now,
    },
    { merge: true }
  );

  return getCommercialAccountById(normalizedAccountId);
}

export async function attachHubOwnershipToCommercialAccount({
  accountId,
  hubId,
  hubSlug,
  communityName,
  packageTier,
  packageStatus,
}) {
  const normalizedAccountId = normalizeString(accountId);
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedAccountId || !normalizedHubId) {
    throw new Error("Account id and hub id are required.");
  }

  const now = new Date().toISOString();
  const db = getFirebaseAdminDb();
  const accountRef = getAccountRef(normalizedAccountId);
  const ownedHubRef = accountRef.collection(OWNED_HUBS_COLLECTION).doc(normalizedHubId);

  await db.runTransaction(async (transaction) => {
    const [accountDoc, ownedHubDoc] = await Promise.all([transaction.get(accountRef), transaction.get(ownedHubRef)]);

    if (!accountDoc.exists) {
      throw new Error("Commercial account does not exist.");
    }

    const account = normalizeCommercialAccountRecord({
      id: accountDoc.id,
      ...accountDoc.data(),
    });
    const isPrimary = ownedHubDoc.exists ? Boolean(ownedHubDoc.data()?.isPrimary) : !account?.primaryHubId;

    transaction.set(
      ownedHubRef,
      {
        hubId: normalizedHubId,
        hubSlug: normalizeString(hubSlug),
        communityName: normalizeString(communityName),
        relationship: "owner",
        isPrimary,
        packageTier: normalizeString(packageTier).toLowerCase() || "free",
        packageStatus: normalizeString(packageStatus).toLowerCase() || "active",
        createdAt: ownedHubDoc.exists ? normalizeString(ownedHubDoc.data()?.createdAt) || now : now,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.set(
      accountRef,
      {
        primaryHubId: account?.primaryHubId || normalizedHubId,
        lastHubId: normalizedHubId,
        hubCount: ownedHubDoc.exists ? account?.hubCount || 0 : FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );
  });

  const doc = await ownedHubRef.get();

  return normalizeCommercialAccountHubRecord({
    id: doc.id,
    ...doc.data(),
  });
}

export async function listCommercialAccountHubs(accountId) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    return [];
  }

  const snapshot = await getAccountRef(normalizedAccountId).collection(OWNED_HUBS_COLLECTION).get();

  return snapshot.docs
    .map((doc) =>
      normalizeCommercialAccountHubRecord({
        id: doc.id,
        ...doc.data(),
      })
    )
    .filter(Boolean)
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return left.isPrimary ? -1 : 1;
      }

      return String(left.communityName || left.hubSlug).localeCompare(String(right.communityName || right.hubSlug));
    });
}

export async function appendCommercialAccountAuditEvent(
  accountId,
  { type = "", title = "", summary = "", metadata = {}, occurredAt = "" } = {}
) {
  const normalizedAccountId = normalizeString(accountId);

  if (!normalizedAccountId) {
    throw new Error("Account id is required.");
  }

  const accountRef = getAccountRef(normalizedAccountId);
  const accountDoc = await accountRef.get();

  if (!accountDoc.exists) {
    throw new Error("Commercial account does not exist.");
  }

  const now = new Date().toISOString();
  const auditRef = accountRef.collection(ACCOUNT_AUDIT_COLLECTION).doc();

  await auditRef.set({
    type: normalizeString(type),
    title: normalizeString(title),
    summary: normalizeString(summary),
    metadata: normalizeAuditMetadata(metadata),
    occurredAt: normalizeString(occurredAt) || now,
    createdAt: now,
  });

  return {
    id: auditRef.id,
    type: normalizeString(type),
    occurredAt: normalizeString(occurredAt) || now,
  };
}

export async function provisionCommercialAccountForSignup({
  ownerFullName,
  ownerEmail,
  hubId,
  hubSlug,
  communityName,
  packageTier,
  packageStatus,
}) {
  const account = await createOrResolveCommercialAccount({
    ownerFullName,
    ownerEmail,
  });

  const ownedHub = await attachHubOwnershipToCommercialAccount({
    accountId: account?.id,
    hubId,
    hubSlug,
    communityName,
    packageTier,
    packageStatus,
  });

  return {
    account: await getCommercialAccountById(account?.id),
    ownedHub,
  };
}
