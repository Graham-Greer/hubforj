import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHubAdminInviteAcceptUrl,
  resolveHubAdminInviteOrigin,
} from "../../src/lib/domain/admin-invite-links.js";

test("hub admin invite links default to the Hubforj hosted path when no custom domain is connected", () => {
  const hub = {
    slug: "oak-hub",
    customDomain: {
      status: "pending_verification",
      hostname: "oak.example.com",
    },
  };

  if (process.env.NODE_ENV !== "production") {
    assert.equal(resolveHubAdminInviteOrigin(hub), "http://localhost:3000");
    assert.equal(
      buildHubAdminInviteAcceptUrl(hub, "signed.token"),
      "http://localhost:3000/oak-hub/join?invite=signed.token"
    );
    return;
  }

  assert.equal(resolveHubAdminInviteOrigin(hub), "https://community.hubforj.com");
  assert.equal(buildHubAdminInviteAcceptUrl(hub, "signed.token"), "https://community.hubforj.com/oak-hub/join?invite=signed.token");
});

test("hub admin invite links prefer a connected custom domain", () => {
  const hub = {
    slug: "oak-hub",
    customDomain: {
      status: "connected",
      hostname: "community.example.com",
    },
  };

  assert.equal(
    resolveHubAdminInviteOrigin(hub),
    "http://community.example.com"
  );
  assert.equal(
    buildHubAdminInviteAcceptUrl(hub, "signed.token"),
    "http://community.example.com/join?invite=signed.token"
  );
});

test("hub admin invite links preserve the configured runtime protocol and port when a hub base url is available", () => {
  const hub = {
    slug: "oak-hub",
    customDomain: {
      status: "not_configured",
      hostname: "",
    },
  };

  assert.equal(
    resolveHubAdminInviteOrigin(hub, { hubPlatformBaseUrl: "http://localhost:3000" }),
    "http://localhost:3000"
  );
  assert.equal(
    buildHubAdminInviteAcceptUrl(hub, "signed.token", { hubPlatformBaseUrl: "http://localhost:3000" }),
    "http://localhost:3000/oak-hub/join?invite=signed.token"
  );
});

test("hub admin invite links can fall back to the configured product site base url during local development", () => {
  const hub = {
    slug: "oak-hub",
    customDomain: {
      status: "not_configured",
      hostname: "",
    },
  };

  assert.equal(
    resolveHubAdminInviteOrigin(hub, { productSiteBaseUrl: "http://localhost:3001" }),
    "http://localhost:3001"
  );
  assert.equal(
    buildHubAdminInviteAcceptUrl(hub, "signed.token", { productSiteBaseUrl: "http://localhost:3001" }),
    "http://localhost:3001/oak-hub/join?invite=signed.token"
  );
});

test("hub admin invite links keep hosted hubs under the configured production base URL", () => {
  const hub = {
    slug: "oak-hub",
    customDomain: {
      status: "not_configured",
      hostname: "",
    },
  };

  assert.equal(
    resolveHubAdminInviteOrigin(hub, { hubPlatformBaseUrl: "https://community.hubforj.com" }),
    "https://community.hubforj.com"
  );
  assert.equal(
    buildHubAdminInviteAcceptUrl(hub, "signed.token", { hubPlatformBaseUrl: "https://community.hubforj.com" }),
    "https://community.hubforj.com/oak-hub/join?invite=signed.token"
  );
});
