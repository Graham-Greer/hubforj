try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getHubBySlug, requireHubById, requireHubBySlug } from "@/lib/data/hubs";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

import { buildHubDataUseSummary } from "./buildHubDataUseSummary";
import {
  legalAcceptanceVersion,
  assertLegalAcknowledgementAccepted,
  assertLegalDocumentType,
  assertLegalMutationAccess,
  assertNonEmptyLegalContent,
} from "./legalValidation";
import {
  hasLegalRichTextContent,
  isSameLegalRichTextContent,
  sanitizeLegalRichTextContent,
} from "./legalSanitizer";

export const LEGAL_SETTINGS_DOC_ID = "settings";

function normalizeString(value) {
  return String(value || "").trim();
}

function getLegalSettingsRef(hubId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("legal").doc(LEGAL_SETTINGS_DOC_ID);
}

function normalizeTimestamp(value) {
  return normalizeString(value);
}

function resolveActorDisplayName(access = {}) {
  const adminUser = access?.adminSession?.user;
  const operatorUser = access?.operatorSession?.user;
  return normalizeString(adminUser?.name || adminUser?.email || operatorUser?.name || operatorUser?.email || access?.actorId);
}

function createEmptyLegalDocumentState() {
  return {
    content: [],
    revision: 0,
    hasOwnerProvidedContent: false,
    acceptedFeatureSnapshotHash: "",
    updatedAt: "",
    updatedByUserId: "",
    updatedByUserName: "",
    acceptedResponsibilityAt: "",
    acceptedResponsibilityByUserId: "",
    acceptedResponsibilityByUserName: "",
    acceptanceVersion: legalAcceptanceVersion,
  };
}

function createEmptyDataUseSummaryState() {
  return {
    generatedAt: "",
    generatorVersion: "",
    featureSnapshotHash: "",
    sourceFeatureSnapshot: {},
    sourceModelSnapshot: {},
    summary: {
      sections: [],
      hubOwnerMustComplete: [],
      disclaimers: [],
    },
    capabilityChanges: [],
  };
}

function normalizeLegalDocumentState(record = {}) {
  const content = sanitizeLegalRichTextContent(record.content);

  return {
    content,
    revision: Number.isFinite(Number(record.revision)) ? Number(record.revision) : 0,
    hasOwnerProvidedContent:
      record.hasOwnerProvidedContent === true
      && hasLegalRichTextContent(content)
      && Boolean(normalizeString(record.acceptedResponsibilityAt)),
    acceptedFeatureSnapshotHash: normalizeString(record.acceptedFeatureSnapshotHash),
    updatedAt: normalizeTimestamp(record.updatedAt),
    updatedByUserId: normalizeString(record.updatedByUserId),
    updatedByUserName: normalizeString(record.updatedByUserName),
    acceptedResponsibilityAt: normalizeTimestamp(record.acceptedResponsibilityAt),
    acceptedResponsibilityByUserId: normalizeString(record.acceptedResponsibilityByUserId),
    acceptedResponsibilityByUserName: normalizeString(record.acceptedResponsibilityByUserName),
    acceptanceVersion: normalizeString(record.acceptanceVersion) || legalAcceptanceVersion,
  };
}

function normalizeDataUseSummaryState(record = {}) {
  return {
    generatedAt: normalizeTimestamp(record.generatedAt),
    generatorVersion: normalizeString(record.generatorVersion),
    featureSnapshotHash: normalizeString(record.featureSnapshotHash),
    sourceFeatureSnapshot: record.sourceFeatureSnapshot || {},
    sourceModelSnapshot: record.sourceModelSnapshot || {},
    summary: {
      sections: Array.isArray(record.summary?.sections) ? record.summary.sections : [],
      hubOwnerMustComplete: Array.isArray(record.summary?.hubOwnerMustComplete)
        ? record.summary.hubOwnerMustComplete.map((item) => normalizeString(item)).filter(Boolean)
        : [],
      disclaimers: Array.isArray(record.summary?.disclaimers)
        ? record.summary.disclaimers.map((item) => normalizeString(item)).filter(Boolean)
        : [],
    },
    capabilityChanges: Array.isArray(record.capabilityChanges) ? record.capabilityChanges : [],
  };
}

