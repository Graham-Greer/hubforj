try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { FieldPath } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

export const MEMBER_DIRECTORY_SCHEMA_VERSION = 1;
export const MEMBER_DIRECTORY_SUMMARY_SCHEMA_VERSION = 1;

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseBoolean(value) {
  return value === true || normalizeLower(value) === "true";
}

function isReadModelEnabled() {
  return normalizeLower(process.env.HUB_PLATFORM_MEMBER_DIRECTORY_READ_MODEL_ENABLED) === "true";
}

function getMemberDirectoryCollection(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("memberDirectory");
}

function getMemberDirectorySummaryRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("system").doc("memberDirectorySummary");
}

function getUsersCollection() {
  return getFirebaseAdminDb().collection("users");
}

function getHubCollection(hubId, collectionName) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection(collectionName);
}

function encodeMemberDirectoryCursor(item) {
  const displayNameLower = normalizeLower(item?.displayNameLower || item?.displayName || item?.email);
  const id = normalizeString(item?.id);

  if (!displayNameLower || !id) {
    return "";
  }

  return encodeURIComponent(JSON.stringify({ displayNameLower, id }));
}

function decodeMemberDirectoryCursor(cursor) {
  const normalizedCursor = normalizeString(cursor);

  if (!normalizedCursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(normalizedCursor));
    const displayNameLower = normalizeLower(parsed?.displayNameLower);
    const id = normalizeString(parsed?.id);

    return displayNameLower && id ? { displayNameLower, id } : null;
  } catch {
    return null;
  }
}

function buildSearchPrefixes(values = []) {
  const prefixes = new Set();

  values
    .map(normalizeLower)
    .filter(Boolean)
    .flatMap((value) => value.split(/[^a-z0-9@._+-]+/i).filter(Boolean).concat(value.replace(/\s+/g, "")))
    .filter(Boolean)
    .forEach((token) => {
      const maxLength = Math.min(token.length, 32);

      for (let index = 1; index <= maxLength; index += 1) {
        prefixes.add(token.slice(0, index));
      }
    });

  return [...prefixes].slice(0, 120);
}

function getMembershipSortValue(membership = {}) {
  return normalizeString(membership.startDate || membership.updatedAt || membership.createdAt || membership.renewalDate);
}

function normalizeMemberDirectoryRecord(record = {}) {
  const displayName = normalizeString(record.displayName);
  const email = normalizeLower(record.email);
  const membershipType = normalizeString(record.membershipType) || "none";
  const pendingUpgradeRequest = parseBoolean(record.pendingUpgradeRequest);
  const paymentAttentionCount = parseInteger(record.paymentAttentionCount);

  return {
    id: normalizeString(record.id || record.userId || record.memberId),
    hubId: normalizeString(record.hubId),
    userId: normalizeString(record.userId || record.id),
    memberId: normalizeString(record.memberId || record.userId || record.id),
    displayName,
    displayNameLower: normalizeLower(record.displayNameLower || displayName || email),
    email,
    emailLower: normalizeLower(record.emailLower || email),
    status: normalizeString(record.status) || "active",
    role: normalizeString(record.role) || "member",
    membershipPlanId: normalizeString(record.membershipPlanId),
    membershipPlanName: normalizeString(record.membershipPlanName),
    membershipStatus: normalizeString(record.membershipStatus) || "none",
    membershipType,
    pendingUpgradeRequest,
    paymentAttentionCount,
    attentionStatus: pendingUpgradeRequest ? "upgrade_request" : paymentAttentionCount > 0 ? "payment_attention" : "all_clear",
    lastSignedInAt: normalizeString(record.lastSignedInAt),
    lastActivityAt: normalizeString(record.lastActivityAt || record.lastSignedInAt || record.updatedAt || record.createdAt),
    joinedAt: normalizeString(record.joinedAt || record.createdAt),
    createdAt: normalizeString(record.createdAt),
    updatedAt: normalizeString(record.updatedAt),
    rebuiltAt: normalizeString(record.rebuiltAt),
    schemaVersion: parseInteger(record.schemaVersion),
    searchPrefixes: Array.isArray(record.searchPrefixes) ? record.searchPrefixes.map(normalizeLower).filter(Boolean).slice(0, 120) : [],
  };
}

