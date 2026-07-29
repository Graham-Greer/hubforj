try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { backfillMembershipPaymentRecordsToLedger } from "@/lib/data/memberships";
import { backfillNativeMembershipUpgradeTransactionsToLedger } from "@/lib/data/native-payment-transactions";

function normalizeString(value) {
  return String(value || "").trim();
}

function getPaymentLedgerSyncStatusRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("system").doc("paymentLedgerSync");
}

export async function getHubPaymentLedgerSyncStatus(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const snapshot = await getPaymentLedgerSyncStatusRef(normalizedHubId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() || {};

  return {
    lastStartedAt: normalizeString(data.lastStartedAt),
    lastCompletedAt: normalizeString(data.lastCompletedAt),
    lastActorId: normalizeString(data.lastActorId),
    lastStatus: normalizeString(data.lastStatus),
    lastMode: normalizeString(data.lastMode),
    lastSince: normalizeString(data.lastSince),
    membershipPaymentsTotal: Number.parseInt(String(data.membershipPaymentsTotal || ""), 10) || 0,
    membershipPaymentsScanned: Number.parseInt(String(data.membershipPaymentsScanned || ""), 10) || 0,
    membershipPaymentsSynced: Number.parseInt(String(data.membershipPaymentsSynced || ""), 10) || 0,
    membershipPaymentsSkipped: Number.parseInt(String(data.membershipPaymentsSkipped || ""), 10) || 0,
    membershipPaymentsLatestSourceTimestamp: normalizeString(data.membershipPaymentsLatestSourceTimestamp),
    nativeMembershipUpgradesTotal: Number.parseInt(String(data.nativeMembershipUpgradesTotal || ""), 10) || 0,
    nativeMembershipUpgradesScanned: Number.parseInt(String(data.nativeMembershipUpgradesScanned || ""), 10) || 0,
    nativeMembershipUpgradesSynced: Number.parseInt(String(data.nativeMembershipUpgradesSynced || ""), 10) || 0,
    nativeMembershipUpgradesSkipped: Number.parseInt(String(data.nativeMembershipUpgradesSkipped || ""), 10) || 0,
    nativeMembershipUpgradesLatestSourceTimestamp: normalizeString(data.nativeMembershipUpgradesLatestSourceTimestamp),
    lastError: normalizeString(data.lastError),
  };
}

export async function syncHubPaymentLedger(hubId, actorId = "ledger-sync") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedActorId = normalizeString(actorId) || "ledger-sync";

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const startedAt = new Date().toISOString();
  const previousStatus = await getHubPaymentLedgerSyncStatus(normalizedHubId);
  const since =
    normalizeString(previousStatus?.lastStatus) === "completed"
      ? normalizeString(previousStatus?.lastCompletedAt)
      : "";
  const mode = since ? "incremental" : "full";

  await getPaymentLedgerSyncStatusRef(normalizedHubId).set(
    {
      lastStartedAt: startedAt,
      lastActorId: normalizedActorId,
      lastStatus: "running",
      lastMode: mode,
      lastSince: since,
      lastError: "",
    },
    { merge: true }
  );

  try {
    const [membershipPayments, nativeMembershipUpgrades] = await Promise.all([
      backfillMembershipPaymentRecordsToLedger(normalizedHubId, normalizedActorId, { since }),
      backfillNativeMembershipUpgradeTransactionsToLedger(normalizedHubId, normalizedActorId, { since }),
    ]);
    const completedAt = new Date().toISOString();

    await getPaymentLedgerSyncStatusRef(normalizedHubId).set(
      {
        lastStartedAt: startedAt,
        lastCompletedAt: completedAt,
        lastActorId: normalizedActorId,
        lastStatus: "completed",
        lastMode: mode,
        lastSince: since,
        membershipPaymentsTotal: membershipPayments.total,
        membershipPaymentsScanned: membershipPayments.scanned,
        membershipPaymentsSynced: membershipPayments.synced,
        membershipPaymentsSkipped: membershipPayments.skipped,
        membershipPaymentsLatestSourceTimestamp: membershipPayments.latestSourceTimestamp,
        nativeMembershipUpgradesTotal: nativeMembershipUpgrades.total,
        nativeMembershipUpgradesScanned: nativeMembershipUpgrades.scanned,
        nativeMembershipUpgradesSynced: nativeMembershipUpgrades.synced,
        nativeMembershipUpgradesSkipped: nativeMembershipUpgrades.skipped,
        nativeMembershipUpgradesLatestSourceTimestamp: nativeMembershipUpgrades.latestSourceTimestamp,
        lastError: "",
      },
      { merge: true }
    );

    return {
      membershipPayments,
      nativeMembershipUpgrades,
      status: {
        lastStartedAt: startedAt,
        lastCompletedAt: completedAt,
        lastActorId: normalizedActorId,
        lastStatus: "completed",
        lastMode: mode,
        lastSince: since,
      },
    };
  } catch (error) {
    await getPaymentLedgerSyncStatusRef(normalizedHubId).set(
      {
        lastStartedAt: startedAt,
        lastActorId: normalizedActorId,
        lastStatus: "failed",
        lastMode: mode,
        lastSince: since,
        lastError: String(error?.message || "Unable to sync payment ledger."),
      },
      { merge: true }
    );
    throw error;
  }
}
