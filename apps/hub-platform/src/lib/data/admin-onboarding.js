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

function normalizeString(value) {
  return String(value || "").trim();
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

async function buildChecklistItems(state, hub, capabilities, paymentSetupState) {
  const [hasWhatWeDoItems, hasTestimonials, hasEvents, hasCourses, hasMediaAssets] = await Promise.all([
    hasHubCollectionRecords(hub.id, "whatWeDoItems"),
    hasHubCollectionRecords(hub.id, "testimonials"),
    hasHubCollectionRecords(hub.id, "events"),
    capabilities.coursesEnabled ? hasHubCollectionRecords(hub.id, "courses") : Promise.resolve(false),
    hasHubCollectionRecords(hub.id, "mediaAssets"),
  ]);

  const recordCounts = {
    whatWeDo: hasWhatWeDoItems ? 1 : 0,
    testimonials: hasTestimonials ? 1 : 0,
    events: hasEvents ? 1 : 0,
    courses: hasCourses ? 1 : 0,
    media: hasMediaAssets ? 1 : 0,
  };

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

async function hasHubCollectionRecords(hubId, collectionName) {
  const normalizedHubId = normalizeString(hubId);
  const normalizedCollectionName = normalizeString(collectionName);

  if (!normalizedHubId || !normalizedCollectionName) {
    return false;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .doc(normalizedHubId)
    .collection(normalizedCollectionName)
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function getAdminOnboardingState(hub, actorUserId, actorRole) {
  const fallback = createDefaultAdminOnboardingState({
    hubId: hub.id,
    actorUserId,
    actorRole,
  });

  const doc = await getDocRef(hub.id, actorUserId).get();
  const persisted = normalizePersistedState(doc.exists ? doc.data() : null, fallback);
  const entitlements = resolveHubPackageEntitlements(hub);
  const capabilities = entitlements.capabilities || {};
  fallback.packageTier = entitlements.packageTier;
  const shouldLoadPaymentConfiguration = capabilities.nativePaymentsEnabled === true;
  const paymentConfiguration = shouldLoadPaymentConfiguration
    ? await getHubPaymentConfigurationByHubId(hub.id)
    : null;
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const checklistItems = await buildChecklistItems(persisted, hub, capabilities, paymentSetupState);

  return {
    ...persisted,
    checklist: {
      ...persisted.checklist,
      items: checklistItems,
    },
    capabilities,
    packageTier: entitlements.packageTier,
    paymentProcessingMode: entitlements.paymentProcessingMode,
    paymentSetupStateKey: paymentSetupState?.key || "locked",
    paymentSetupHasConnectedAccount: paymentSetupState?.configuration?.hasConnectedAccount === true,
  };
}

export async function saveAdminOnboardingState(hub, actorUserId, actorRole, nextState) {
  const fallback = createDefaultAdminOnboardingState({
    hubId: hub.id,
    actorUserId,
    actorRole,
  });
  const normalized = normalizePersistedState(nextState, fallback);

  await getDocRef(hub.id, actorUserId).set(
    {
      ...normalized,
      updatedAt: new Date().toISOString(),
    },
    { merge: false }
  );

  return getAdminOnboardingState(hub, actorUserId, actorRole);
}
