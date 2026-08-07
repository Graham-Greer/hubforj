try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubCoreById } from "@/lib/data/hubs";
import { normalizeSiteSettingsRecord } from "@/lib/domain/public-site";
import {
  deriveBrandingSettingsPanelStatus,
  deriveHomepageSettingsPanelStatus,
  deriveSiteSettingsPanelStatus,
} from "@/lib/domain/site-settings";
import { createPerformanceTimer } from "@/lib/observability/performance-timing";

export const ADMIN_ONBOARDING_SUMMARY_SCHEMA_VERSION = 2;

const RECORD_COUNT_KEYS = ["whatWeDo", "testimonials", "events", "courses", "media"];
const SETUP_FACT_KEYS = ["siteDetails", "branding", "homepage", "accountReview", "membershipPlans"];
const RECORD_COLLECTIONS = [
  ["whatWeDo", "whatWeDoItems"],
  ["testimonials", "testimonials"],
  ["events", "events"],
  ["courses", "courses"],
  ["media", "mediaAssets"],
];

const SETUP_FACT_COLLECTIONS = [
  ["membershipPlans", "membershipPlans"],
];

function normalizeString(value) {
  return String(value || "").trim();
}

function parseInteger(value) {
  const numeric = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getSummaryRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("system").doc("adminOnboardingSummary");
}

function normalizeRecordCounts(value = {}) {
  return Object.fromEntries(
    RECORD_COUNT_KEYS.map((key) => [key, parseInteger(value?.[key]) > 0 ? 1 : 0])
  );
}

function normalizeChecklistStatus(value) {
  const normalized = normalizeString(value);

  return normalized === "completed" || normalized === "in_progress" ? normalized : "not_started";
}

function normalizeSetupFacts(value = {}) {
  return Object.fromEntries(
    SETUP_FACT_KEYS.map((key) => [key, normalizeChecklistStatus(value?.[key])])
  );
}

function mapPanelMetaToChecklistStatus(meta = {}) {
  if (meta?.label === "Complete") {
    return "completed";
  }

  if (meta?.label === "Partially configured") {
    return "in_progress";
  }

  return "not_started";
}

function normalizeSummaryDoc(doc, hubId) {
  const data = doc?.exists ? doc.data() : null;

  if (!data) {
    return null;
  }

  return {
    hubId,
    schemaVersion: parseInteger(data.schemaVersion),
    recordCounts: normalizeRecordCounts(data.recordCounts),
    setupFacts: normalizeSetupFacts(data.setupFacts),
    updatedAt: normalizeString(data.updatedAt),
    updatedBy: normalizeString(data.updatedBy),
  };
}

function isSummaryCurrent(summary) {
  return (
    summary?.schemaVersion === ADMIN_ONBOARDING_SUMMARY_SCHEMA_VERSION
    && Boolean(normalizeString(summary?.updatedAt))
  );
}

function summarizeIssues(issues = []) {
  const byCode = new Map();

  issues.forEach((issue) => {
    const existing = byCode.get(issue.code) || {
      code: issue.code,
      title: issue.title,
      count: 0,
    };

    existing.count += 1;
    byCode.set(issue.code, existing);
  });

  return [...byCode.values()].sort((left, right) => left.title.localeCompare(right.title));
}

function createIssue(code, title, detail, values = {}) {
  return {
    code,
    title,
    detail,
    ...values,
  };
}

