import "server-only";
import { headers } from "next/headers";
import { getHubByCustomDomain, getHubBySlug } from "./hub-repository";
import { normalizeHost, resolveHubForRequestWithReaders, domainsConflict } from "./domain-resolution-core";

export async function getRequestHost() {
  const headerStore = await headers();
  return normalizeHost(headerStore.get("x-forwarded-host") || headerStore.get("host"));
}

export async function resolveHubForRequest({ host, hubSlug }) {
  return resolveHubForRequestWithReaders({
    host,
    hubSlug,
    getByDomain: getHubByCustomDomain,
    getBySlug: getHubBySlug,
  });
}

export async function resolveHubByHost(host) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return {
      hub: null,
      source: "none",
      host: "",
    };
  }

  const hub = await getHubByCustomDomain(normalizedHost);
  return {
    hub,
    source: hub ? "domain" : "none",
    host: normalizedHost,
  };
}

export async function isCustomDomainRequest(host) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return false;
  const hub = await getHubByCustomDomain(normalizedHost);
  return Boolean(hub);
}
export { normalizeHost, resolveHubForRequestWithReaders, domainsConflict };
