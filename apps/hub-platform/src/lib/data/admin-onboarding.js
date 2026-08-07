try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { isHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import {
  adminOnboardingChecklistItems,
  adminOnboardingJourneyOrder,
  adminOnboardingVersion,
  getAdminOnboardingChecklistOrder,
} from "@/lib/admin-onboarding/config";
import { createPerformanceTimer } from "@/lib/observability/performance-timing";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeErrorMessage(error) {
  return String(error?.message || "Unknown error.");
}

async function measureOnboardingPromise(promise, timer, event, context = {}) {
  const startedAt = Date.now();

  try {
    const result = await promise;
    timer.log(event, {
      durationMs: Date.now() - startedAt,
      ...context,
    });
    return result;
  } catch (error) {
    timer.log(`${event}-failed`, {
      durationMs: Date.now() - startedAt,
      error: normalizeErrorMessage(error),
      ...context,
    });
    throw error;
  }
}

function defaultJourneyState() {
  return {
    status: "not_started",
    currentStepId: "",
    firstStartedAt: null,
    lastOpenedAt: null,
    completedAt: null,
    dismissedAt: null,
    seenStepIds: [],
  };
}

function createDefaultAdminOnboardingState({ hubId, actorUserId, actorRole }) {
  return {
    hubId: normalizeString(hubId),
    actorUserId: normalizeString(actorUserId),
    actorRole: normalizeString(actorRole),
    version: adminOnboardingVersion,
    welcomeJourney: defaultJourneyState(),
    routeJourneys: Object.fromEntries(
      adminOnboardingJourneyOrder.filter((key) => key !== "welcome_overview").map((key) => [key, defaultJourneyState()])
    ),
    checklist: {
      dismissed: false,
      lastViewedAt: null,
      items: [],
    },
    preferences: {
      reducedMotion: false,
      autoPlayVideo: true,
    },
  };
}

function normalizeJourneyState(value) {
  return {
    status: ["not_started", "in_progress", "completed", "dismissed"].includes(normalizeString(value?.status))
      ? normalizeString(value.status)
      : "not_started",
    currentStepId: normalizeString(value?.currentStepId),
    firstStartedAt: normalizeString(value?.firstStartedAt) || null,
    lastOpenedAt: normalizeString(value?.lastOpenedAt) || null,
    completedAt: normalizeString(value?.completedAt) || null,
    dismissedAt: normalizeString(value?.dismissedAt) || null,
    seenStepIds: Array.isArray(value?.seenStepIds) ? [...new Set(value.seenStepIds.map((item) => normalizeString(item)).filter(Boolean))] : [],
  };
}

function normalizePersistedState(raw, fallback) {
  const next = {
    ...fallback,
    hubId: fallback.hubId,
    actorUserId: fallback.actorUserId,
    actorRole: fallback.actorRole,
    version: adminOnboardingVersion,
    welcomeJourney: normalizeJourneyState(raw?.welcomeJourney),
    routeJourneys: {},
    checklist: {
      dismissed: Boolean(raw?.checklist?.dismissed),
      lastViewedAt: normalizeString(raw?.checklist?.lastViewedAt) || null,
      items: Array.isArray(raw?.checklist?.items) ? raw.checklist.items : [],
    },
    preferences: {
      reducedMotion: Boolean(raw?.preferences?.reducedMotion),
      autoPlayVideo: raw?.preferences?.autoPlayVideo !== false,
    },
  };

  adminOnboardingJourneyOrder
    .filter((key) => key !== "welcome_overview")
    .forEach((key) => {
      next.routeJourneys[key] = normalizeJourneyState(raw?.routeJourneys?.[key]);
    });

  return next;
}

async function getChecklistRecordCounts(hub, capabilities, options = {}) {
  const timer = options.timer || createPerformanceTimer("admin-onboarding-state");
  const startedAt = Date.now();
  const [hasWhatWeDoItems, hasTestimonials, hasEvents, hasCourses, hasMediaAssets] = await Promise.all([
    hasHubCollectionRecords(hub.id, "whatWeDoItems", { timer, recordKey: "whatWeDo" }),
    hasHubCollectionRecords(hub.id, "testimonials", { timer, recordKey: "testimonials" }),
    hasHubCollectionRecords(hub.id, "events", { timer, recordKey: "events" }),
    capabilities.coursesEnabled
      ? hasHubCollectionRecords(hub.id, "courses", { timer, recordKey: "courses" })
      : Promise.resolve(false),
    hasHubCollectionRecords(hub.id, "mediaAssets", { timer, recordKey: "media" }),
  ]);
  const recordCounts = {
    whatWeDo: hasWhatWeDoItems ? 1 : 0,
    testimonials: hasTestimonials ? 1 : 0,
    events: hasEvents ? 1 : 0,
    courses: hasCourses ? 1 : 0,
    media: hasMediaAssets ? 1 : 0,
  };

  timer.log("checklist-record-counts-loaded", {
    durationMs: Date.now() - startedAt,
    ...recordCounts,
  });

  return recordCounts;
}

function buildChecklistItemsFromFacts(state, hub, capabilities, paymentSetupState, recordCounts = {}) {
  const checklistOrder = getAdminOnboardingChecklistOrder(state?.packageTier);
  const orderedChecklistItems = [...adminOnboardingChecklistItems].sort((left, right) => {
    const leftIndex = checklistOrder.indexOf(left.key);
    const rightIndex = checklistOrder.indexOf(right.key);

    if (leftIndex === -1 && rightIndex === -1) {
      return 0;
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });

  return orderedChecklistItems
    .filter((item) => !item.requiresCapability || capabilities[item.requiresCapability])
    .map((item) => {
      let status = "not_started";
      const existingItemState = Array.isArray(state.checklist?.items)
        ? state.checklist.items.find((entry) => entry.key === item.key)
        : null;

      if (item.completionMode === "journey") {
        const journeyState =
          item.journeyKey === "welcome_overview"
            ? state.welcomeJourney
            : state.routeJourneys?.[item.journeyKey] || defaultJourneyState();
        status = journeyState.status === "completed" ? "completed" : journeyState.status === "in_progress" || journeyState.status === "dismissed" ? "in_progress" : "not_started";
      }

      if (item.completionMode === "record") {
        const hasRecords = Number(recordCounts[item.recordKey] || 0) > 0;
        status = hasRecords ? "completed" : "not_started";
      }

      if (item.completionMode === "regional_setup") {
        status = isHubRegionalSetupComplete(hub) ? "completed" : "not_started";
      }

      if (item.key === "payments_setup" && capabilities.nativePaymentsEnabled === true) {
        if (paymentSetupState?.key === "ready") {
          status = "completed";
        } else if (paymentSetupState?.configuration?.hasConnectedAccount === true) {
          status = "in_progress";
        } else {
          status = "not_started";
        }
      }

      return {
        key: item.key,
        status,
        completedAt:
          status === "completed"
            ? normalizeString(existingItemState?.completedAt) || new Date().toISOString()
            : null,
      };
    });
}

function getDocRef(hubId, actorUserId) {
  return getFirebaseAdminDb().collection("hubs").doc(hubId).collection("adminOnboarding").doc(actorUserId);
}

async function hasHubCollectionRecords(hubId, collectionName, options = {}) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCollectionName = normalizeString(collectionName);
  const timer = options.timer || createPerformanceTimer("admin-onboarding-state");
  const recordKey = normalizeString(options.recordKey) || normalizedCollectionName;
  const startedAt = Date.now();

  if (!normalizedHubId || !normalizedCollectionName) {
    timer.log("checklist-record-source-skipped", {
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

  timer.log("checklist-record-source-read", {
    durationMs: Date.now() - startedAt,
    recordKey,
    collectionName: normalizedCollectionName,
    hasRecords,
  });

  return hasRecords;
}

export async function getAdminOnboardingState(hub, actorUserId, actorRole, options = {}) {
  const includeChecklist = options.includeChecklist !== false;
  const timer = createPerformanceTimer("admin-onboarding-state", {
    hubId: normalizeString(hub?.id),
    hubSlug: normalizeString(hub?.slug),
    actorUserId: normalizeString(actorUserId),
    actorRole: normalizeString(actorRole),
    includeChecklist,
  });
  timer.log("start");
  const fallback = createDefaultAdminOnboardingState({
    hubId: hub.id,
    actorUserId,
    actorRole,
  });

  const entitlements = resolveHubPackageEntitlements(hub);
  const capabilities = entitlements.capabilities || {};
  timer.log("entitlements-resolved", {
    packageTier: entitlements.packageTier,
    paymentProcessingMode: entitlements.paymentProcessingMode,
    nativePaymentsEnabled: capabilities.nativePaymentsEnabled === true,
    coursesEnabled: capabilities.coursesEnabled === true,
  });
  fallback.packageTier = entitlements.packageTier;
  const shouldLoadPaymentConfiguration = capabilities.nativePaymentsEnabled === true;
  if (!shouldLoadPaymentConfiguration) {
    timer.log("payment-configuration-skipped", { reason: "native-payments-disabled" });
  }
  if (!includeChecklist) {
    timer.log("checklist-record-counts-skipped", { reason: "route-scope" });
  }
  const [doc, paymentConfiguration, recordCounts] = await Promise.all([
    measureOnboardingPromise(getDocRef(hub.id, actorUserId).get(), timer, "onboarding-doc-read"),
    shouldLoadPaymentConfiguration
      ? measureOnboardingPromise(
          getHubPaymentConfigurationByHubId(hub.id),
          timer,
          "payment-configuration-read"
        )
      : Promise.resolve(null),
    includeChecklist ? getChecklistRecordCounts(hub, capabilities, { timer }) : Promise.resolve(null),
  ]);
  const persisted = normalizePersistedState(doc.exists ? doc.data() : null, fallback);
  timer.log("persisted-state-normalized", {
    docExists: doc.exists,
    checklistPersistedItemCount: Array.isArray(persisted.checklist?.items) ? persisted.checklist.items.length : 0,
  });
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  timer.log("payment-setup-state-resolved", {
    paymentSetupStateKey: paymentSetupState?.key || "locked",
    paymentSetupHasConnectedAccount: paymentSetupState?.configuration?.hasConnectedAccount === true,
  });
  const checklistItems = includeChecklist
    ? buildChecklistItemsFromFacts(persisted, hub, capabilities, paymentSetupState, recordCounts)
    : persisted.checklist.items;
  timer.log("checklist-items-built", {
    checklistHydrated: includeChecklist,
    checklistItemCount: Array.isArray(checklistItems) ? checklistItems.length : 0,
  });

  const state = {
    ...persisted,
    checklist: {
      ...persisted.checklist,
      items: checklistItems,
    },
    checklistHydrated: includeChecklist,
    capabilities,
    packageTier: entitlements.packageTier,
    paymentProcessingMode: entitlements.paymentProcessingMode,
    paymentSetupStateKey: paymentSetupState?.key || "locked",
    paymentSetupHasConnectedAccount: paymentSetupState?.configuration?.hasConnectedAccount === true,
  };
  timer.end({
    checklistHydrated: state.checklistHydrated === true,
    checklistItemCount: Array.isArray(state.checklist?.items) ? state.checklist.items.length : 0,
  });

  return state;
}

export async function saveAdminOnboardingState(hub, actorUserId, actorRole, nextState) {
  const timer = createPerformanceTimer("admin-onboarding-save", {
    hubId: normalizeString(hub?.id),
    hubSlug: normalizeString(hub?.slug),
    actorUserId: normalizeString(actorUserId),
    actorRole: normalizeString(actorRole),
  });
  timer.log("start");
  const fallback = createDefaultAdminOnboardingState({
    hubId: hub.id,
    actorUserId,
    actorRole,
  });
  const normalized = normalizePersistedState(nextState, fallback);
  timer.log("state-normalized", {
    checklistItemCount: Array.isArray(normalized.checklist?.items) ? normalized.checklist.items.length : 0,
  });

  await measureOnboardingPromise(
    getDocRef(hub.id, actorUserId).set(
      {
        ...normalized,
        updatedAt: new Date().toISOString(),
      },
      { merge: false }
    ),
    timer,
    "onboarding-doc-written"
  );

  const state = await getAdminOnboardingState(hub, actorUserId, actorRole);
  timer.end({
    checklistHydrated: state?.checklistHydrated === true,
    checklistItemCount: Array.isArray(state?.checklist?.items) ? state.checklist.items.length : 0,
  });
  return state;
}
