import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProvisionOwnerAdminAutomationRequestBody } from "../../src/lib/domain/internal-automation.js";

test("owner-admin automation payload normalizes the owner activation request", () => {
  assert.deepEqual(
    normalizeProvisionOwnerAdminAutomationRequestBody({
      hubId: "hub_123",
      hubSlug: " First Community ",
      authUid: "auth_123",
      ownerEmail: "OWNER@Example.com ",
      ownerFullName: "Jordan Smith",
    }),
    {
      hubId: "hub_123",
      hubSlug: "first-community",
      authUid: "auth_123",
      ownerEmail: "owner@example.com",
      ownerFullName: "Jordan Smith",
    }
  );
});

test("owner-admin automation payload requires the commercial owner identity", () => {
  assert.throws(
    () =>
      normalizeProvisionOwnerAdminAutomationRequestBody({
        hubId: "hub_123",
        hubSlug: "first-community",
        authUid: "",
        ownerEmail: "owner@example.com",
        ownerFullName: "",
      }),
    /Auth uid is required|Owner full name is required/
  );
});
