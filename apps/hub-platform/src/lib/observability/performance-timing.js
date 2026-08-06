try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

function normalizeString(value) {
  return String(value || "").trim();
}

export function isPerformanceTimingEnabled() {
  return normalizeString(process.env.HUB_PLATFORM_PERFORMANCE_TIMING_ENABLED).toLowerCase() === "true";
}

export function createPerformanceTimer(scope, baseContext = {}) {
  const enabled = isPerformanceTimingEnabled();
  const startedAt = Date.now();
  let previousAt = startedAt;

  function log(event, context = {}) {
    if (!enabled) {
      return;
    }

    const now = Date.now();
    const elapsedMs = now - startedAt;
    const stepMs = now - previousAt;
    previousAt = now;

    console.info("Hub platform performance timing", {
      scope,
      event,
      elapsedMs,
      stepMs,
      ...baseContext,
      ...context,
    });
  }

  return {
    log,
    end(context = {}) {
      log("complete", context);
    },
  };
}
