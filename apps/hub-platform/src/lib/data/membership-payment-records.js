try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { assertMembershipPaymentStatusUpdate } from "@/lib/domain/memberships";
import { listPaymentRecordsByUser } from "@/lib/data/payment-records";
import {
  buildMembershipPaymentRecordId,
  getMembershipPlansByIds,
  normalizeMembershipPaymentRecord,
  normalizeMembershipRecord,
  normalizeString,
  syncMembershipPaymentRecordToLedger,
  upsertMembershipPaymentRecord,
} from "./membership-shared.js";
import { listUsersByHub } from "./user-queries.js";
import { getCurrentMembershipByUser } from "./membership-user-records.js";

function mapMembershipRowToHistoryItem(row, currentMembership) {
  const currentRecordId = currentMembership
    ? buildMembershipPaymentRecordId(currentMembership.id, currentMembership.renewalDate, currentMembership.startDate)
    : "";
  const isCurrentCycle = Boolean(currentRecordId) && row.id === currentRecordId;
  const isHistorical = !isCurrentCycle;
  const isPreviousAssignment =
    Boolean(currentMembership?.id) &&
    row.membershipId &&
    row.membershipId !== currentMembership.id;

  return {
    ...row,
    kind: "membership_cycle",
    isCurrentCycle,
    isHistorical,
    historyLabel: isCurrentCycle
      ? "Current cycle"
      : isPreviousAssignment
        ? "Previous assignment"
        : "Previous cycle",
    historyTone: isCurrentCycle ? "accent" : "neutral",
    detailLabel: "Membership duration",
    detailValue: row.paymentDate,
    detailEndValue: row.renewalDate,
  };
}

function mapLedgerUpgradeToHistoryItem(record) {
  return {
    id: `ledger_${record.id}`,
    recordId: record.id,
    kind: "membership_upgrade",
    userId: record.userId,
    membershipId: record.membershipId,
    title: record.title || "Membership upgrade",
    pricingMode: record.amountMinor > 0 ? "paid" : "free",
    amount: record.amountDisplay,
    currency: record.currency,
    paymentStatus: record.financialStatus || "unpaid",
    paymentDate: record.paidAt || record.occurredAt || record.updatedAt || record.createdAt,
    renewalDate: "",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isCurrentCycle: false,
    isHistorical: true,
    historyLabel: "Upgrade payment",
    historyTone: record.financialStatus === "paid" ? "success" : "neutral",
    detailLabel: "Payment date",
    detailValue: record.paidAt || record.occurredAt || record.updatedAt || record.createdAt,
    detailEndValue: "",
  };
}

function normalizeMembershipCommercialTitle(title) {
  return normalizeString(title).replace(/\s+upgrade$/i, "");
}

function buildMembershipPaymentMatchKey({
  userId = "",
  title = "",
  amount = "",
  amountDisplay = "",
  currency = "",
  paymentStatus = "",
  financialStatus = "",
} = {}) {
  return [
    normalizeString(userId),
    normalizeMembershipCommercialTitle(title),
    normalizeString(amount || amountDisplay),
    normalizeString(currency).toUpperCase(),
    normalizeString(paymentStatus || financialStatus),
  ].join("::");
}

export async function getMembershipPaymentRecordById(hubId, paymentRecordId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedPaymentRecordId = normalizeString(paymentRecordId);

  if (!normalizedHubId || !normalizedPaymentRecordId) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipPayments")
    .doc(normalizedPaymentRecordId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeMembershipPaymentRecord({
    id: snapshot.id,
    hubId: normalizedHubId,
    ...snapshot.data(),
  });
}

export async function listMembershipPaymentItemsByHub(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return [];
  }

  const [snapshot, users] = await Promise.all([
    getFirebaseAdminDb()
      .collection("hubs")
      .doc(normalizedHubId)
      .collection("membershipPayments")
      .get(),
    listUsersByHub(normalizedHubId),
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));

  return snapshot.docs
    .map((doc) => normalizeMembershipPaymentRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() }))
    .filter(Boolean)
    .map((row) => {
      const user = usersById.get(row.userId);

      return {
        ...row,
        userName: normalizeString(user?.name),
        userEmail: normalizeString(user?.email).toLowerCase(),
      };
    })
    .sort((left, right) =>
      String(right.paymentDate || right.updatedAt || right.createdAt || "").localeCompare(
        String(left.paymentDate || left.updatedAt || left.createdAt || "")
      )
    );
}

