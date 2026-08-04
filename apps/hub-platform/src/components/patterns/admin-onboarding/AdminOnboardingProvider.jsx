"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  adminOnboardingChecklistItems,
  getAdminOnboardingChecklistOrder,
  adminOnboardingVersion,
} from "@/lib/admin-onboarding/config";
import {
  buildAdminHref,
  getJourneyDefinition,
  listRouteJourneyKeys,
} from "@/lib/admin-onboarding/routing";
import { trackAdminOnboardingEvent } from "@/lib/admin-onboarding/analytics";
import AdminOnboardingHelpLauncher from "./AdminOnboardingHelpLauncher";
import AdminOnboardingModal from "./AdminOnboardingModal";

const AdminOnboardingContext = createContext(null);

function normalizeString(value) {
  return String(value || "").trim();
}

function deriveAdminBasePath(pathname, hubSlug) {
  const normalizedPath = normalizeString(pathname);
  const sluggedBase = `/${hubSlug}/admin`;
  return normalizedPath.startsWith(sluggedBase) ? sluggedBase : "/admin";
}

function shouldHydrateChecklistForPath(pathname, adminBasePath) {
  return normalizeString(pathname) === normalizeString(adminBasePath);
}

function getRequiredOnboardingScope(shouldHydrateChecklist) {
  return shouldHydrateChecklist ? "checklist" : "route";
}

function hasLoadedOnboardingScope(loadedScope, requiredScope) {
  return loadedScope === "checklist" || loadedScope === requiredScope;
}

function cloneState(nextState) {
  return JSON.parse(JSON.stringify(nextState));
}

function getJourneyState(state, journeyKey) {
  if (!state) {
    return null;
  }

  if (journeyKey === "welcome_overview") {
    return state.welcomeJourney;
  }

  return state.routeJourneys?.[journeyKey] || null;
}

function setJourneyState(state, journeyKey, nextJourneyState) {
  const next = cloneState(state);

  if (journeyKey === "welcome_overview") {
    next.welcomeJourney = nextJourneyState;
    return next;
  }

  next.routeJourneys = {
    ...(next.routeJourneys || {}),
    [journeyKey]: nextJourneyState,
  };
  return next;
}

export function useAdminOnboarding() {
  return useContext(AdminOnboardingContext);
}

