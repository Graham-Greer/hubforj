import test from "node:test";
import assert from "node:assert/strict";
import {
  internalAutomationSecretsMatch,
  normalizeAutomationRequestBody,
  resolveInternalAutomationSecretFromRequest,
  validateInternalAutomationSecret,
} from "../../src/lib/domain/internal-automation.js";

test("normalizeAutomationRequestBody normalizes hub slug and clamps invalid limits", () => {
  assert.deepEqual(normalizeAutomationRequestBody({ hubSlug: " second-community ", limit: 10 }), {
    hubSlug: "second-community",
    limit: 10,
  });

  assert.deepEqual(normalizeAutomationRequestBody({ hubSlug: "", limit: -5 }), {
    hubSlug: "",
    limit: 25,
  });

  assert.deepEqual(normalizeAutomationRequestBody({ hubSlug: "oak-hill", limit: 999 }), {
    hubSlug: "oak-hill",
    limit: 100,
  });
});

test("internal automation secret validation rejects missing placeholders and weak production secrets", () => {
  assert.deepEqual(validateInternalAutomationSecret(""), {
    valid: false,
    reason: "missing",
  });
  assert.deepEqual(validateInternalAutomationSecret("replace-me"), {
    valid: false,
    reason: "missing",
  });
  assert.deepEqual(validateInternalAutomationSecret("short-secret", "production"), {
    valid: false,
    reason: "weak",
  });
  assert.deepEqual(validateInternalAutomationSecret("a".repeat(32), "production"), {
    valid: true,
    reason: "",
  });
});

test("internal automation request auth prefers bearer secret and falls back to legacy header transport", () => {
  const bearerRequest = {
    headers: new Map([
      ["authorization", "Bearer shared-secret"],
      ["x-internal-automation-secret", "legacy-header-secret"],
    ]),
  };
  const headerRequest = {
    headers: new Map([
      ["x-internal-automation-secret", "legacy-header-secret"],
    ]),
  };

  assert.equal(resolveInternalAutomationSecretFromRequest(bearerRequest), "shared-secret");
  assert.equal(resolveInternalAutomationSecretFromRequest(headerRequest), "legacy-header-secret");
});

test("internal automation secret comparison uses exact constant-time-compatible matching", () => {
  assert.equal(internalAutomationSecretsMatch("shared-secret", "shared-secret"), true);
  assert.equal(internalAutomationSecretsMatch("shared-secret", "other-secret"), false);
  assert.equal(internalAutomationSecretsMatch("short", "shared-secret"), false);
  assert.equal(internalAutomationSecretsMatch("", "shared-secret"), false);
});