function createEmptyMemberDirectorySummary() {
  return {
    total: 0,
    suspended: 0,
    upgradeRequests: 0,
    paymentAttention: 0,
  };
}

function getMemberDirectorySummaryContribution(row = {}) {
  const normalizedRow = normalizeMemberDirectoryRecord(row);

  if (!normalizedRow.id || normalizedRow.role !== "member") {
    return createEmptyMemberDirectorySummary();
  }

  return {
    total: 1,
    suspended: normalizedRow.status === "suspended" ? 1 : 0,
    upgradeRequests: normalizedRow.attentionStatus === "upgrade_request" ? 1 : 0,
    paymentAttention: normalizedRow.attentionStatus === "payment_attention" ? 1 : 0,
  };
}

function addSummaryContribution(summary, contribution, multiplier = 1) {
  return {
    total: Math.max(0, parseInteger(summary.total) + contribution.total * multiplier),
    suspended: Math.max(0, parseInteger(summary.suspended) + contribution.suspended * multiplier),
    upgradeRequests: Math.max(0, parseInteger(summary.upgradeRequests) + contribution.upgradeRequests * multiplier),
    paymentAttention: Math.max(0, parseInteger(summary.paymentAttention) + contribution.paymentAttention * multiplier),
  };
}

function buildMemberDirectorySummaryFromRows(rows = []) {
  return rows.reduce(
    (summary, row) => addSummaryContribution(summary, getMemberDirectorySummaryContribution(row), 1),
    createEmptyMemberDirectorySummary()
  );
}

function normalizeMemberDirectorySummaryRecord(record = {}) {
  return {
    total: parseInteger(record.total),
    suspended: parseInteger(record.suspended),
    upgradeRequests: parseInteger(record.upgradeRequests),
    paymentAttention: parseInteger(record.paymentAttention),
    rebuiltAt: normalizeString(record.rebuiltAt),
    updatedAt: normalizeString(record.updatedAt),
    updatedBy: normalizeString(record.updatedBy),
    schemaVersion: parseInteger(record.schemaVersion),
  };
}

async function writeMemberDirectorySummary(hubId, summary, options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const writeModel = {
    ...createEmptyMemberDirectorySummary(),
    ...summary,
    rebuiltAt: normalizeString(options.rebuiltAt) || now,
    updatedAt: now,
    updatedBy: normalizeString(options.actorId) || "member-directory-summary",
    schemaVersion: MEMBER_DIRECTORY_SUMMARY_SCHEMA_VERSION,
  };

  await getMemberDirectorySummaryRef(normalizedHubId).set(writeModel, { merge: true });

  return normalizeMemberDirectorySummaryRecord(writeModel);
}

async function updateMemberDirectorySummaryForRowChange(hubId, previousRow, nextRow, actorId = "member-directory-row-maintenance") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const db = getFirebaseAdminDb();
  const summaryRef = getMemberDirectorySummaryRef(normalizedHubId);
  const previousContribution = previousRow ? getMemberDirectorySummaryContribution(previousRow) : createEmptyMemberDirectorySummary();
  const nextContribution = nextRow ? getMemberDirectorySummaryContribution(nextRow) : createEmptyMemberDirectorySummary();
  const now = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    const summarySnapshot = await transaction.get(summaryRef);

    if (!summarySnapshot.exists) {
      return null;
    }

    const current = normalizeMemberDirectorySummaryRecord(summarySnapshot.data());
    const nextSummary = addSummaryContribution(
      addSummaryContribution(current, previousContribution, -1),
      nextContribution,
      1
    );
    const writeModel = {
      ...nextSummary,
      rebuiltAt: current.rebuiltAt,
      updatedAt: now,
      updatedBy: normalizeString(actorId) || "member-directory-row-maintenance",
      schemaVersion: MEMBER_DIRECTORY_SUMMARY_SCHEMA_VERSION,
    };

    transaction.set(summaryRef, writeModel, { merge: true });

    return normalizeMemberDirectorySummaryRecord(writeModel);
  });
}

