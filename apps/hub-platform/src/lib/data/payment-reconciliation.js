try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { listPendingMembershipUpgradeRequestsByHub } from "@/lib/data/memberships";
import { listPaymentRecordsByHub, updatePaymentRecord } from "@/lib/data/payment-records";
import {
  buildPaymentItemDocumentIdFromPaymentRecord,
  deletePaymentItemById,
  listPaymentItemsByHubId,
  PAYMENT_ITEM_SCHEMA_VERSION,
  upsertPaymentItemFromPaymentRecord,
} from "@/lib/data/payment-items";
import { listNativePaymentTransactionsByHub, updateNativePaymentTransaction } from "@/lib/data/native-payment-transactions";
import { listEventBookingPaymentItemsByHub } from "@/lib/data/event-bookings";
import { listCoursePaymentItemsByHub } from "@/lib/data/course-registrations";
import { rebuildPaymentSummaryFromPaymentItems } from "@/lib/data/payment-summary";
import { listUsersByHub } from "@/lib/data/user-queries";

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function pushIssue(issues, code, severity, title, detail, refs = {}) {
  issues.push({
    code,
    severity,
    title,
    detail,
    refs,
  });
}

function mapTransactionStatusToExpectedPaymentStatus(status) {
  const normalizedStatus = normalizeString(status);

  if (normalizedStatus === "payment_received") {
    return "paid";
  }

  if (normalizedStatus === "payment_failed") {
    return "failed";
  }

  if (normalizedStatus === "checkout_cancelled") {
    return "unpaid";
  }

  return "";
}

function mapPaymentRecordKindToPaymentItemType(record = {}) {
  const kind = normalizeString(record.kind);
  const sourceType = normalizeString(record.sourceType);

  if (kind === "event_booking" || kind === "event_registration" || sourceType === "eventBooking") {
    return "eventBooking";
  }

  if (kind === "course_registration" || sourceType === "courseRegistration") {
    return "courseRegistration";
  }

  if (kind === "membership_upgrade" || sourceType === "membershipUpgradeRequest") {
    return "upgradeRequest";
  }

  return "membership";
}

function resolvePaymentItemSortAt(record = {}) {
  return (
    normalizeString(record.paidAt) ||
    normalizeString(record.refundedAt) ||
    normalizeString(record.dueAt) ||
    normalizeString(record.occurredAt) ||
    normalizeString(record.updatedAt) ||
    normalizeString(record.createdAt)
  );
}

function buildWorkflowItemsByPaymentRecordSource(items = []) {
  const bySource = new Map();

  for (const item of items) {
    const recordId = normalizeString(item.recordId);

    if (recordId) {
      bySource.set(recordId, item);
    }
  }

  return bySource;
}

function inferRepairPaidAt(record = {}, helpers = {}) {
  if (normalizeString(record.financialStatus) !== "paid" || normalizeString(record.paidAt)) {
    return "";
  }

  const nativeTransaction = normalizeString(record.nativeTransactionId)
    ? helpers.nativeTransactionsById?.get(normalizeString(record.nativeTransactionId))
    : null;
  const nativePaidAt = normalizeString(nativeTransaction?.paymentReceivedAt);

  if (nativePaidAt) {
    return nativePaidAt;
  }

  const sourceType = normalizeString(record.sourceType);
  const sourceId = normalizeString(record.sourceId);

  if (sourceType === "eventBooking" || normalizeString(record.kind) === "event_booking") {
    return normalizeString(helpers.eventItemsBySourceId?.get(sourceId)?.paymentCompletedAt);
  }

  if (sourceType === "courseRegistration" || normalizeString(record.kind) === "course_registration") {
    return normalizeString(helpers.courseItemsBySourceId?.get(sourceId)?.paymentCompletedAt);
  }

  if (sourceType === "membershipPayment" || normalizeString(record.kind) === "membership_cycle") {
    return normalizeString(record.occurredAt) || normalizeString(record.createdAt) || normalizeString(record.updatedAt);
  }

  return "";
}