function buildLegalStatus({ terms, privacy, dataUseSummary }) {
  const missingDocuments = [];
  const reviewTargets = {
    terms: [],
    privacy: [],
  };

  if (!terms.hasOwnerProvidedContent) {
    missingDocuments.push("terms");
  }

  if (!privacy.hasOwnerProvidedContent) {
    missingDocuments.push("privacy");
  }

  const capabilityChanges = Array.isArray(dataUseSummary.capabilityChanges) ? dataUseSummary.capabilityChanges : [];

  for (const change of capabilityChanges) {
    const suggestedDocuments = Array.isArray(change?.suggestedDocuments) ? change.suggestedDocuments : [];

    if (suggestedDocuments.includes("terms")) {
      reviewTargets.terms.push(change);
    }

    if (suggestedDocuments.includes("privacy")) {
      reviewTargets.privacy.push(change);
    }
  }

  const termsNeedsReview =
    terms.hasOwnerProvidedContent
    && Boolean(terms.acceptedFeatureSnapshotHash)
    && terms.acceptedFeatureSnapshotHash !== dataUseSummary.featureSnapshotHash
    && reviewTargets.terms.length > 0;
  const privacyNeedsReview =
    privacy.hasOwnerProvidedContent
    && Boolean(privacy.acceptedFeatureSnapshotHash)
    && privacy.acceptedFeatureSnapshotHash !== dataUseSummary.featureSnapshotHash
    && reviewTargets.privacy.length > 0;

  const requiresOwnerReview = termsNeedsReview || privacyNeedsReview;
  const requiresOwnerReviewReason = requiresOwnerReview
    ? "Platform capabilities changed in a way that may affect the hub's legal wording."
    : "";

  const requiresOwnerReviewSince = requiresOwnerReview ? normalizeTimestamp(dataUseSummary.generatedAt) : "";

  const attentionItems = [
    ...missingDocuments.map((documentType) => ({
      key: `${documentType}_missing`,
      documentType,
      title:
        documentType === "terms"
          ? "Terms of Service still need to be completed by the owner."
          : "Privacy Policy still needs to be completed by the owner.",
    })),
    ...(termsNeedsReview
      ? [{
          key: "terms_review_required",
          documentType: "terms",
          title: "Terms of Service should be reviewed because platform capability changes may affect the current wording.",
        }]
      : []),
    ...(privacyNeedsReview
      ? [{
          key: "privacy_review_required",
          documentType: "privacy",
          title: "Privacy Policy should be reviewed because platform capability changes may affect the current wording.",
        }]
      : []),
  ];

  return {
    requiresOwnerReview,
    requiresOwnerReviewSince,
    requiresOwnerReviewReason,
    capabilityChangesSinceLastAcceptance: capabilityChanges,
    reviewTargets,
    missingDocuments,
    attentionItems,
  };
}

export function normalizeLegalSettingsRecord(record = {}) {
  const terms = normalizeLegalDocumentState(record.terms || createEmptyLegalDocumentState());
  const privacy = normalizeLegalDocumentState(record.privacy || createEmptyLegalDocumentState());
  const dataUseSummary = normalizeDataUseSummaryState(record.dataUseSummary || createEmptyDataUseSummaryState());
  const legalStatus = buildLegalStatus({ terms, privacy, dataUseSummary });

  return {
    terms,
    privacy,
    dataUseSummary,
    legalStatus,
    updatedAt: normalizeTimestamp(record.updatedAt),
    updatedByUserId: normalizeString(record.updatedByUserId),
  };
}