async function listMembershipRowsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getHubCollection(normalizedHubId, "memberships")
    .select("userId", "planId", "status", "paymentStatus", "startDate", "renewalDate", "createdAt", "updatedAt")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    hubId: normalizedHubId,
    ...doc.data(),
  }));
}

async function getLatestMembershipRowForUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return null;
  }

  const snapshot = await getHubCollection(normalizedHubId, "memberships")
    .where("userId", "==", normalizedUserId)
    .select("userId", "planId", "status", "paymentStatus", "startDate", "renewalDate", "createdAt", "updatedAt")
    .get();
  const rows = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      hubId: normalizedHubId,
      ...doc.data(),
    }))
    .sort((left, right) => getMembershipSortValue(right).localeCompare(getMembershipSortValue(left)));

  return rows[0] || null;
}

async function getMembershipPlansById(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return new Map();
  }

  const snapshot = await getHubCollection(normalizedHubId, "membershipPlans").get();

  return new Map(
    snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return [
        doc.id,
        {
          id: doc.id,
          title: normalizeString(data.title),
          isDefault: data.isDefault === true,
        },
      ];
    })
  );
}

async function getMembershipPlanById(hubId, planId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPlanId = normalizeString(planId);

  if (!normalizedHubId || !normalizedPlanId) {
    return null;
  }

  const snapshot = await getHubCollection(normalizedHubId, "membershipPlans").doc(normalizedPlanId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    title: normalizeString(data.title),
    isDefault: data.isDefault === true,
  };
}

async function listPendingUpgradeRequestUserIds(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const snapshot = await getHubCollection(normalizedHubId, "membershipUpgradeRequests")
    .where("status", "==", "pending")
    .select("userId")
    .get();

  return snapshot.docs.map((doc) => normalizeString(doc.data()?.userId)).filter(Boolean);
}

async function hasPendingUpgradeRequestForUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return false;
  }

  const snapshot = await getHubCollection(normalizedHubId, "membershipUpgradeRequests")
    .where("status", "==", "pending")
    .where("userId", "==", normalizedUserId)
    .limit(1)
    .get();

  return !snapshot.empty;
}

async function countUserPaymentAttentionItems(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return 0;
  }

  const snapshot = await getHubCollection(normalizedHubId, "paymentItems")
    .where("hubId", "==", normalizedHubId)
    .where("userId", "==", normalizedUserId)
    .get();

  return snapshot.docs.filter((doc) => normalizeString(doc.data()?.attentionStatus) === "action_required").length;
}

async function buildPaymentAttentionCountsByUser(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return new Map();
  }

  const snapshot = await getHubCollection(normalizedHubId, "paymentItems")
    .where("hubId", "==", normalizedHubId)
    .where("attentionStatus", "==", "action_required")
    .select("userId")
    .get();
  const counts = new Map();

  snapshot.docs.forEach((doc) => {
    const userId = normalizeString(doc.data()?.userId);

    if (userId) {
      counts.set(userId, (counts.get(userId) || 0) + 1);
    }
  });

  return counts;
}

function buildMembershipByUserId(memberships = [], plansById = new Map()) {
  const membershipsByUserId = new Map();

  memberships
    .slice()
    .sort((left, right) => getMembershipSortValue(right).localeCompare(getMembershipSortValue(left)))
    .forEach((membership) => {
      const userId = normalizeString(membership.userId);

      if (!userId || membershipsByUserId.has(userId)) {
        return;
      }

      const plan = plansById.get(normalizeString(membership.planId)) || null;
      membershipsByUserId.set(userId, {
        id: normalizeString(membership.id),
        planId: normalizeString(membership.planId),
        planTitle: normalizeString(plan?.title) || normalizeString(membership.planTitle),
        isDefault: plan?.isDefault === true,
        status: normalizeString(membership.status) || "active",
        paymentStatus: normalizeString(membership.paymentStatus),
      });
    });

  return membershipsByUserId;
}