function pushProjectionMismatch(issues, field, paymentRecord, paymentItem, expected, actual) {
  pushIssue(
    issues,
    "payment_item_projection_mismatch",
    "danger",
    "Payment item projection does not match its payment record",
    `The projected payment item has a stale or incorrect ${field} value.`,
    {
      paymentRecordId: paymentRecord.id,
      paymentItemId: paymentItem.id,
      field,
      expected,
      actual,
    }
  );
}

function buildIssueSummary(issues = []) {
  const byCode = new Map();

  for (const issue of issues) {
    const current = byCode.get(issue.code) || {
      code: issue.code,
      severity: issue.severity,
      title: issue.title,
      count: 0,
    };

    current.count += 1;
    if (current.severity !== "danger" && issue.severity === "danger") {
      current.severity = "danger";
    } else if (current.severity === "neutral" && issue.severity === "warning") {
      current.severity = "warning";
    }

    byCode.set(issue.code, current);
  }

  return [...byCode.values()].sort((left, right) => right.count - left.count || left.title.localeCompare(right.title));
}

export async function getHubPaymentReconciliationReport(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return {
      generatedAt: new Date().toISOString(),
      totalIssues: 0,
      summary: [],
      issues: [],
    };
  }

  const [paymentRecords, paymentItems, nativeTransactions, eventItems, courseItems, pendingUpgradeRequests, users] = await Promise.all([
    listPaymentRecordsByHub(normalizedHubId),
    listPaymentItemsByHubId(normalizedHubId),
    listNativePaymentTransactionsByHub(normalizedHubId),
    listEventBookingPaymentItemsByHub(normalizedHubId),
    listCoursePaymentItemsByHub(normalizedHubId),
    listPendingMembershipUpgradeRequestsByHub(normalizedHubId),
    listUsersByHub(normalizedHubId),
  ]);

  const issues = [];
  const paymentRecordsById = new Map(paymentRecords.map((record) => [normalizeString(record.id), record]));
  const paymentItemsById = new Map(paymentItems.map((item) => [normalizeString(item.id), item]));
  const paymentRecordsByNativeTransactionId = new Map(
    paymentRecords
      .filter((record) => normalizeString(record.nativeTransactionId))
      .map((record) => [normalizeString(record.nativeTransactionId), record])
  );
  const nativeTransactionsById = new Map(nativeTransactions.map((transaction) => [normalizeString(transaction.id), transaction]));
  const usersById = new Map(users.map((user) => [normalizeString(user.id), user]));

  for (const record of paymentRecords) {
    const paymentRecordId = normalizeString(record.id);
    const expectedPaymentItemId = buildPaymentItemDocumentIdFromPaymentRecord(paymentRecordId);
    const paymentItem = paymentItemsById.get(expectedPaymentItemId);

    if (!paymentItem) {
      pushIssue(
        issues,
        "payment_item_missing_projection",
        "danger",
        "Payment record is missing its projected payment item",
        "This canonical payment record does not have a matching read-model payment item.",
        {
          paymentRecordId,
          expectedPaymentItemId,
          kind: record.kind,
          sourceType: record.sourceType,
          sourceId: record.sourceId,
        }
      );
      continue;
    }

    if (normalizeString(record.financialStatus) === "paid" && !normalizeString(record.paidAt)) {
      pushIssue(
        issues,
        "paid_payment_record_missing_paid_at",
        "danger",
        "Paid payment record is missing paid date",
        "This canonical payment record is marked paid but does not have a paidAt timestamp. The admin ledger cannot safely show an actual paid date until this is repaired.",
        {
          paymentRecordId,
          kind: record.kind,
          sourceType: record.sourceType,
          sourceId: record.sourceId,
          dueAt: record.dueAt,
          occurredAt: record.occurredAt,
        }
      );
    }

    const expectedValues = {
      paymentRecordId,
      sourceCollection: "paymentRecords",
      hubId: normalizedHubId,
      userId: normalizeString(record.userId),
      memberId: normalizeString(record.userId),
      type: mapPaymentRecordKindToPaymentItemType(record),
      status: normalizeString(record.operationalStatus),
      paymentStatus: normalizeString(record.financialStatus),
      amountMinor: parseInteger(record.amountMinor),
      currency: normalizeString(record.currency).toUpperCase(),
      reportingEligibility: normalizeString(record.reportingEligibility),
      sourceConfidence: normalizeString(record.sourceConfidence),
      occurredAt: normalizeString(record.occurredAt),
      paidAt: normalizeString(record.paidAt),
      dueAt: normalizeString(record.dueAt),
      sortAt: resolvePaymentItemSortAt(record),
      schemaVersion: PAYMENT_ITEM_SCHEMA_VERSION,
    };
    const actualValues = {
      paymentRecordId: normalizeString(paymentItem.paymentRecordId),
      sourceCollection: normalizeString(paymentItem.sourceCollection),
      hubId: normalizeString(paymentItem.hubId),
      userId: normalizeString(paymentItem.userId),
      memberId: normalizeString(paymentItem.memberId),
      type: normalizeString(paymentItem.type),
      status: normalizeString(paymentItem.status),
      paymentStatus: normalizeString(paymentItem.paymentStatus),
      amountMinor: parseInteger(paymentItem.amountMinor),
      currency: normalizeString(paymentItem.currency).toUpperCase(),
      reportingEligibility: normalizeString(paymentItem.reportingEligibility),
      sourceConfidence: normalizeString(paymentItem.sourceConfidence),
      occurredAt: normalizeString(paymentItem.occurredAt),
      paidAt: normalizeString(paymentItem.paidAt),
      dueAt: normalizeString(paymentItem.dueAt),
      sortAt: normalizeString(paymentItem.sortAt),
      schemaVersion: parseInteger(paymentItem.schemaVersion),
    };

    for (const [field, expected] of Object.entries(expectedValues)) {
      const actual = actualValues[field];

      if (normalizeString(expected) !== normalizeString(actual)) {
        pushProjectionMismatch(issues, field, record, paymentItem, expected, actual);
      }
    }

    if (normalizeString(paymentItem.paymentStatus) === "paid" && !normalizeString(paymentItem.paidAt)) {
      pushIssue(
        issues,
        "paid_payment_item_missing_paid_at",
        "danger",
        "Paid payment item is missing paid date",
        "This projected payment item is marked paid but does not have a paidAt timestamp. It should be repaired from the canonical payment record/source transaction.",
        {
          paymentRecordId,
          paymentItemId: paymentItem.id,
          sortAt: paymentItem.sortAt,
          dueAt: paymentItem.dueAt,
        }
      );
    }

    const user = usersById.get(normalizeString(paymentItem.userId));

    if (user && !normalizeString(paymentItem.displayName) && !normalizeString(paymentItem.email)) {
      pushIssue(
        issues,
        "payment_item_missing_member_identity",
        "warning",
        "Payment item is missing member identity",
        "This projected payment item points to an existing hub user but does not include the denormalized member name or email used by the payments table.",
        {
          paymentRecordId,
          paymentItemId: paymentItem.id,
          userId: paymentItem.userId,
          userStatus: user.status,
        }
      );
    }
  }

  for (const item of paymentItems) {
    const paymentRecordId = normalizeString(item.paymentRecordId);

    if (normalizeString(item.sourceCollection) !== "paymentRecords") {
      continue;
    }

    if (!paymentRecordId || !paymentRecordsById.has(paymentRecordId)) {
      pushIssue(
        issues,
        "payment_item_orphan_projection",
        "warning",
        "Payment item points to a missing payment record",
        "This projected payment item references a canonical payment record that was not found.",
        {
          paymentItemId: item.id,
          paymentRecordId,
          sourceId: item.sourceId,
          type: item.type,
        }
      );
    }
  }

  for (const transaction of nativeTransactions) {
    const transactionId = normalizeString(transaction.id);
    const linkedRecordId = normalizeString(transaction.paymentRecordId);
    const linkedRecord = linkedRecordId ? paymentRecordsById.get(linkedRecordId) : null;
    const inferredRecord = paymentRecordsByNativeTransactionId.get(transactionId);

    if (!linkedRecordId) {
      pushIssue(
        issues,
        "transaction_missing_payment_record_link",
        "warning",
        "Native transaction is missing a ledger link",
        "This Stripe-native transaction does not point at a payment record.",
        { transactionId, kind: transaction.kind }
      );
    }

    if (!linkedRecord && inferredRecord) {
      pushIssue(
        issues,
        "transaction_missing_payment_record_link",
        "warning",
        "Native transaction is missing a ledger link",
        "A ledger record exists for this transaction, but the transaction itself is not linked back to it.",
        { transactionId, paymentRecordId: inferredRecord.id, kind: transaction.kind }
      );
    }

    if (linkedRecord && normalizeString(linkedRecord.nativeTransactionId) !== transactionId) {
      pushIssue(
        issues,
        "transaction_payment_record_mismatch",
        "danger",
        "Transaction and ledger record disagree about linkage",
        "The transaction points to a payment record whose native transaction id does not match.",
        { transactionId, paymentRecordId: linkedRecord.id, recordNativeTransactionId: linkedRecord.nativeTransactionId }
      );
    }
  }

  for (const record of paymentRecords) {
    const nativeTransactionId = normalizeString(record.nativeTransactionId);

    if (normalizeString(record.paymentMode) === "native" && !nativeTransactionId) {
      pushIssue(
        issues,
        "payment_record_missing_native_link",
        "warning",
        "Native ledger record is missing a transaction link",
        "This payment record is marked as native but does not reference a native transaction id.",
        { paymentRecordId: record.id, kind: record.kind, sourceType: record.sourceType, sourceId: record.sourceId }
      );
      continue;
    }

    if (!nativeTransactionId) {
      continue;
    }

    const transaction = nativeTransactionsById.get(nativeTransactionId);

    if (!transaction) {
      pushIssue(
        issues,
        "payment_record_missing_transaction",
        "danger",
        "Ledger record points to a missing native transaction",
        "This payment record references a native transaction id that was not found.",
        { paymentRecordId: record.id, nativeTransactionId, kind: record.kind }
      );
      continue;
    }

    if (normalizeString(transaction.paymentRecordId) && normalizeString(transaction.paymentRecordId) !== normalizeString(record.id)) {
      pushIssue(
        issues,
        "payment_record_transaction_mismatch",
        "danger",
        "Ledger record and transaction point at different records",
        "The transaction is linked to a different payment record than the ledger record that references it.",
        { paymentRecordId: record.id, nativeTransactionId, transactionPaymentRecordId: transaction.paymentRecordId }
      );
    }
  }

  for (const item of [...eventItems, ...courseItems]) {
    const transactionId = normalizeString(item.nativePaymentTransactionId);

    if (!transactionId) {
      continue;
    }

    const transaction = nativeTransactionsById.get(transactionId);
    const record = paymentRecordsByNativeTransactionId.get(transactionId);
    const expectedPaymentStatus = mapTransactionStatusToExpectedPaymentStatus(transaction?.status);

    if (!transaction) {
      pushIssue(
        issues,
        "workflow_missing_native_transaction",
        "danger",
        "Workflow record points to a missing native transaction",
        "This registration references a native payment transaction that was not found.",
        { kind: item.kind, recordId: item.recordId, nativeTransactionId: transactionId }
      );
      continue;
    }

    if (!record) {
      pushIssue(
        issues,
        "workflow_missing_ledger_record",
        "warning",
        "Workflow record is missing a ledger-backed payment record",
        "A native transaction exists for this workflow record, but no ledger record was found for it.",
        { kind: item.kind, recordId: item.recordId, nativeTransactionId: transactionId }
      );
    }

    if (
      normalizeString(item.nativePaymentStatus) &&
      normalizeString(item.nativePaymentStatus) !== normalizeString(transaction.status)
    ) {
      pushIssue(
        issues,
        "workflow_native_status_drift",
        "warning",
        "Workflow native payment status has drifted from the transaction",
        "The workflow copy of the native payment status does not match the authoritative transaction status.",
        {
          kind: item.kind,
          recordId: item.recordId,
          nativePaymentTransactionId: transactionId,
          workflowNativePaymentStatus: item.nativePaymentStatus,
          transactionStatus: transaction.status,
        }
      );
    }

    if (
      expectedPaymentStatus &&
      normalizeString(item.paymentStatus) &&
      normalizeString(item.paymentStatus) !== expectedPaymentStatus &&
      !(normalizeString(item.paymentStatus) === "refunded" && normalizeString(transaction.refundStatus)) &&
      !(normalizeString(item.paymentStatus) === "partially_refunded" && normalizeString(transaction.refundStatus) === "partially_refunded")
    ) {
      pushIssue(
        issues,
        "workflow_payment_status_drift",
        "warning",
        "Workflow payment status has drifted from the transaction outcome",
        "The registration payment status does not match the expected state from the native transaction.",
        {
          kind: item.kind,
          recordId: item.recordId,
          nativePaymentTransactionId: transactionId,
          workflowPaymentStatus: item.paymentStatus,
          transactionStatus: transaction.status,
        }
      );
    }

    if (
      record &&
      normalizeString(record.financialStatus) &&
      normalizeString(item.paymentStatus) &&
      normalizeString(record.financialStatus) !== normalizeString(item.paymentStatus) &&
      !(normalizeString(record.financialStatus) === "partially_refunded" && normalizeString(item.paymentStatus) === "refunded")
    ) {
      pushIssue(
        issues,
        "workflow_ledger_status_drift",
        "warning",
        "Workflow payment status has drifted from the ledger",
        "The workflow record and ledger record disagree about the payment outcome.",
        {
          kind: item.kind,
          recordId: item.recordId,
          paymentRecordId: record.id,
          workflowPaymentStatus: item.paymentStatus,
          ledgerFinancialStatus: record.financialStatus,
        }
      );
    }
  }

  for (const request of pendingUpgradeRequests) {
    const transactionId = normalizeString(request.nativePaymentTransactionId);

    if (!transactionId) {
      continue;
    }

    const transaction = nativeTransactionsById.get(transactionId);

    if (!transaction) {
      pushIssue(
        issues,
        "upgrade_request_missing_transaction",
        "danger",
        "Membership upgrade request points to a missing transaction",
        "The pending upgrade request references a native payment transaction that was not found.",
        { requestId: request.id, nativePaymentTransactionId: transactionId }
      );
      continue;
    }

    if (
      normalizeString(request.nativePaymentStatus) &&
      normalizeString(request.nativePaymentStatus) !== normalizeString(transaction.status)
    ) {
      pushIssue(
        issues,
        "upgrade_request_status_drift",
        "warning",
        "Membership upgrade request status has drifted from the transaction",
        "The upgrade request copy of the native payment status does not match the transaction.",
        {
          requestId: request.id,
          nativePaymentTransactionId: transactionId,
          requestNativePaymentStatus: request.nativePaymentStatus,
          transactionStatus: transaction.status,
        }
      );
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalIssues: issues.length,
    summary: buildIssueSummary(issues),
    issues: issues.slice(0, Number.isFinite(Number(options.issueLimit)) ? Number(options.issueLimit) : 20),
  };
}