export async function getLegalSettingsByHubId(hubId) {
  const hub = await requireHubById(hubId);
  const snapshot = await getLegalSettingsRef(hub.id).get();
  const normalized = normalizeLegalSettingsRecord(snapshot.exists ? snapshot.data() : {});

  return {
    hub,
    ...normalized,
  };
}

export async function getLegalSettingsByHubSlug(hubSlug) {
  const hub = await requireHubBySlug(hubSlug);
  return getLegalSettingsByHubId(hub.id);
}

export async function getOptionalLegalSettingsByHubSlug(hubSlug) {
  const hub = await getHubBySlug(hubSlug);

  if (!hub) {
    return null;
  }

  return getLegalSettingsByHubId(hub.id);
}

export async function regenerateHubLegalDataUseSummary(hubId, actorId = "system") {
  const hub = await requireHubById(hubId);
  const ref = getLegalSettingsRef(hub.id);
  const snapshot = await ref.get();
  const existing = normalizeLegalSettingsRecord(snapshot.exists ? snapshot.data() : {});
  const summary = await buildHubDataUseSummary(hub, {
    previousFeatureSnapshot: existing.dataUseSummary.sourceFeatureSnapshot,
  });
  const now = summary.generatedAt;
  const normalizedActorId = normalizeString(actorId) || "system";

  await ref.set(
    {
      dataUseSummary: summary,
      updatedAt: now,
      updatedByUserId: normalizedActorId,
    },
    { merge: true }
  );

  return {
    hub,
    ...normalizeLegalSettingsRecord({
      ...existing,
      dataUseSummary: summary,
      updatedAt: now,
      updatedByUserId: normalizedActorId,
    }),
  };
}

export async function saveLegalDocumentForHub({
  hubId,
  access,
  documentType,
  content,
  acknowledgementAccepted,
}) {
  const hub = await requireHubById(hubId);
  assertLegalMutationAccess(access);

  const normalizedDocumentType = assertLegalDocumentType(documentType);
  assertLegalAcknowledgementAccepted(acknowledgementAccepted === true);
  const sanitizedContent = assertNonEmptyLegalContent(content);

  const ref = getLegalSettingsRef(hub.id);
  const snapshot = await ref.get();
  const existing = normalizeLegalSettingsRecord(snapshot.exists ? snapshot.data() : {});
  const existingDocument = existing[normalizedDocumentType];

  if (isSameLegalRichTextContent(existingDocument.content, sanitizedContent)) {
    return {
      hub,
      documentType: normalizedDocumentType,
      changed: false,
      ...existing,
    };
  }

  const summary = await buildHubDataUseSummary(hub, {
    previousFeatureSnapshot: existing.dataUseSummary.sourceFeatureSnapshot,
  });
  const actorId = normalizeString(access?.actorId) || "system";
  const actorName = resolveActorDisplayName(access);
  const now = summary.generatedAt;

  const nextDocument = {
    content: sanitizedContent,
    revision: Number(existingDocument.revision || 0) + 1,
    hasOwnerProvidedContent: true,
    acceptedFeatureSnapshotHash: normalizeString(summary.featureSnapshotHash),
    updatedAt: now,
    updatedByUserId: actorId,
    updatedByUserName: actorName,
    acceptedResponsibilityAt: now,
    acceptedResponsibilityByUserId: actorId,
    acceptedResponsibilityByUserName: actorName,
    acceptanceVersion: legalAcceptanceVersion,
  };

  await ref.set(
    {
      [normalizedDocumentType]: nextDocument,
      dataUseSummary: summary,
      updatedAt: now,
      updatedByUserId: actorId,
    },
    { merge: true }
  );

  return {
    hub,
    documentType: normalizedDocumentType,
    changed: true,
    ...normalizeLegalSettingsRecord({
      ...existing,
      [normalizedDocumentType]: nextDocument,
      dataUseSummary: summary,
      updatedAt: now,
      updatedByUserId: actorId,
    }),
  };
}