function buildMemberDirectoryWriteModel({ user, membership = null, pendingUpgradeRequest = false, paymentAttentionCount = 0, now }) {
  const userId = normalizeString(user?.id);
  const displayName = normalizeString(user?.name) || normalizeLower(user?.email) || "Unnamed member";
  const email = normalizeLower(user?.email);
  const membershipPlanName = normalizeString(membership?.planTitle);
  const membershipType = membership ? (membership.isDefault ? "default" : "upgrade") : "none";
  const normalizedPaymentAttentionCount = parseInteger(paymentAttentionCount);

  return normalizeMemberDirectoryRecord({
    id: userId,
    hubId: user?.hubId,
    userId,
    memberId: userId,
    displayName,
    displayNameLower: normalizeLower(displayName),
    email,
    emailLower: email,
    status: user?.status || "active",
    role: user?.role || "member",
    membershipPlanId: membership?.planId,
    membershipPlanName,
    membershipStatus: membership?.status || (membership ? "active" : "none"),
    membershipType,
    pendingUpgradeRequest,
    paymentAttentionCount: normalizedPaymentAttentionCount,
    lastSignedInAt: user?.lastSignedInAt,
    lastActivityAt: user?.lastSignedInAt || user?.updatedAt || user?.createdAt,
    joinedAt: user?.createdAt,
    createdAt: user?.createdAt || now,
    updatedAt: now,
    rebuiltAt: now,
    schemaVersion: MEMBER_DIRECTORY_SCHEMA_VERSION,
    searchPrefixes: buildSearchPrefixes([displayName, email, membershipPlanName]),
  });
}

async function buildExpectedMemberDirectoryRows(hubId, now = new Date().toISOString()) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const [usersSnapshot, memberships, plansById, pendingUpgradeUserIds, paymentAttentionCounts] = await Promise.all([
    getUsersCollection()
      .where("hubId", "==", normalizedHubId)
      .where("role", "==", "member")
      .select("hubId", "role", "status", "email", "name", "createdAt", "lastSignedInAt", "updatedAt")
      .get(),
    listMembershipRowsByHub(normalizedHubId),
    getMembershipPlansById(normalizedHubId),
    listPendingUpgradeRequestUserIds(normalizedHubId),
    buildPaymentAttentionCountsByUser(normalizedHubId),
  ]);
  const membershipByUserId = buildMembershipByUserId(memberships, plansById);
  const pendingUpgradeUserIdSet = new Set(pendingUpgradeUserIds);

  return usersSnapshot.docs.map((doc) =>
    buildMemberDirectoryWriteModel({
      user: {
        id: doc.id,
        ...doc.data(),
      },
      membership: membershipByUserId.get(doc.id) || null,
      pendingUpgradeRequest: pendingUpgradeUserIdSet.has(doc.id),
      paymentAttentionCount: paymentAttentionCounts.get(doc.id) || 0,
      now,
    })
  );
}

