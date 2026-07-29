import { resolveHubPackageEntitlements } from "./hub-package.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export function hasHubCapability(hub, capabilityKey) {
  const normalizedCapabilityKey = normalizeString(capabilityKey);

  if (!normalizedCapabilityKey) {
    return false;
  }

  const entitlements = resolveHubPackageEntitlements(hub);
  return entitlements.capabilities?.[normalizedCapabilityKey] === true;
}

export function assertHubCapability(hub, capabilityKey, message = "This feature is not available on the current package.") {
  if (!hasHubCapability(hub, capabilityKey)) {
    throw new Error(message);
  }
}