async function hasHubCollectionRecords(hubId, recordKey, collectionName, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCollectionName = normalizeString(collectionName);
  const timer = options.timer || createPerformanceTimer("admin-onboarding-summary");
  const startedAt = Date.now();

  if (!normalizedHubId || !normalizedCollectionName) {
    timer.log("summary-source-skipped", {
      recordKey,
      collectionName: normalizedCollectionName,
      reason: "missing-hub-or-collection",
    });
    return false;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection(normalizedCollectionName)
    .limit(1)
    .get();
  const hasRecords = !snapshot.empty;

  timer.log("summary-source-read", {
    durationMs: Date.now() - startedAt,
    recordKey,
    collectionName: normalizedCollectionName,
    hasRecords,
  });

  return hasRecords;
}

export async function buildAdminOnboardingSummaryRecordCounts(hubId, options = {}) {
  const timer = options.timer || createPerformanceTimer("admin-onboarding-summary");
  const startedAt = Date.now();
  const entries = await Promise.all(
    RECORD_COLLECTIONS.map(async ([recordKey, collectionName]) => [
      recordKey,
      (await hasHubCollectionRecords(hubId, recordKey, collectionName, { timer })) ? 1 : 0,
    ])
  );
  const recordCounts = normalizeRecordCounts(Object.fromEntries(entries));

  timer.log("summary-source-counts-built", {
    durationMs: Date.now() - startedAt,
    ...recordCounts,
  });

  return recordCounts;
}

async function buildAdminOnboardingSetupFacts(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const timer = options.timer || createPerformanceTimer("admin-onboarding-summary");
  const startedAt = Date.now();

  if (!normalizedHubId) {
    timer.log("summary-setup-facts-skipped", { reason: "missing-hub" });
    return normalizeSetupFacts();
  }

  const db = getFirebaseAdminDb();
  const [hub, siteSettingsDoc, membershipPlanEntries] = await Promise.all([
    getHubCoreById(normalizedHubId),
    db.collection("hubs").doc(normalizedHubId).collection("siteSettings").doc("primary").get(),
    Promise.all(
      SETUP_FACT_COLLECTIONS.map(async ([factKey, collectionName]) => [
        factKey,
        (await hasHubCollectionRecords(normalizedHubId, factKey, collectionName, { timer })) ? 1 : 0,
      ])
    ),
  ]);
  const siteSettings = normalizeSiteSettingsRecord(hub || { id: normalizedHubId }, siteSettingsDoc.exists ? siteSettingsDoc.data() : {});
  const membershipPlanCounts = Object.fromEntries(membershipPlanEntries);
  const siteDetailsStatus = deriveSiteSettingsPanelStatus(hub, siteSettings);
  const brandingStatus = deriveBrandingSettingsPanelStatus(hub, siteSettings);
  const homepageStatus = deriveHomepageSettingsPanelStatus(siteSettings);
  const setupFacts = normalizeSetupFacts({
    siteDetails: mapPanelMetaToChecklistStatus(siteDetailsStatus),
    branding: mapPanelMetaToChecklistStatus(brandingStatus),
    homepage: mapPanelMetaToChecklistStatus(homepageStatus),
    accountReview: hub?.packageTier && hub?.packageStatus ? "completed" : "not_started",
    membershipPlans: Number(membershipPlanCounts.membershipPlans || 0) > 0 ? "completed" : "not_started",
  });

  timer.log("summary-setup-facts-built", {
    durationMs: Date.now() - startedAt,
    ...setupFacts,
  });

  return setupFacts;
}

export async function getAdminOnboardingSummaryByHubId(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const doc = await getSummaryRef(normalizedHubId).get();
  return normalizeSummaryDoc(doc, normalizedHubId);
}

export async function rebuildHubAdminOnboardingSummary(hubId, actorId = "system", options = {}) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const timer = options.timer || createPerformanceTimer("admin-onboarding-summary", { hubId: normalizedHubId });
  const now = normalizeString(options.updatedAt) || new Date().toISOString();
  const recordCounts = await buildAdminOnboardingSummaryRecordCounts(normalizedHubId, { timer });
  const setupFacts = await buildAdminOnboardingSetupFacts(normalizedHubId, { timer });
  const writeModel = {
    hubId: normalizedHubId,
    schemaVersion: ADMIN_ONBOARDING_SUMMARY_SCHEMA_VERSION,
    recordCounts,
    setupFacts,
    updatedAt: now,
    updatedBy: normalizeString(actorId) || "system",
  };

  await getSummaryRef(normalizedHubId).set(writeModel, { merge: false });
  timer.log("summary-rebuilt", {
    ...recordCounts,
    ...setupFacts,
    updatedAt: now,
  });

  return writeModel;
}

export async function getAdminOnboardingSummaryRecordCounts(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const timer = options.timer || createPerformanceTimer("admin-onboarding-summary", { hubId: normalizedHubId });
  const actorId = normalizeString(options.actorId) || "admin-onboarding-summary-fallback";
  const startedAt = Date.now();

  if (!normalizedHubId) {
    timer.log("summary-read-skipped", { reason: "missing-hub" });
    return normalizeRecordCounts();
  }

  const summary = await getAdminOnboardingSummaryByHubId(normalizedHubId);

  if (isSummaryCurrent(summary)) {
    timer.log("summary-read-hit", {
      durationMs: Date.now() - startedAt,
      ...summary.recordCounts,
    });
    return summary.recordCounts;
  }

  timer.log("summary-read-miss", {
    durationMs: Date.now() - startedAt,
    reason: summary ? "stale-schema-or-missing-updated-at" : "missing-summary",
    schemaVersion: summary?.schemaVersion || 0,
  });

  const rebuilt = await rebuildHubAdminOnboardingSummary(normalizedHubId, actorId, { timer });
  return normalizeRecordCounts(rebuilt?.recordCounts);
}

