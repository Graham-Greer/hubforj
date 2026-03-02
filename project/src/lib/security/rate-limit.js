import "server-only";

const root = globalThis;
if (!root.__communityRateLimitMap) {
  root.__communityRateLimitMap = new Map();
}

function now() {
  return Date.now();
}

export function checkRateLimit({
  key,
  windowMs = 60_000,
  maxRequests = 20,
}) {
  if (!key) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const current = now();
  const map = root.__communityRateLimitMap;
  const entry = map.get(key) || { count: 0, resetAt: current + windowMs };

  if (entry.resetAt <= current) {
    entry.count = 0;
    entry.resetAt = current + windowMs;
  }

  entry.count += 1;
  map.set(key, entry);

  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - current) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
