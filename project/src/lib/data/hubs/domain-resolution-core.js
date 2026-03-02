import { getCanonicalDomain, normalizeDomainInput } from "./domain-policy.js";

export function normalizeHost(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return normalizeDomainInput(raw.split(":")[0]);
}

export async function resolveHubForRequestWithReaders({ host, hubSlug, getByDomain, getBySlug }) {
  const normalizedHost = normalizeHost(host);
  const normalizedSlug = String(hubSlug || "").trim();

  if (normalizedHost) {
    const hubByDomain = await getByDomain(normalizedHost);
    if (hubByDomain) {
      return {
        hub: hubByDomain,
        source: "domain",
        host: normalizedHost,
      };
    }
  }

  if (normalizedSlug) {
    const hubBySlug = await getBySlug(normalizedSlug);
    if (hubBySlug) {
      return {
        hub: hubBySlug,
        source: "slug",
        host: normalizedHost,
      };
    }
  }

  return {
    hub: null,
    source: "none",
    host: normalizedHost,
  };
}

export function domainsConflict(a, b) {
  return getCanonicalDomain(a) !== "" && getCanonicalDomain(a) === getCanonicalDomain(b);
}