export async function listMembershipPaymentHistoryByUser(hubId, userId) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedUserId = normalizeString(userId);

  if (!normalizedHubId || !normalizedUserId) {
    return [];
  }

  const [snapshot, currentMembership, paymentRecords] = await Promise.all([
    getFirebaseAdminDb()
      .collection("hubs")
      .doc(normalizedHubId)
      .collection("membershipPayments")
      .where("userId", "==", normalizedUserId)
      .get(),
    getCurrentMembershipByUser(normalizedHubId, normalizedUserId),
    listPaymentRecordsByUser(normalizedHubId, normalizedUserId),
  ]);

  const rows = snapshot.docs
    .map((doc) => normalizeMembershipPaymentRecord({ id: doc.id, hubId: normalizedHubId, ...doc.data() }))
    .filter(Boolean);

  if (!rows.length && currentMembership) {
    rows.push(
      normalizeMembershipPaymentRecord({
        id: buildMembershipPaymentRecordId(
          currentMembership.id,
          currentMembership.renewalDate,
          currentMembership.startDate
        ),
        hubId: normalizedHubId,
        userId: normalizedUserId,
        membershipId: currentMembership.id,
        planId: currentMembership.planId,
        title: currentMembership.planTitle,
        pricingMode: currentMembership.pricingMode,
        amount: currentMembership.planPrice,
        currency: currentMembership.planCurrency,
        paymentStatus: currentMembership.paymentStatus,
        paymentDate: currentMembership.startDate,
        renewalDate: currentMembership.renewalDate,
        createdAt: currentMembership.createdAt,
        updatedAt: currentMembership.updatedAt,
      })
    );
  }

  const ledgerUpgradeRows = paymentRecords
    .filter((record) => normalizeString(record.kind) === "membership_upgrade")
    .filter((record) => normalizeString(record.reportingEligibility) !== "informational_only")
    .map(mapLedgerUpgradeToHistoryItem);
  const nativeUpgradePaymentKeys = new Set(
    ledgerUpgradeRows
      .filter((record) => normalizeString(record.paymentStatus) === "paid")
      .map((record) => buildMembershipPaymentMatchKey(record))
  );
  const membershipHistoryRows = rows
    .map((row) => mapMembershipRowToHistoryItem(row, currentMembership))
    .filter((row) => !nativeUpgradePaymentKeys.has(buildMembershipPaymentMatchKey(row)));

  return [...membershipHistoryRows, ...ledgerUpgradeRows]
    .sort((left, right) => {
      if (left.isCurrentCycle && !right.isCurrentCycle) {
        return -1;
      }

      if (!left.isCurrentCycle && right.isCurrentCycle) {
        return 1;
      }

      return String(right.paymentDate || right.updatedAt || "").localeCompare(String(left.paymentDate || left.updatedAt || ""));
    });
}

export async function updateMembershipPaymentStatus(hubId, membershipId, nextPaymentStatus, actorId = "system") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedMembershipId = normalizeString(membershipId);
  const normalizedPaymentStatus = normalizeString(nextPaymentStatus).toLowerCase();

  if (!normalizedHubId || !normalizedMembershipId) {
    throw new Error("Hub id and membership id are required.");
  }

  if (!["paid", "unpaid", "overdue", "failed", "not_required"].includes(normalizedPaymentStatus)) {
    throw new Error("A valid membership payment status is required.");
  }

  const ref = getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).collection("memberships").doc(normalizedMembershipId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Membership not found.");
  }

  const current = normalizeMembershipRecord({ id: existing.id, hubId: normalizedHubId, ...existing.data() });
  const planDocs = await getMembershipPlansByIds(normalizedHubId, [current.planId]);
  const plan = planDocs.get(current.planId);
  const paymentStatus = assertMembershipPaymentStatusUpdate(plan, normalizedPaymentStatus);
  const update = {
    paymentStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeString(actorId),
  };

  await ref.set(update, { merge: true });
  await upsertMembershipPaymentRecord({
    hubId: normalizedHubId,
    membershipId: normalizedMembershipId,
    userId: current.userId,
    paymentStatus,
    renewalDate: current.renewalDate,
    startDate: current.startDate,
    plan,
    paymentDate: paymentStatus === "paid" ? update.updatedAt : "",
    actorId,
  });

  return normalizeMembershipRecord({ ...current, ...update });
}

export async function backfillMembershipPaymentRecordsToLedger(hubId, actorId = "ledger-backfill") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedActorId = normalizeString(actorId) || "ledger-backfill";
  const since = normalizeString(arguments[2]?.since);

  if (!normalizedHubId) {
    return { total: 0, synced: 0 };
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection("membershipPayments")
    .get();

  let synced = 0;
  let scanned = 0;
  let skipped = 0;
  let latestSourceTimestamp = "";

  for (const doc of snapshot.docs) {
    const record = normalizeMembershipPaymentRecord({
      id: doc.id,
      hubId: normalizedHubId,
      ...doc.data(),
    });

    if (!record) {
      continue;
    }

    scanned += 1;
    const candidateTimestamp = normalizeString(record.updatedAt || record.paymentDate || record.createdAt);
    if (candidateTimestamp && (!latestSourceTimestamp || candidateTimestamp > latestSourceTimestamp)) {
      latestSourceTimestamp = candidateTimestamp;
    }

    if (since && candidateTimestamp && candidateTimestamp <= since) {
      skipped += 1;
      continue;
    }

    await syncMembershipPaymentRecordToLedger({
      hubId: normalizedHubId,
      membershipPaymentRecord: record,
      actorId: normalizedActorId,
    });
    synced += 1;
  }

  return {
    total: snapshot.size,
    scanned,
    synced,
    skipped,
    latestSourceTimestamp,
  };
}
