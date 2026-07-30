import { getServerEnv } from "@/lib/config/env";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHostname(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function normalizeReservedHostToken(value) {
  return normalizeHostname(value)
    .split(".")
    .filter(Boolean)[0] || "";
}

export function getPlatformRootDomain() {
  return normalizeHostname(process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN || "hubforj.com");
}

export function getPlatformHostedBaseHostname() {
  return normalizeHostname(process.env.HUB_PLATFORM_BASE_URL || `https://community.${getPlatformRootDomain()}`);
}

export function getCustomDomainVerificationPrefix() {
  return normalizeString(process.env.CUSTOM_DOMAIN_VERIFICATION_PREFIX || "_hubforj-verify");
}

export function getInternalAutomationSecret() {
  return normalizeString(getServerEnv().internalAutomationSecret);
}

export function isInternalAutomationConfigured() {
  return Boolean(getInternalAutomationSecret());
}

export function isCustomDomainRuntimeEnabled() {
  return normalizeString(process.env.CUSTOM_DOMAIN_RUNTIME_ENABLED).toLowerCase() === "true";
}

export function getPlatformReservedHostLabels() {
  const rootDomain = getPlatformRootDomain();
  const configured = normalizeString(process.env.PLATFORM_RESERVED_HOSTS)
    .split(",")
    .map((value) => normalizeReservedHostToken(value))
    .filter(Boolean);
  const defaults = [
    normalizeReservedHostToken(rootDomain),
    "www",
    "app",
    "community",
    "api",
    "status",
    "support",
    "help",
  ].filter(Boolean);

  return Array.from(new Set([...defaults, ...configured]));
}

export function isReservedHubSlug(value) {
  const normalizedValue = normalizeReservedHostToken(value);

  if (!normalizedValue) {
    return false;
  }

  return getPlatformReservedHostLabels().includes(normalizedValue);
}

export function getCustomDomainRuntimeDiagnostics() {
  return {
    platformRootDomain: getPlatformRootDomain(),
    platformHostedBaseHostname: getPlatformHostedBaseHostname(),
    verificationPrefix: getCustomDomainVerificationPrefix(),
    reservedHostLabels: getPlatformReservedHostLabels(),
    runtimeEnabled: isCustomDomainRuntimeEnabled(),
    internalAutomationConfigured: isInternalAutomationConfigured(),
  };
}
