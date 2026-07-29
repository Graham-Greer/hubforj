import test from "node:test";
import assert from "node:assert/strict";
import { isStaticOrApiPath, resolveHubHostContext, resolveHubRuntimeRouteMode } from "../../src/lib/domain/hub-hosts.js";

test("resolveHubHostContext identifies platform subdomains and custom-domain candidates", () => {
  assert.deepEqual(
    resolveHubHostContext("second-community.hubforj.com"),
    {
      kind: "platform_subdomain",
      host: "second-community.hubforj.com",
      hubSlug: "",
      subdomainLabel: "second-community",
      platformRootDomain: "hubforj.com",
    }
  );

  assert.deepEqual(
    resolveHubHostContext("app.hubforj.com"),
    {
      kind: "platform_root",
      host: "app.hubforj.com",
      hubSlug: "",
      subdomainLabel: "",
      platformRootDomain: "hubforj.com",
    }
  );

  assert.deepEqual(
    resolveHubHostContext("localhost:3000"),
    {
      kind: "platform_root",
      host: "localhost",
      hubSlug: "",
      subdomainLabel: "",
      platformRootDomain: "hubforj.com",
    }
  );

  assert.deepEqual(
    resolveHubHostContext("oak-hill.localhost:3000"),
    {
      kind: "local_subdomain",
      host: "oak-hill.localhost",
      hubSlug: "",
      subdomainLabel: "oak-hill",
      platformRootDomain: "hubforj.com",
    }
  );

  assert.deepEqual(
    resolveHubHostContext("www.seconddomain.com"),
    {
      kind: "custom_domain_candidate",
      host: "www.seconddomain.com",
      hubSlug: "",
      subdomainLabel: "",
      platformRootDomain: "hubforj.com",
    }
  );
});

test("isStaticOrApiPath filters paths that should bypass host rewriting", () => {
  assert.equal(isStaticOrApiPath("/api/internal/custom-domains/run"), true);
  assert.equal(isStaticOrApiPath("/_next/static/chunk.js"), true);
  assert.equal(isStaticOrApiPath("/favicon.ico"), true);
  assert.equal(isStaticOrApiPath("/about"), false);
});

test("resolveHubRuntimeRouteMode distinguishes host-based and path-based hub routing", () => {
  assert.equal(resolveHubRuntimeRouteMode("oak-hill.hubforj.com"), "host");
  assert.equal(resolveHubRuntimeRouteMode("oak-hill.localhost:3000"), "host");
  assert.equal(resolveHubRuntimeRouteMode("members.oakhill.org"), "host");
  assert.equal(resolveHubRuntimeRouteMode("app.hubforj.com"), "path");
  assert.equal(resolveHubRuntimeRouteMode("localhost:3000"), "path");
});
