import { timingSafeEqual } from "node:crypto";
import { assertValidEmail, assertRequiredString, normalizeEmail, normalizeHubSlug } from "./hubs.js";
import { normalizeUpdateHubPackageAuthorityPayload } from "./hub-package-contracts.js";
import { getInternalAutomationSecret } from "./custom-domain-runtime-config.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export { getInternalAutomationSecret };

export function validateInternalAutomationSecret(secret, environment = process.env.NODE_ENV) {
  const normalizedSecret = normalizeString(secret);

  if (!normalizedSecret || normalizedSecret === "replace-me") {
    return {
      valid: false,
      reason: "missing",
    };
  }

  if (environment === "production" && normalizedSecret.length < 32) {
    return {
      valid: false,
      reason: "weak",
    };
  }

  return {
    valid: true,
    reason: "",
  };
}

export function resolveInternalAutomationSecretFromRequest(request) {
  const authorization = normalizeString(request?.headers?.get?.("authorization"));

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return normalizeString(request?.headers?.get?.("x-internal-automation-secret"));
}

export function internalAutomationSecretsMatch(providedSecret, expectedSecret) {
  const provided = normalizeString(providedSecret);
  const expected = normalizeString(expectedSecret);

  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function getInternalAutomationAuthorizationState(request) {
  const expectedSecret = getInternalAutomationSecret();
  const validation = validateInternalAutomationSecret(expectedSecret);
  const configured = validation.valid;

  if (!configured) {
    return {
      configured,
      authorized: false,
      error: "Internal automation is not configured for this environment.",
      status: 503,
    };
  }

  if (internalAutomationSecretsMatch(resolveInternalAutomationSecretFromRequest(request), expectedSecret)) {
    return {
      configured,
      authorized: true,
      error: "",
      status: 200,
    };
  }

  return {
    configured,
    authorized: false,
    error: "Unauthorized.",
    status: 401,
  };
}

export function isInternalAutomationAuthorized(request) {
  return getInternalAutomationAuthorizationState(request).authorized;
}

export function normalizeAutomationRequestBody(body = {}) {
  const hubSlug = normalizeString(body?.hubSlug);
  const requestedLimit = Number(body?.limit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 25;

  return {
    hubSlug,
    limit,
  };
}

export function normalizeProvisionHubAutomationRequestBody(body = {}) {
  return {
    name: normalizeString(body?.name),
    slug: normalizeString(body?.slug),
    contactEmail: normalizeString(body?.contactEmail),
    customDomain: normalizeString(body?.customDomain),
    template: normalizeString(body?.template),
    theme: normalizeString(body?.theme),
    description: normalizeString(body?.description),
    country: normalizeString(body?.country),
    timezone: normalizeString(body?.timezone),
    locale: normalizeString(body?.locale),
    defaultCurrency: normalizeString(body?.defaultCurrency),
    packageTier: normalizeString(body?.packageTier),
    packageStatus: normalizeString(body?.packageStatus),
    packageSource: normalizeString(body?.packageSource),
  };
}

export function normalizeProvisionOwnerAdminAutomationRequestBody(body = {}) {
  const hubId = normalizeString(body?.hubId);
  const hubSlug = normalizeHubSlug(body?.hubSlug);
  const authUid = normalizeString(body?.authUid);
  const ownerEmail = normalizeEmail(body?.ownerEmail);
  const ownerFullName = normalizeString(body?.ownerFullName);

  assertRequiredString(hubId, "Hub id");
  assertRequiredString(authUid, "Auth uid");
  assertRequiredString(ownerEmail, "Owner email");
  assertRequiredString(ownerFullName, "Owner full name");
  assertValidEmail(ownerEmail, "Owner email");

  return {
    hubId,
    hubSlug,
    authUid,
    ownerEmail,
    ownerFullName,
  };
}

export function normalizeUpdatePackageAuthorityAutomationRequestBody(body = {}) {
  const hubId = normalizeString(body?.hubId);

  assertRequiredString(hubId, "Hub id");

  return {
    hubId,
    ...normalizeUpdateHubPackageAuthorityPayload(body),
  };
}
