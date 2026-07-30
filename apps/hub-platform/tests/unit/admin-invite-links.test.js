import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHubAdminInviteAcceptUrl,
  resolveHubAdminInviteOrigin,
} from "../../src/lib/domain/admin-invite-links.js";

test("hub admin invite links default to the Hubforj tenant hostname when no custom domain is connected", () => {
  const hub = {
    slug: "oakhub",
    customDomain: {
      status: "pending_verification",
      hostname: "oak.example.com",
    },
  };

  if (process.env.NODE_ENV !== "production") {
    assert.equal(resolveHubAdminInviteOrigin(hub), "http://localhost:3000");
    assert.equal(
      buildHubAdminInviteAcceptUrl(hub, "signed.token"),
      "http://localhost:3000/oakhub/join?invite=signed.token"
    );
    return;
  }

  assert.equal(resolveHubAdminInviteOrigin(hub), "https://oakhub.hubforj.com");
  assert.equal(buildHubAdminInviteAcceptUrl(hub, "signed.token"), "https://oakhub.hubforj.com/join?invite=signed.token");
});

test("hub admin invite links prefer a connected custom domain", () => {
  const hub = {
    slug: "oakhub",
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
    slug: "oakhub",
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
    "http://localhost:3000/oakhub/join?invite=signed.token"
  );
});

test("hub admin invite links can fall back to the configured product site base url during local development", () => {
  const hub = {
    slug: "oakhub",
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
    "http://localhost:3001/oakhub/join?invite=signed.token"
  );
});

test("hub admin invite links use tenant hostnames with the configured production protocol", () => {
  const hub = {
    slug: "oakhub",
    customDomain: {
      status: "not_configured",
      hostname: "",
    },
  };

  assert.equal(
    resolveHubAdminInviteOrigin(hub, { hubPlatformBaseUrl: "https://community.hubforj.com" }),
    "https://oakhub.hubforj.com"
  );
  assert.equal(
    buildHubAdminInviteAcceptUrl(hub, "signed.token", { hubPlatformBaseUrl: "https://community.hubforj.com" }),
    "https://oakhub.hubforj.com/join?invite=signed.token"
  );
});