export async function getAdminOnboardingSummaryFacts(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const timer = options.timer || createPerformanceTimer("admin-onboarding-summary", { hubId: normalizedHubId });
  const actorId = normalizeString(options.actorId) || "admin-onboarding-summary-fallback";
  const startedAt = Date.now();

  if (!normalizedHubId) {
    timer.log("summary-facts-read-skipped", { reason: "missing-hub" });
    return {
      recordCounts: normalizeRecordCounts(),
      setupFacts: normalizeSetupFacts(),
    };
  }

  const summary = await getAdminOnboardingSummaryByHubId(normalizedHubId);

  if (isSummaryCurrent(summary)) {
    timer.log("summary-facts-read-hit", {
      durationMs: Date.now() - startedAt,
      ...summary.recordCounts,
      ...summary.setupFacts,
    });
    return {
      recordCounts: summary.recordCounts,
      setupFacts: summary.setupFacts,
    };
  }

  timer.log("summary-facts-read-miss", {
    durationMs: Date.now() - startedAt,
    reason: summary ? "stale-schema-or-missing-updated-at" : "missing-summary",
    schemaVersion: summary?.schemaVersion || 0,
  });

  const rebuilt = await rebuildHubAdminOnboardingSummary(normalizedHubId, actorId, { timer });

  return {
    recordCounts: normalizeRecordCounts(rebuilt?.recordCounts),
    setupFacts: normalizeSetupFacts(rebuilt?.setupFacts),
  };
}

export async function maintainHubAdminOnboardingSummaryForSourceChange(hubId, actorId = "system", options = {}) {
  try {
    return await rebuildHubAdminOnboardingSummary(hubId, actorId, options);
  } catch (error) {
    console.warn("Unable to maintain admin onboarding summary after source change", {
      hubId: normalizeString(hubId),
      actorId: normalizeString(actorId) || "system",
      reason: normalizeString(options.reason) || "source-change",
      error: String(error?.message || "Unable to maintain admin onboarding summary."),
    });
    return null;
  }
}

export async function getHubAdminOnboardingSummaryReconciliationReport(hubId, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const generatedAt = new Date().toISOString();
  const issues = [];

  if (!normalizedHubId) {
    issues.push(createIssue(
      "missing_hub_id",
      "Missing hub id",
      "Admin onboarding summary reconciliation could not run because the hub id was missing."
    ));
  } else {
    const [summary, sourceRecordCounts, sourceSetupFacts] = await Promise.all([
      getAdminOnboardingSummaryByHubId(normalizedHubId),
      buildAdminOnboardingSummaryRecordCounts(normalizedHubId),
      buildAdminOnboardingSetupFacts(normalizedHubId),
    ]);

    if (!summary) {
      issues.push(createIssue(
        "missing_summary",
        "Missing admin onboarding summary",
        "The hub does not have a system/adminOnboardingSummary document."
      ));
    } else if (!isSummaryCurrent(summary)) {
      issues.push(createIssue(
        "stale_summary",
        "Admin onboarding summary schema mismatch",
        `The summary schema is ${summary.schemaVersion || 0}; expected ${ADMIN_ONBOARDING_SUMMARY_SCHEMA_VERSION}.`,
        {
          actualSchemaVersion: summary.schemaVersion || 0,
          expectedSchemaVersion: ADMIN_ONBOARDING_SUMMARY_SCHEMA_VERSION,
        }
      ));
    }

    const summaryRecordCounts = normalizeRecordCounts(summary?.recordCounts);
    const summarySetupFacts = normalizeSetupFacts(summary?.setupFacts);

    RECORD_COUNT_KEYS.forEach((key) => {
      if (summaryRecordCounts[key] !== sourceRecordCounts[key]) {
        issues.push(createIssue(
          "record_count_mismatch",
          "Admin onboarding summary record count mismatch",
          `The ${key} checklist fact is ${summaryRecordCounts[key]}, but the source collection resolves to ${sourceRecordCounts[key]}.`,
          {
            recordKey: key,
            actual: summaryRecordCounts[key],
            expected: sourceRecordCounts[key],
          }
        ));
      }
    });

    SETUP_FACT_KEYS.forEach((key) => {
      if (summarySetupFacts[key] !== sourceSetupFacts[key]) {
        issues.push(createIssue(
          "setup_fact_mismatch",
          "Admin onboarding summary setup fact mismatch",
          `The ${key} checklist fact is ${summarySetupFacts[key]}, but the source data resolves to ${sourceSetupFacts[key]}.`,
          {
            factKey: key,
            actual: summarySetupFacts[key],
            expected: sourceSetupFacts[key],
          }
        ));
      }
    });
  }

  const issueLimit = parseInteger(options.issueLimit) || 25;

  return {
    generatedAt,
    totalIssues: issues.length,
    summary: summarizeIssues(issues),
    issues: issues.slice(0, issueLimit),
  };
}