export async function repairHubPaymentReconciliation(hubId, actorId = "payment-reconciliation-repair") {
  const normalizedHubId = normalizeString(hubId);
  const normalizedActorId = normalizeString(actorId) || "payment-reconciliation-repair";

  if (!normalizedHubId) {
    throw new Error("Hub id is required.");
  }

  const [paymentRecords, paymentItems, nativeTransactions, eventItems, courseItems, users] = await Promise.all([
    listPaymentRecordsByHub(normalizedHubId),
    listPaymentItemsByHubId(normalizedHubId),
    listNativePaymentTransactionsByHub(normalizedHubId),
    listEventBookingPaymentItemsByHub(normalizedHubId),
    listCoursePaymentItemsByHub(normalizedHubId),
    listUsersByHub(normalizedHubId),
  ]);
  const startedAt = new Date().toISOString();
  const paymentRecordsById = new Map(paymentRecords.map((record) => [normalizeString(record.id), record]));
  const paymentRecordsByNativeTransactionId = new Map(
    paymentRecords
      .filter((record) => normalizeString(record.nativeTransactionId))
      .map((record) => [normalizeString(record.nativeTransactionId), record])
  );
  const nativeTransactionsById = new Map(nativeTransactions.map((transaction) => [normalizeString(transaction.id), transaction]));
  const eventItemsBySourceId = buildWorkflowItemsByPaymentRecordSource(eventItems);
  const courseItemsBySourceId = buildWorkflowItemsByPaymentRecordSource(courseItems);
  const usersById = new Map(users.map((user) => [normalizeString(user.id), user]));
  const repairSummary = {
    startedAt,
    completedAt: "",
    actorId: normalizedActorId,
    paymentItemsUpserted: 0,
    paymentRecordsPaidAtRepaired: 0,
    orphanPaymentItemsDeleted: 0,
    transactionLinksRepaired: 0,
    skippedManualReview: 0,
  };

  for (const record of paymentRecords) {
    const inferredPaidAt = inferRepairPaidAt(record, {
      nativeTransactionsById,
      eventItemsBySourceId,
      courseItemsBySourceId,
    });
    const repairedRecord = inferredPaidAt
      ? await updatePaymentRecord(
          normalizedHubId,
          record.id,
          {
            paidAt: inferredPaidAt,
          },
          normalizedActorId,
          {
            rebuildPaymentSummary: false,
            syncMemberDirectory: false,
          }
        )
      : record;

    if (inferredPaidAt) {
      repairSummary.paymentRecordsPaidAtRepaired += 1;
    }

    if (!inferredPaidAt) {
      await upsertPaymentItemFromPaymentRecord(normalizedHubId, repairedRecord, {
        actorId: normalizedActorId,
        user: usersById.get(normalizeString(repairedRecord.userId)),
        updatedAt: startedAt,
        syncMemberDirectory: false,
      });
    }
    repairSummary.paymentItemsUpserted += 1;
  }

  for (const item of paymentItems) {
    if (normalizeString(item.sourceCollection) !== "paymentRecords") {
      continue;
    }

    const paymentRecordId = normalizeString(item.paymentRecordId);

    if (!paymentRecordId || paymentRecordsById.has(paymentRecordId)) {
      continue;
    }

    await deletePaymentItemById(normalizedHubId, item.id);
    repairSummary.orphanPaymentItemsDeleted += 1;
  }

  for (const transaction of nativeTransactions) {
    const transactionId = normalizeString(transaction.id);
    const existingPaymentRecordId = normalizeString(transaction.paymentRecordId);
    const inferredRecord = paymentRecordsByNativeTransactionId.get(transactionId);

    if (!transactionId || !inferredRecord) {
      continue;
    }

    if (!existingPaymentRecordId) {
      await updateNativePaymentTransaction(
        normalizedHubId,
        transactionId,
        {
          paymentRecordId: inferredRecord.id,
        },
        normalizedActorId
      );
      repairSummary.transactionLinksRepaired += 1;
      continue;
    }

    if (existingPaymentRecordId !== normalizeString(inferredRecord.id)) {
      repairSummary.skippedManualReview += 1;
    }
  }

  const paymentSummary = await rebuildPaymentSummaryFromPaymentItems(normalizedHubId, {
    actorId: normalizedActorId,
    updatedAt: new Date().toISOString(),
  });
  const afterReport = await getHubPaymentReconciliationReport(normalizedHubId, { issueLimit: 100 });

  return {
    ...repairSummary,
    completedAt: new Date().toISOString(),
    paymentSummaryReportableItems: paymentSummary?.reportableItems || 0,
    paymentSummaryTotalSourceItems: paymentSummary?.totalSourceItems || 0,
    remainingIssues: afterReport.totalIssues,
    remainingSummary: afterReport.summary,
  };
}