async function rebuildMemberDirectoryForUserStrict(hubId, userId, actorId = "member-directory-sync") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return null;
  }

  const userSnapshot = await getUsersCollection().doc(normalizedUserId).get();
  const directoryRef = getMemberDirectoryCollection(normalizedHubId).doc(normalizedUserId);
  const previousSnapshot = await directoryRef.get();
  const previousRow = previousSnapshot.exists
    ? normalizeMemberDirectoryRecord({
        id: previousSnapshot.id,
        ...previousSnapshot.data(),
      })
    : null;

  if (!userSnapshot.exists) {
    await directoryRef.delete();
    await updateMemberDirectorySummaryForRowChange(normalizedHubId, previousRow, null, actorId);
    return null;
  }

  const user = {
    id: userSnapshot.id,
    ...userSnapshot.data(),
  };

  if (normalizeString(user.hubId) !== normalizedHubId || normalizeString(user.role) !== "member") {
    await directoryRef.delete();
    await updateMemberDirectorySummaryForRowChange(normalizedHubId, previousRow, null, actorId);
    return null;
  }

  const [membershipRow, pendingUpgradeRequest, paymentAttentionCount] = await Promise.all([
    getLatestMembershipRowForUser(normalizedHubId, normalizedUserId),
    hasPendingUpgradeRequestForUser(normalizedHubId, normalizedUserId),
    countUserPaymentAttentionItems(normalizedHubId, normalizedUserId),
  ]);
  const plan = membershipRow ? await getMembershipPlanById(normalizedHubId, membershipRow.planId) : null;
  const membership = membershipRow
    ? {
        id: normalizeString(membershipRow.id),
        planId: normalizeString(membershipRow.planId),
        planTitle: normalizeString(plan?.title),
        isDefault: plan?.isDefault === true,
        status: normalizeString(membershipRow.status) || "active",
        paymentStatus: normalizeString(membershipRow.paymentStatus),
      }
    : null;
  const now = new Date().toISOString();
  const writeModel = buildMemberDirectoryWriteModel({
    user,
    membership,
    pendingUpgradeRequest,
    paymentAttentionCount,
    now,
  });
  await directoryRef.set(
    {
      ...writeModel,
      updatedBy: normalizeString(actorId) || "member-directory-sync",
    },
    { merge: true }
  );
  await updateMemberDirectorySummaryForRowChange(normalizedHubId, previousRow, writeModel, actorId);

  return writeModel;
}

export async function rebuildMemberDirectoryForUser(hubId, userId, actorId = "member-directory-sync") {
  try {
    return await rebuildMemberDirectoryForUserStrict(hubId, userId, actorId);
  } catch (error) {
    console.warn("Member directory row maintenance failed", {
      hubId: normalizeString(hubId),
      userId: normalizeString(userId),
      actorId: normalizeString(actorId) || "member-directory-sync",
      error: String(error?.message || "Unable to rebuild member directory row."),
    });
    return null;
  }
}

export async function syncHubMemberDirectory(hubId, actorId = "member-directory-sync") {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const now = new Date().toISOString();
  const rows = await buildExpectedMemberDirectoryRows(normalizedHubId, now);
  const expectedIds = new Set(rows.map((row) => row.id).filter(Boolean));
  const existingSnapshot = await getMemberDirectoryCollection(normalizedHubId).select("userId").get();
  const collection = getMemberDirectoryCollection(normalizedHubId);
  let batch = getFirebaseAdminDb().batch();
  let batchCount = 0;
  let synced = 0;
  let orphaned = 0;

  for (const row of rows) {
    batch.set(
      collection.doc(row.id),
      {
        ...row,
        updatedBy: normalizeString(actorId) || "member-directory-sync",
      },
      { merge: true }
    );
    batchCount += 1;
    synced += 1;

    if (batchCount >= 450) {
      await batch.commit();
      batch = getFirebaseAdminDb().batch();
      batchCount = 0;
    }
  }

  for (const doc of existingSnapshot.docs) {
    if (expectedIds.has(doc.id)) {
      continue;
    }

    batch.delete(doc.ref);
    batchCount += 1;
    orphaned += 1;

    if (batchCount >= 450) {
      await batch.commit();
      batch = getFirebaseAdminDb().batch();
      batchCount = 0;
    }
  }

  if (batchCount) {
    await batch.commit();
  }
  const summary = await writeMemberDirectorySummary(
    normalizedHubId,
    buildMemberDirectorySummaryFromRows(rows),
    {
      actorId,
      rebuiltAt: now,
      updatedAt: now,
    }
  );

  return {
    hubId: normalizedHubId,
    synced,
    scanned: rows.length,
    orphaned,
    summary,
    generatedAt: now,
  };
}

export async function syncMemberDirectoryPaymentAttentionForUser(hubId, userId, actorId = "payment-item-write") {
  return rebuildMemberDirectoryForUser(hubId, userId, actorId);
}

