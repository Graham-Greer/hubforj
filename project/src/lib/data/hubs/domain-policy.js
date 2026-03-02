function sanitizeDomainCandidate(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

export function normalizeDomainInput(value) {
  const normalized = sanitizeDomainCandidate(value);
  if (!normalized) return "";
  return normalized;
}

export function getCanonicalDomain(domain) {
  const normalized = normalizeDomainInput(domain);
  if (!normalized) return "";
  // Policy: treat `www.example.com` and `example.com` as the same ownership domain
  // for uniqueness/conflict checks while preserving the normalized host value in storage.
  return normalized.startsWith("www.") ? normalized.slice(4) : normalized;
}

export function parseDomainList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeDomainInput).filter(Boolean);
  }

  const raw = String(value || "");
  if (!raw.trim()) return [];

  return raw
    .split(/[\n,]+/)
    .map(normalizeDomainInput)
    .filter(Boolean);
}

export function assertValidDomainFormat(domain) {
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    throw new Error(`Invalid custom domain: ${domain}`);
  }
}

export function dedupeByCanonicalDomain(domains) {
  const byCanonical = new Map();
  for (const domain of domains) {
    const canonical = getCanonicalDomain(domain);
    if (!canonical) continue;
    if (!byCanonical.has(canonical)) {
      byCanonical.set(canonical, domain);
    }
  }

  return Array.from(byCanonical.values());
}

export function assertNoCanonicalDuplicates(domains) {
  const seen = new Set();
  for (const domain of domains) {
    const canonical = getCanonicalDomain(domain);
    if (!canonical) continue;
    if (seen.has(canonical)) {
      throw new Error(`Duplicate custom domain: ${domain}`);
    }
    seen.add(canonical);
  }
}

export function getReservedDomains() {
  const configured = String(process.env.PLATFORM_RESERVED_HOSTS || "")
    .split(",")
    .map((host) => normalizeDomainInput(host))
    .filter(Boolean);

  const defaults = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_PLATFORM_DOMAIN,
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN,
  ]
    .map((host) => normalizeDomainInput(host))
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...configured]));
}

export function assertNoReservedDomains(domains) {
  const reserved = new Set(getReservedDomains().map(getCanonicalDomain));

  for (const domain of domains) {
    const canonical = getCanonicalDomain(domain);
    if (reserved.has(canonical)) {
      throw new Error(`Reserved platform domain cannot be used: ${domain}`);
    }
  }
}

export function assertNoCrossHubConflicts({ domains, existingHubs, currentHubId = null }) {
  const incoming = new Set(domains.map(getCanonicalDomain).filter(Boolean));

  for (const hub of existingHubs) {
    if (currentHubId && hub.id === currentHubId) continue;
    const existing = Array.isArray(hub.customDomains) ? hub.customDomains : [];
    for (const domain of existing) {
      const canonical = getCanonicalDomain(domain);
      if (incoming.has(canonical)) {
        throw new Error(`Custom domain already assigned to another hub: ${domain}`);
      }
    }
  }
}
