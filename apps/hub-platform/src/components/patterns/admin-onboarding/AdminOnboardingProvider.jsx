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
const onboardingStateCache = new Map();
const onboardingRequestCache = new Map();
const onboardingCacheTtlMs = 5 * 60 * 1000;

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

function getScopeRank(scope) {
  return scope === "checklist" ? 2 : scope === "route" ? 1 : 0;
}

function getOnboardingCacheKey(hubSlug, actorUserId, scope) {
  return `${normalizeString(hubSlug)}:${normalizeString(actorUserId)}:${normalizeString(scope) || "route"}`;
}

function readCachedOnboardingState(hubSlug, actorUserId, requiredScope) {
  const normalizedRequiredScope = normalizeString(requiredScope) || "route";
  const candidateScopes = normalizedRequiredScope === "route" ? ["checklist", "route"] : ["checklist"];
  const now = Date.now();

  for (const scope of candidateScopes) {
    const cached = onboardingStateCache.get(getOnboardingCacheKey(hubSlug, actorUserId, scope));

    if (!cached || now - cached.loadedAt > onboardingCacheTtlMs) {
      continue;
    }

    if (hasLoadedOnboardingScope(cached.scope, normalizedRequiredScope)) {
      return cached;
    }
  }

  return null;
}

function writeCachedOnboardingState(hubSlug, actorUserId, scope, state) {
  const normalizedScope = normalizeString(scope) || "route";

  if (!state) {
    return;
  }

  onboardingStateCache.set(getOnboardingCacheKey(hubSlug, actorUserId, normalizedScope), {
    scope: normalizedScope,
    state,
    loadedAt: Date.now(),
  });
}