async function countQuery(query) {
  const snapshot = await query.count().get();
  return parseInteger(snapshot.data().count);
}

export async function getMemberDirectorySummaryByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return {
      total: 0,
      suspended: 0,
      upgradeRequests: 0,
      paymentAttention: 0,
    };
  }

  const summarySnapshot = await getMemberDirectorySummaryRef(normalizedHubId).get();

  if (summarySnapshot.exists) {
    return normalizeMemberDirectorySummaryRecord(summarySnapshot.data());
  }

  const baseQuery = getMemberDirectoryCollection(normalizedHubId).where("hubId", "==", normalizedHubId);
  const [total, suspended, upgradeRequests, paymentAttention] = await Promise.all([
    countQuery(baseQuery),
    countQuery(baseQuery.where("status", "==", "suspended")),
    countQuery(baseQuery.where("attentionStatus", "==", "upgrade_request")),
    countQuery(baseQuery.where("attentionStatus", "==", "payment_attention")),
  ]);

  return {
    total,
    suspended,
    upgradeRequests,
    paymentAttention,
  };
}

function applyMemberDirectoryQueryFilters(query, filters) {
  let nextQuery = query;

  if (filters.status !== "all") {
    nextQuery = nextQuery.where("status", "==", filters.status);
  }

  if (filters.membership !== "all") {
    nextQuery = nextQuery.where("membershipType", "==", filters.membership);
  }

  if (filters.attention !== "all") {
    nextQuery = nextQuery.where("attentionStatus", "==", filters.attention);
  }

  if (filters.q) {
    nextQuery = nextQuery.where("searchPrefixes", "array-contains", filters.q);
  }

  return nextQuery;
}

function normalizePageSize(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Math.min(Math.max(Number.isFinite(numeric) ? numeric : 10, 5), 50);
}

export function normalizeMemberDirectoryFilters(options = {}) {
  const status = normalizeString(options.status);
  const membership = normalizeString(options.membership);
  const attention = normalizeString(options.attention);
  const q = normalizeLower(options.q).slice(0, 32);

  return {
    status: ["active", "suspended"].includes(status) ? status : "all",
    membership: ["default", "upgrade", "none"].includes(membership) ? membership : "all",
    attention: ["upgrade_request", "payment_attention", "all_clear"].includes(attention) ? attention : "all",
    q,
    limit: normalizePageSize(options.limit),
    cursor: normalizeString(options.cursor),
  };
}

export async function listMemberDirectoryPageByHubId(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const filters = normalizeMemberDirectoryFilters(options);
  const cursor = decodeMemberDirectoryCursor(filters.cursor);

  if (!normalizedHubId || !isReadModelEnabled()) {
    return { items: [], nextCursor: "", hasMore: false, filters };
  }

  let query = applyMemberDirectoryQueryFilters(
    getMemberDirectoryCollection(normalizedHubId).where("hubId", "==", normalizedHubId),
    filters
  );

  query = query.orderBy("displayNameLower", "asc").orderBy(FieldPath.documentId(), "asc");

  if (cursor) {
    query = query.startAfter(cursor.displayNameLower, cursor.id);
  }

  const snapshot = await query.limit(filters.limit + 1).get();
  const docs = snapshot.docs.slice(0, filters.limit);
  const items = docs.map((doc) =>
    normalizeMemberDirectoryRecord({
      id: doc.id,
      ...doc.data(),
    })
  );
  const lastItem = items[items.length - 1];

  return {
    items,
    nextCursor: snapshot.docs.length > filters.limit ? encodeMemberDirectoryCursor(lastItem) : "",
    hasMore: snapshot.docs.length > filters.limit,
    filters,
  };
}

export function isMemberDirectoryReadModelEnabled() {
  return isReadModelEnabled();
}