export default function AdminOnboardingProvider({
  hub,
  actorUserId,
  actorRole,
  operatorTheme = "light",
  children,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const adminBasePath = useMemo(() => deriveAdminBasePath(pathname, hub.slug), [hub.slug, pathname]);
  const shouldHydrateChecklist = shouldHydrateChecklistForPath(pathname, adminBasePath);
  const routeKey = `${pathname || ""}?${searchParams?.toString() || ""}`;
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentJourneyKey, setCurrentJourneyKey] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentOrigin, setCurrentOrigin] = useState("auto");
  const [suppressedJourneyKeys, setSuppressedJourneyKeys] = useState([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const currentJourneyKeyRef = useRef("");
  const checklistRevealIntentRef = useRef("");
  const loadedHubSlugRef = useRef("");
  const loadedScopeRef = useRef("");
  const loadStateRef = useRef(async () => {});

  useEffect(() => {
    currentJourneyKeyRef.current = currentJourneyKey;
  }, [currentJourneyKey]);

  useEffect(() => {
    let cancelled = false;

    if (loadedHubSlugRef.current !== hub.slug) {
      loadedHubSlugRef.current = hub.slug;
      loadedScopeRef.current = "";
    }

    loadStateRef.current = async ({ silent = false, scope = getRequiredOnboardingScope(shouldHydrateChecklist) } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const scopeQuery = scope === "checklist" ? "" : "?scope=route";
        const response = await fetch(`/api/admin/hubs/${hub.slug}/onboarding${scopeQuery}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await response.json();
        if (!cancelled) {
          setState(payload?.state || null);
          loadedScopeRef.current = scope;
        }
      } catch {
        if (!cancelled && !silent) {
          setState(null);
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };

    const requiredScope = getRequiredOnboardingScope(shouldHydrateChecklist);

    if (!hasLoadedOnboardingScope(loadedScopeRef.current, requiredScope)) {
      loadStateRef.current({ scope: requiredScope });
    }

    return () => {
      cancelled = true;
    };
  }, [hub.slug, shouldHydrateChecklist]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const requiredScope = getRequiredOnboardingScope(shouldHydrateChecklist);

    if (loading || hasLoadedOnboardingScope(loadedScopeRef.current, requiredScope)) {
      return;
    }

    loadStateRef.current({ silent: !shouldHydrateChecklist, scope: requiredScope });
  }, [loading, pathname, shouldHydrateChecklist]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncPreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, []);

  const persistState = useCallback(async (nextState) => {
    setState(nextState);

    try {
      const response = await fetch(`/api/admin/hubs/${hub.slug}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });
      const payload = await response.json();
      if (payload?.state) {
        setState(payload.state);
      }
    } catch {
      // Best-effort persistence. Keep the local state so onboarding does not feel broken.
    }
  }, [hub.slug]);

  const openJourney = useCallback(async (journeyKey, origin = "help_menu") => {
    const journey = getJourneyDefinition(journeyKey, state);
    const journeyState = getJourneyState(state, journeyKey);
    if (!journey || !journeyState) {
      return;
    }

    const firstStepId = journey.steps?.[0]?.id || "";
    const nextJourneyState = {
      ...journeyState,
      status: journeyState.status === "completed" ? "completed" : "in_progress",
      currentStepId: journeyState.currentStepId || firstStepId,
      firstStartedAt: journeyState.firstStartedAt || new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      seenStepIds: journeyState.seenStepIds?.length
        ? journeyState.seenStepIds
        : firstStepId
          ? [firstStepId]
          : [],
    };
    const nextState = setJourneyState(state, journeyKey, nextJourneyState);

    setCurrentJourneyKey(journeyKey);
    setCurrentStepIndex(
      Math.max(
        0,
        journey.steps.findIndex((step) => step.id === nextJourneyState.currentStepId)
      )
    );
    setCurrentOrigin(origin);
    trackAdminOnboardingEvent("journey_started", {
      journeyKey,
      origin,
      actorRole,
      hubId: hub.id,
      stepId: nextJourneyState.currentStepId,
    });
    await persistState(nextState);
  }, [actorRole, hub.id, persistState, state]);

  const closeJourney = async (mode = "dismissed") => {
    if (!currentJourneyKeyRef.current || !state) {
      return;
    }

    const journeyKey = currentJourneyKeyRef.current;
    const journeyState = getJourneyState(state, journeyKey);
    if (!journeyState) {
      return;
    }

    const timestamp = new Date().toISOString();
    const nextJourneyState = {
      ...journeyState,
      status: mode,
      dismissedAt: mode === "dismissed" ? timestamp : journeyState.dismissedAt,
      completedAt: mode === "completed" ? timestamp : journeyState.completedAt,
    };
    const nextState = setJourneyState(state, journeyKey, nextJourneyState);

    setCurrentJourneyKey("");
    setCurrentStepIndex(0);
    if (mode === "dismissed") {
      setSuppressedJourneyKeys((current) =>
        current.includes(journeyKey) ? current : [...current, journeyKey]
      );
    }
    trackAdminOnboardingEvent(mode === "completed" ? "journey_completed" : "journey_dismissed", {
      journeyKey,
      actorRole,
      hubId: hub.id,
      origin: currentOrigin,
      stepId: journeyState.currentStepId,
    });
    await persistState(nextState);
  };

  const nextStep = async () => {
    const journey = getJourneyDefinition(currentJourneyKey, state);
    const journeyState = getJourneyState(state, currentJourneyKey);
    if (!journey || !journeyState) {
      return;
    }

    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= journey.steps.length) {
      await closeJourney("completed");
      return;
    }

    const nextStepId = journey.steps[nextIndex]?.id || "";
    const nextJourneyState = {
      ...journeyState,
      status: "in_progress",
      currentStepId: nextStepId,
      seenStepIds: [...new Set([...(journeyState.seenStepIds || []), nextStepId].filter(Boolean))],
    };
    setCurrentStepIndex(nextIndex);
    trackAdminOnboardingEvent("journey_advanced", {
      journeyKey: currentJourneyKey,
      actorRole,
      hubId: hub.id,
      origin: currentOrigin,
      stepId: nextStepId,
    });
    await persistState(setJourneyState(state, currentJourneyKey, nextJourneyState));
  };

  const restartJourney = async (journeyKey) => {
    if (!state) {
      return;
    }

    const journey = getJourneyDefinition(journeyKey, state);
    if (!journey) {
      return;
    }

    const firstStepId = journey.steps?.[0]?.id || "";
    const nextJourneyState = {
      status: "in_progress",
      currentStepId: firstStepId,
      firstStartedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      completedAt: null,
      dismissedAt: null,
      seenStepIds: firstStepId ? [firstStepId] : [],
    };
    const nextState = setJourneyState(state, journeyKey, nextJourneyState);
    setSuppressedJourneyKeys((current) => current.filter((key) => key !== journeyKey));
    setCurrentJourneyKey(journeyKey);
    setCurrentStepIndex(0);
    setCurrentOrigin("help_menu");
    trackAdminOnboardingEvent("journey_restarted", {
      journeyKey,
      actorRole,
      hubId: hub.id,
      origin: "help_menu",
      stepId: firstStepId,
    });
    await persistState(nextState);
  };

  const dismissChecklist = async () => {
    if (!state) {
      return;
    }

    const nextState = {
      ...cloneState(state),
      checklist: {
        ...state.checklist,
        dismissed: true,
        lastViewedAt: new Date().toISOString(),
      },
    };
    trackAdminOnboardingEvent("checklist_dismissed", {
      actorRole,
      hubId: hub.id,
    });
    await persistState(nextState);
  };

  const revealChecklist = async () => {
    const checklistIntentHref = `${adminBasePath}?setupChecklist=1`;

    if (!state || !shouldHydrateChecklist || !state.checklistHydrated) {
      trackAdminOnboardingEvent("checklist_view_requested", {
        actorRole,
        hubId: hub.id,
        source: "help_menu",
      });
      router.push(checklistIntentHref, { scroll: false });
      return;
    }

    if (state.checklist?.dismissed === false) {
      router.push(adminBasePath, { scroll: false });
      return;
    }

    const nextState = {
      ...cloneState(state),
      checklist: {
        ...state.checklist,
        dismissed: false,
        lastViewedAt: new Date().toISOString(),
      },
    };
    trackAdminOnboardingEvent("checklist_viewed", {
      actorRole,
      hubId: hub.id,
      source: "help_menu",
    });
    await persistState(nextState);
    router.push(adminBasePath, { scroll: false });
  };

  useEffect(() => {
    const shouldRevealChecklist = normalizeString(searchParams.get("setupChecklist")) === "1";
    const intentKey = `${hub.slug}:${routeKey}`;

    if (
      !shouldRevealChecklist ||
      !shouldHydrateChecklist ||
      loading ||
      !state?.checklistHydrated ||
      checklistRevealIntentRef.current === intentKey
    ) {
      return;
    }

    checklistRevealIntentRef.current = intentKey;

    if (state.checklist?.dismissed === false) {
      router.replace(adminBasePath, { scroll: false });
      return;
    }

    const nextState = {
      ...cloneState(state),
      checklist: {
        ...state.checklist,
        dismissed: false,
        lastViewedAt: new Date().toISOString(),
      },
    };

    trackAdminOnboardingEvent("checklist_viewed", {
      actorRole,
      hubId: hub.id,
      source: "help_menu",
    });
    persistState(nextState).finally(() => {
      router.replace(adminBasePath, { scroll: false });
    });
  }, [
    actorRole,
    adminBasePath,
    hub.id,
    hub.slug,
    loading,
    persistState,
    routeKey,
    router,
    searchParams,
    shouldHydrateChecklist,
    state,
  ]);

  useEffect(() => {
    if (loading || !state || currentJourneyKey) {
      return;
    }

    if (normalizeString(searchParams.get("setupChecklist")) === "1") {
      return;
    }

    if (state.version !== adminOnboardingVersion) {
      return;
    }

    const query = Object.fromEntries(searchParams.entries());
    const matchingJourneyKeys = listRouteJourneyKeys(pathname, hub.slug, state.capabilities || {}, query);
    const nextJourneyKey = matchingJourneyKeys.find((journeyKey) => {
      const journeyState = getJourneyState(state, journeyKey);
      if (!journeyState) {
        return false;
      }

      if (journeyState.status === "completed" || journeyState.status === "dismissed") {
        return false;
      }

      if (suppressedJourneyKeys.includes(journeyKey)) {
        return false;
      }

      return true;
    });

    if (!nextJourneyKey) {
      return;
    }

    openJourney(nextJourneyKey, "auto");
  }, [currentJourneyKey, hub.slug, loading, openJourney, pathname, searchParams, state, suppressedJourneyKeys]);

  const currentJourney = currentJourneyKey ? getJourneyDefinition(currentJourneyKey, state) : null;
  const currentStep = currentJourney?.steps?.[currentStepIndex] || null;
  const matchingJourneyKeys = listRouteJourneyKeys(
    pathname,
    hub.slug,
    state?.capabilities || {},
    Object.fromEntries(searchParams.entries())
  );
  const routeJourneyKey = matchingJourneyKeys[0] || "";
  const reducedMotion = Boolean(state?.preferences?.reducedMotion) || prefersReducedMotion;
  const setupChecklistRequested = normalizeString(searchParams.get("setupChecklist")) === "1";

  useEffect(() => {
    if (!currentJourneyKey || !currentStep) {
      return;
    }

    trackAdminOnboardingEvent("step_viewed", {
      journeyKey: currentJourneyKey,
      stepId: currentStep.id || "",
      stepIndex: currentStepIndex,
      origin: currentOrigin,
      actorRole,
      hubId: hub.id,
    });
  }, [actorRole, currentJourneyKey, currentOrigin, currentStep, currentStepIndex, hub.id]);

  const checklistItems = useMemo(() => {
    if (!state?.checklist?.items?.length) {
      return [];
    }

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
      .filter((item) => !item.requiresCapability || state.capabilities?.[item.requiresCapability])
      .map((item) => {
        const persisted = state.checklist.items.find((entry) => entry.key === item.key);
        return {
          ...item,
          status: persisted?.status || "not_started",
          completedAt: persisted?.completedAt || null,
          href: buildAdminHref(adminBasePath, item.href),
        };
      });
  }, [adminBasePath, state]);

  const value = {
    actorRole,
    actorUserId,
    adminBasePath,
    checklistItems,
    checklistHydrating: loading && shouldHydrateChecklist && setupChecklistRequested,
    currentJourney,
    currentOrigin,
    currentStep,
    currentStepIndex,
    dismissChecklist,
    hub,
    loading,
    openJourney,
    restartJourney,
    revealChecklist,
    routeJourneyKey,
    state,
  };

  return (
    <AdminOnboardingContext.Provider value={value}>
      {children}
      <AdminOnboardingHelpLauncher />
      <AdminOnboardingModal
        open={Boolean(currentJourney && currentStep)}
        journey={currentJourney}
        step={currentStep}
        stepIndex={currentStepIndex}
        theme={operatorTheme}
        reducedMotion={reducedMotion}
        onClose={() => closeJourney("dismissed")}
        onNext={nextStep}
      />
    </AdminOnboardingContext.Provider>
  );
}