async function fetchOnboardingState(hubSlug, actorUserId, scope) {
  const normalizedScope = normalizeString(scope) || "route";
  const cacheKey = getOnboardingCacheKey(hubSlug, actorUserId, normalizedScope);
  const cached = readCachedOnboardingState(hubSlug, actorUserId, normalizedScope);

  if (cached) {
    return cached;
  }

  if (onboardingRequestCache.has(cacheKey)) {
    return onboardingRequestCache.get(cacheKey);
  }

  const request = (async () => {
    const scopeQuery = normalizedScope === "checklist" ? "" : "?scope=route";
    const response = await fetch(`/api/admin/hubs/${hubSlug}/onboarding${scopeQuery}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json();
    const state = payload?.state || null;

    writeCachedOnboardingState(hubSlug, actorUserId, normalizedScope, state);

    return {
      scope: normalizedScope,
      state,
      loadedAt: Date.now(),
    };
  })().finally(() => {
    onboardingRequestCache.delete(cacheKey);
  });

  onboardingRequestCache.set(cacheKey, request);
  return request;
}

function scheduleRouteOnboardingLoad(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: 1200 });
    return () => window.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 120);
  return () => window.clearTimeout(handle);
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
  const initialRequiredScope = getRequiredOnboardingScope(shouldHydrateChecklist);
  const initialCachedState = readCachedOnboardingState(hub.slug, actorUserId, initialRequiredScope);
  const [state, setState] = useState(initialCachedState?.state || null);
  const [routeLoading, setRouteLoading] = useState(!initialCachedState && initialRequiredScope === "route");
  const [checklistLoading, setChecklistLoading] = useState(!initialCachedState && initialRequiredScope === "checklist");
  const [currentJourneyKey, setCurrentJourneyKey] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentOrigin, setCurrentOrigin] = useState("auto");
  const [suppressedJourneyKeys, setSuppressedJourneyKeys] = useState([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const currentJourneyKeyRef = useRef("");
  const checklistRevealIntentRef = useRef("");
  const loadedHubSlugRef = useRef("");
  const loadedScopeRef = useRef(initialCachedState?.scope || "");
  const latestLoadRankRef = useRef(getScopeRank(initialCachedState?.scope || ""));
  const loadStateRef = useRef(async () => {});
  const loading = routeLoading || (checklistLoading && shouldHydrateChecklist);

  useEffect(() => {
    currentJourneyKeyRef.current = currentJourneyKey;
  }, [currentJourneyKey]);

  useEffect(() => {
    let cancelled = false;
    const identityKey = `${hub.slug}:${actorUserId}`;

    if (loadedHubSlugRef.current !== identityKey) {
      loadedHubSlugRef.current = identityKey;
      loadedScopeRef.current = "";
      latestLoadRankRef.current = 0;
      const cached = readCachedOnboardingState(hub.slug, actorUserId, getRequiredOnboardingScope(shouldHydrateChecklist));
      setState(cached?.state || null);
      if (cached) {
        loadedScopeRef.current = cached.scope;
        latestLoadRankRef.current = getScopeRank(cached.scope);
      }
    }

    const applyCachedState = (requiredScope) => {
      const cached = readCachedOnboardingState(hub.slug, actorUserId, requiredScope);

      if (!cached) {
        return false;
      }

      setState(cached.state);
      loadedScopeRef.current = cached.scope;
      latestLoadRankRef.current = Math.max(latestLoadRankRef.current, getScopeRank(cached.scope));
      setRouteLoading(false);
      if (hasLoadedOnboardingScope(cached.scope, "checklist")) {
        setChecklistLoading(false);
      }
      return true;
    };

    loadStateRef.current = async ({ silent = false, scope = getRequiredOnboardingScope(shouldHydrateChecklist) } = {}) => {
      const normalizedScope = normalizeString(scope) || "route";
      const requestedRank = getScopeRank(normalizedScope);

      if (applyCachedState(normalizedScope)) {
        return;
      }

      if (normalizedScope === "checklist") {
        setChecklistLoading(true);
      } else if (!silent) {
        setRouteLoading(true);
      }

      try {
        const result = await fetchOnboardingState(hub.slug, actorUserId, normalizedScope);
        if (!cancelled && requestedRank >= latestLoadRankRef.current) {
          setState(result.state);
          loadedScopeRef.current = result.scope;
          latestLoadRankRef.current = requestedRank;
        }
      } catch {
        if (!cancelled && !silent) {
          setState(null);
        }
      } finally {
        if (!cancelled) {
          if (normalizedScope === "checklist") {
            setChecklistLoading(false);
          } else {
            setRouteLoading(false);
          }
        }
      }
    };

    const requiredScope = getRequiredOnboardingScope(shouldHydrateChecklist);

    if (!hasLoadedOnboardingScope(loadedScopeRef.current, requiredScope)) {
      const loadedFromCache = applyCachedState(requiredScope);

      if (!loadedFromCache) {
        if (requiredScope === "checklist") {
          loadStateRef.current({ scope: requiredScope });
        } else {
          setRouteLoading(true);
          const cancelScheduledLoad = scheduleRouteOnboardingLoad(() => {
            loadStateRef.current({ silent: true, scope: requiredScope });
          });

          return () => {
            cancelled = true;
            cancelScheduledLoad();
          };
        }
      }
    }

    return () => {
      cancelled = true;
    };
  }, [actorUserId, hub.slug, shouldHydrateChecklist]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const requiredScope = getRequiredOnboardingScope(shouldHydrateChecklist);

    if (hasLoadedOnboardingScope(loadedScopeRef.current, requiredScope)) {
      return;
    }

    if (requiredScope === "checklist") {
      loadStateRef.current({ scope: requiredScope });
      return;
    }

    const cancelScheduledLoad = scheduleRouteOnboardingLoad(() => {
      loadStateRef.current({ silent: true, scope: requiredScope });
    });

    return cancelScheduledLoad;
  }, [actorUserId, hub.slug, pathname, shouldHydrateChecklist]);

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
    writeCachedOnboardingState(
      hub.slug,
      actorUserId,
      nextState?.checklistHydrated ? "checklist" : loadedScopeRef.current || "route",
      nextState
    );

    try {
      const response = await fetch(`/api/admin/hubs/${hub.slug}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });
      const payload = await response.json();
      if (payload?.state) {
        setState(payload.state);
        writeCachedOnboardingState(
          hub.slug,
          actorUserId,
          payload.state?.checklistHydrated ? "checklist" : loadedScopeRef.current || "route",
          payload.state
        );
      }
    } catch {
      // Best-effort persistence. Keep the local state so onboarding does not feel broken.
    }
  }, [actorUserId, hub.slug]);

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
    checklistHydrating: checklistLoading && shouldHydrateChecklist && setupChecklistRequested,
    currentJourney,
    currentOrigin,
    currentStep,
    currentStepIndex,
    dismissChecklist,
    hub,
    loading,
    routeLoading,
    checklistLoading,
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
