function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeCurrencyCode(value, fallbackCurrency = "USD") {
  return normalizeString(value).toUpperCase() || fallbackCurrency;
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseTimestampMs(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

const zeroDecimalCurrencies = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

function addRevenueMinor(totalsByCurrencyMinor, currency, amountMinor) {
  totalsByCurrencyMinor.set(currency, (totalsByCurrencyMinor.get(currency) || 0) + amountMinor);
}

function convertMinorToMajorAmount(amountMinor, currency) {
  return zeroDecimalCurrencies.has(currency) ? amountMinor : amountMinor / 100;
}

function formatRevenueSummary(totalsByCurrencyMinor, formatMoney, fallbackCurrency = "USD") {
  if (!totalsByCurrencyMinor.size) {
    return {
      amount: 0,
      currency: fallbackCurrency,
      formatted: typeof formatMoney === "function" ? formatMoney(0, fallbackCurrency) : `${fallbackCurrency} 0.00`,
      isMixedCurrency: false,
    };
  }

  if (totalsByCurrencyMinor.size === 1) {
    const [currency, amountMinor] = [...totalsByCurrencyMinor.entries()][0];
    const amount = convertMinorToMajorAmount(amountMinor, currency);

    return {
      amount,
      currency,
      formatted: typeof formatMoney === "function" ? formatMoney(amount, currency) : `${currency} ${amount}`,
      isMixedCurrency: false,
    };
  }

  return {
    amount: null,
    currency: "",
    formatted: "Mixed",
    isMixedCurrency: true,
  };
}

function buildMembershipRevenueValueKey({
  userId = "",
  amountMinor = "",
  currency = "",
} = {}) {
  const parts = [
    normalizeString(userId),
    String(parseInteger(amountMinor)),
    normalizeString(currency).toUpperCase(),
  ];

  if (parts.some((part) => !part)) {
    return "";
  }

  return parts.join("::");
}

function getPaymentRecordRevenueTimestampMs(record = {}) {
  return (
    parseTimestampMs(record.paidAt) ||
    parseTimestampMs(record.occurredAt) ||
    parseTimestampMs(record.updatedAt) ||
    parseTimestampMs(record.createdAt)
  );
}

function isPaidMembershipUpgradePaymentRecord(record = {}) {
  const kind = normalizeString(record.kind);
  const sourceType = normalizeString(record.sourceType);

  return (
    (kind === "membership_upgrade" || sourceType === "membershipUpgradeRequest") &&
    normalizeString(record.reportingEligibility) !== "informational_only" &&
    normalizeString(record.financialStatus) === "paid"
  );
}

function isPaidMembershipCyclePaymentRecord(record = {}) {
  const kind = normalizeString(record.kind);

  return (
    (kind === "membership_cycle" || normalizeString(record.sourceType) === "membershipPayment") &&
    normalizeString(record.sourceType) === "membershipPayment" &&
    normalizeString(record.reportingEligibility) !== "informational_only" &&
    normalizeString(record.financialStatus) === "paid"
  );
}

export function getDuplicateMembershipCyclePaymentRecordIds(paymentRecords = []) {
  const duplicateRecordIds = new Set();
  const membershipCycleCandidatesByValue = new Map();
  const maxDuplicateWindowMs = 45 * 24 * 60 * 60 * 1000;

  paymentRecords
    .filter(isPaidMembershipCyclePaymentRecord)
    .forEach((record) => {
      const valueKey = buildMembershipRevenueValueKey(record);

      if (!valueKey) {
        return;
      }

      const rows = membershipCycleCandidatesByValue.get(valueKey) || [];
      rows.push(record);
      membershipCycleCandidatesByValue.set(valueKey, rows);
    });

  paymentRecords
    .filter(isPaidMembershipUpgradePaymentRecord)
    .forEach((upgradeRecord) => {
      const valueKey = buildMembershipRevenueValueKey(upgradeRecord);
      const upgradeTimestampMs = getPaymentRecordRevenueTimestampMs(upgradeRecord);
      const candidates = membershipCycleCandidatesByValue.get(valueKey) || [];

      if (!valueKey || !candidates.length || !upgradeTimestampMs) {
        return;
      }

      const closestCandidate = candidates
        .filter((candidate) => normalizeString(candidate.id) && !duplicateRecordIds.has(normalizeString(candidate.id)))
        .map((candidate) => ({
          candidate,
          distanceMs: Math.abs((getPaymentRecordRevenueTimestampMs(candidate) || 0) - upgradeTimestampMs),
        }))
        .filter((entry) => entry.distanceMs <= maxDuplicateWindowMs)
        .sort((left, right) => left.distanceMs - right.distanceMs)[0];

      if (closestCandidate?.candidate?.id) {
        duplicateRecordIds.add(normalizeString(closestCandidate.candidate.id));
      }
    });

  return duplicateRecordIds;
}

export function filterDuplicateMembershipCyclePaymentRecords(paymentRecords = []) {
  const duplicateRecordIds = getDuplicateMembershipCyclePaymentRecordIds(paymentRecords);

  if (!duplicateRecordIds.size) {
    return paymentRecords;
  }

  return paymentRecords.filter((record) => !duplicateRecordIds.has(normalizeString(record?.id)));
}

export function getPaymentItemKindLabel(kind) {
  switch (normalizeString(kind)) {
    case "membership":
      return "Membership";
    case "event":
      return "Event";
    case "course":
      return "Course";
    default:
      return "Payment item";
  }
}

export function summarizeHubPaymentItems(items) {
  return {
    total: items.length,
    actionRequired: items.filter((item) => item.paymentStatus === "unpaid" || item.paymentStatus === "overdue" || item.paymentStatus === "failed").length,
    settled: items.filter((item) => item.paymentStatus === "paid" || item.paymentStatus === "not_required" || item.paymentStatus === "partially_refunded").length,
    membership: items.filter((item) => item.kind === "membership").length,
    bookings: items.filter((item) => item.kind === "event" || item.kind === "course").length,
  };
}

export function summarizePaymentItemCollectedRevenue(
  items = [],
  formatMoney,
  fallbackCurrency = "USD"
) {
  const totalsByCurrencyMinor = new Map();

  items.forEach((item) => {
    if (normalizeString(item?.paymentStatus) !== "paid") {
      return;
    }

    const currency = normalizeCurrencyCode(item?.currency, fallbackCurrency);
    const amountMinor = parseInteger(item?.amountMinor);
    const refundAmountMinor = parseInteger(item?.refundAmountMinor);
    const netMinor = amountMinor - refundAmountMinor;

    addRevenueMinor(totalsByCurrencyMinor, currency, netMinor);
  });

  return formatRevenueSummary(totalsByCurrencyMinor, formatMoney, fallbackCurrency);
}

export function summarizePaymentItemRefundedRevenue(
  items = [],
  formatMoney,
  fallbackCurrency = "USD"
) {
  const totalsByCurrencyMinor = new Map();

  items.forEach((item) => {
    const paymentStatus = normalizeString(item?.paymentStatus);
    const currency = normalizeCurrencyCode(item?.currency, fallbackCurrency);
    const amountMinor = parseInteger(item?.amountMinor);
    const explicitRefundMinor = parseInteger(item?.refundAmountMinor);
    const refundAmountMinor = explicitRefundMinor > 0 ? explicitRefundMinor : paymentStatus === "refunded" ? amountMinor : 0;

    if (refundAmountMinor <= 0) {
      return;
    }

    addRevenueMinor(totalsByCurrencyMinor, currency, refundAmountMinor);
  });

  return formatRevenueSummary(totalsByCurrencyMinor, formatMoney, fallbackCurrency);
}

export function summarizeNativeCollectedRevenue(transactions = [], formatMoney, fallbackCurrency = "USD") {
  const totalsByCurrencyMinor = new Map();

  transactions.forEach((transaction) => {
    if (normalizeString(transaction?.status) !== "payment_received") {
      return;
    }

    const currency = normalizeCurrencyCode(transaction?.currency, fallbackCurrency);
    const amountMinor = parseInteger(transaction?.amountMinor);
    const refundAmountMinor = parseInteger(transaction?.refundAmountMinor);
    const netMinor = amountMinor - refundAmountMinor;

    addRevenueMinor(totalsByCurrencyMinor, currency, netMinor);
  });

  return formatRevenueSummary(totalsByCurrencyMinor, formatMoney, fallbackCurrency);
}

export function summarizeCollectedRevenue(
  { paymentRecords = [], nativeTransactions = [] } = {},
  formatMoney,
  fallbackCurrency = "USD"
) {
  const totalsByCurrencyMinor = new Map();
  const revenuePaymentRecords = filterDuplicateMembershipCyclePaymentRecords(paymentRecords);
  const ledgerNativeTransactionIds = new Set(
    revenuePaymentRecords
      .map((record) => normalizeString(record?.nativeTransactionId))
      .filter(Boolean)
  );

  revenuePaymentRecords.forEach((record) => {
    if (normalizeString(record?.reportingEligibility) === "informational_only") {
      return;
    }

    const financialStatus = normalizeString(record?.financialStatus);

    if (financialStatus !== "paid" && financialStatus !== "refunded" && financialStatus !== "partially_refunded") {
      return;
    }

    const currency = normalizeCurrencyCode(record?.currency, fallbackCurrency);
    const amountMinor = parseInteger(record?.amountMinor);
    const refundAmountMinor = parseInteger(record?.refundAmountMinor);
    const netMinor = amountMinor - refundAmountMinor;

    addRevenueMinor(totalsByCurrencyMinor, currency, netMinor);
  });

  nativeTransactions.forEach((transaction) => {
    if (normalizeString(transaction?.status) !== "payment_received") {
      return;
    }

    const transactionId = normalizeString(transaction?.id);

    if (transactionId && ledgerNativeTransactionIds.has(transactionId)) {
      return;
    }

    const currency = normalizeCurrencyCode(transaction?.currency, fallbackCurrency);
    const amountMinor = parseInteger(transaction?.amountMinor);
    const refundAmountMinor = parseInteger(transaction?.refundAmountMinor);
    const netMinor = amountMinor - refundAmountMinor;

    addRevenueMinor(totalsByCurrencyMinor, currency, netMinor);
  });

  return formatRevenueSummary(totalsByCurrencyMinor, formatMoney, fallbackCurrency);
}

export function summarizeRefundedRevenue(
  { paymentRecords = [], nativeTransactions = [] } = {},
  formatMoney,
  fallbackCurrency = "USD"
) {
  const totalsByCurrencyMinor = new Map();
  const revenuePaymentRecords = filterDuplicateMembershipCyclePaymentRecords(paymentRecords);
  const ledgerNativeTransactionIds = new Set(
    revenuePaymentRecords
      .map((record) => normalizeString(record?.nativeTransactionId))
      .filter(Boolean)
  );

  revenuePaymentRecords.forEach((record) => {
    if (normalizeString(record?.reportingEligibility) === "informational_only") {
      return;
    }

    const refundAmountMinor = parseInteger(record?.refundAmountMinor);

    if (refundAmountMinor <= 0) {
      return;
    }

    const currency = normalizeCurrencyCode(record?.currency, fallbackCurrency);
    addRevenueMinor(totalsByCurrencyMinor, currency, refundAmountMinor);
  });

  nativeTransactions.forEach((transaction) => {
    const transactionId = normalizeString(transaction?.id);

    if (transactionId && ledgerNativeTransactionIds.has(transactionId)) {
      return;
    }

    const refundAmountMinor = parseInteger(transaction?.refundAmountMinor);

    if (refundAmountMinor <= 0) {
      return;
    }

    const currency = normalizeCurrencyCode(transaction?.currency, fallbackCurrency);
    addRevenueMinor(totalsByCurrencyMinor, currency, refundAmountMinor);
  });

  return formatRevenueSummary(totalsByCurrencyMinor, formatMoney, fallbackCurrency);
}

export function summarizeLedgerRecordCounts({ paymentRecords = [], nativeTransactions = [] } = {}) {
  const revenuePaymentRecords = filterDuplicateMembershipCyclePaymentRecords(paymentRecords);
  const ledgerNativeTransactionIds = new Set(
    revenuePaymentRecords
      .map((record) => normalizeString(record?.nativeTransactionId))
      .filter(Boolean)
  );

  const counts = {
    paid: 0,
    refunded: 0,
    failed: 0,
  };

  revenuePaymentRecords.forEach((record) => {
    if (normalizeString(record?.reportingEligibility) === "informational_only") {
      return;
    }

    const financialStatus = normalizeString(record?.financialStatus);

    if (financialStatus === "paid") {
      counts.paid += 1;
    } else if (financialStatus === "refunded" || financialStatus === "partially_refunded") {
      counts.refunded += 1;
    } else if (financialStatus === "failed") {
      counts.failed += 1;
    }
  });

  nativeTransactions.forEach((transaction) => {
    const transactionId = normalizeString(transaction?.id);

    if (transactionId && ledgerNativeTransactionIds.has(transactionId)) {
      return;
    }

    if (normalizeString(transaction?.refundStatus) === "refunded" || parseInteger(transaction?.refundAmountMinor) > 0) {
      counts.refunded += 1;
      return;
    }

    const status = normalizeString(transaction?.status);

    if (status === "payment_received") {
      counts.paid += 1;
    } else if (status === "payment_failed") {
      counts.failed += 1;
    }
  });

  return counts;
}