export async function listMemberDirectoryExportRowsByHubId(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const filters = normalizeMemberDirectoryFilters({
    ...options,
    limit: 50,
  });
  const maxRows = Math.min(Math.max(parseInteger(options.maxRows) || 5000, 1), 10000);

  if (!normalizedHubId) {
    return [];
  }

  const query = applyMemberDirectoryQueryFilters(
    getMemberDirectoryCollection(normalizedHubId).where("hubId", "==", normalizedHubId),
    filters
  )
    .orderBy("displayNameLower", "asc")
    .orderBy(FieldPath.documentId(), "asc")
    .limit(maxRows);
  const snapshot = await query.get();

  return snapshot.docs.map((doc) =>
    normalizeMemberDirectoryRecord({
      id: doc.id,
      ...doc.data(),
    })
  );
}

function getComparableMemberDirectoryFields(row = {}) {
  const normalized = normalizeMemberDirectoryRecord(row);

  return {
    displayName: normalized.displayName,
    email: normalized.email,
    status: normalized.status,
    membershipPlanId: normalized.membershipPlanId,
    membershipPlanName: normalized.membershipPlanName,
    membershipStatus: normalized.membershipStatus,
    membershipType: normalized.membershipType,
    pendingUpgradeRequest: normalized.pendingUpgradeRequest,
    paymentAttentionCount: normalized.paymentAttentionCount,
    attentionStatus: normalized.attentionStatus,
  };
}

function getChangedMemberDirectoryFields(expected, actual) {
  const expectedComparable = getComparableMemberDirectoryFields(expected);
  const actualComparable = getComparableMemberDirectoryFields(actual);

  return Object.keys(expectedComparable).filter((key) => expectedComparable[key] !== actualComparable[key]);
}

export async function getHubMemberDirectoryReconciliationReport(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const issueLimit = Math.min(Math.max(parseInteger(options.issueLimit) || 25, 1), 100);

  if (!normalizedHubId) {
    return {
      generatedAt: new Date().toISOString(),
      totalIssues: 0,
      summary: [],
      issues: [],
    };
  }

  const [expectedRows, actualSnapshot] = await Promise.all([
    buildExpectedMemberDirectoryRows(normalizedHubId),
    getMemberDirectoryCollection(normalizedHubId).get(),
  ]);
  const expectedById = new Map(expectedRows.map((row) => [row.id, row]));
  const actualRows = actualSnapshot.docs.map((doc) =>
    normalizeMemberDirectoryRecord({
      id: doc.id,
      ...doc.data(),
    })
  );
  const actualById = new Map(actualRows.map((row) => [row.id, row]));
  const issues = [];

  expectedRows.forEach((expected) => {
    const actual = actualById.get(expected.id);

    if (!actual) {
      issues.push({
        code: "missing_directory_row",
        severity: "repairable",
        userId: expected.id,
        title: "Missing member directory row",
        detail: "A source member exists but has no projected member directory row.",
      });
      return;
    }

    const changedFields = getChangedMemberDirectoryFields(expected, actual);

    if (changedFields.length) {
      issues.push({
        code: "stale_directory_row",
        severity: "repairable",
        userId: expected.id,
        title: "Stale member directory row",
        detail: `Projected fields differ from source data: ${changedFields.join(", ")}.`,
      });
    }
  });

  actualRows.forEach((actual) => {
    if (expectedById.has(actual.id)) {
      return;
    }

    issues.push({
      code: "orphan_directory_row",
      severity: "repairable",
      userId: actual.id,
      title: "Orphaned member directory row",
      detail: "A projected member directory row exists without a matching source member.",
    });
  });

  const summaryByCode = new Map();
  issues.forEach((issue) => {
    const current = summaryByCode.get(issue.code) || {
      code: issue.code,
      title: issue.title,
      count: 0,
    };

    current.count += 1;
    summaryByCode.set(issue.code, current);
  });

  return {
    generatedAt: new Date().toISOString(),
    totalIssues: issues.length,
    expectedRows: expectedRows.length,
    actualRows: actualRows.length,
    summary: [...summaryByCode.values()],
    issues: issues.slice(0, issueLimit),
  };
}

export async function repairHubMemberDirectoryReconciliation(hubId, actorId = "member-directory-repair") {
  return syncHubMemberDirectory(hubId, actorId);
}
