import test from "node:test";
import assert from "node:assert/strict";
import { buildHubAuthHref, resolveHubAuthRedirect } from "../../src/lib/auth/hub-auth-redirects.js";

test("admin redirects never resolve to member-only account routes", () => {
  assert.equal(
    resolveHubAuthRedirect("second-community", "admin", "/second-community/account"),
    "/second-community/admin"
  );
  assert.equal(
    resolveHubAuthRedirect("second-community", "owner", "/second-community/account"),
    "/second-community/admin"
  );
});

test("admin redirects never resolve to member-only offering next-steps routes", () => {
  assert.equal(
    resolveHubAuthRedirect(
      "second-community",
      "admin",
      "/second-community/events/spring-gala/booking/next-steps"
    ),
    "/second-community/admin"
  );
  assert.equal(
    resolveHubAuthRedirect(
      "second-community",
      "admin",
      "/second-community/courses/leadership-cohort/enrolment/next-steps"
    ),
    "/second-community/admin"
  );
});

test("member redirects never resolve to admin-only routes", () => {
  assert.equal(
    resolveHubAuthRedirect("second-community", "member", "/second-community/admin"),
    "/second-community/account"
  );
});

test("hub auth redirects allow valid public routes", () => {
  assert.equal(
    resolveHubAuthRedirect("second-community", "member", "/second-community/events"),
    "/second-community/events"
  );
});

test("hub auth redirects ignore auth route loops and fall back by role", () => {
  assert.equal(
    resolveHubAuthRedirect("second-community", "member", "/second-community/sign-in"),
    "/second-community/account"
  );
  assert.equal(
    resolveHubAuthRedirect("second-community", "admin", "/second-community/join"),
    "/second-community/admin"
  );
});

test("hub auth redirects support host-local paths on subdomains and custom domains", () => {
  assert.equal(
    resolveHubAuthRedirect("second-community", "member", "/events", "host"),
    "/events"
  );

  assert.equal(
    resolveHubAuthRedirect("second-community", "member", "/sign-in", "host"),
    "/account"
  );

  assert.equal(
    resolveHubAuthRedirect("second-community", "admin", "/account", "host"),
    "/admin"
  );

  assert.equal(
    buildHubAuthHref("second-community", "sign-in", "/account", "host"),
    "/sign-in?next=%2Faccount"
  );
});
