import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const securityTargets = {
  adminActions: [
    "../../src/app/(admin)/[hubSlug]/admin/events/create/actions.js",
    "../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js",
    "../../src/app/(admin)/[hubSlug]/admin/courses/create/actions.js",
    "../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js",
    "../../src/app/(admin)/[hubSlug]/admin/members/[memberId]/actions.js",
    "../../src/app/(admin)/[hubSlug]/admin/settings/actions.js",
  ],
  adminRoutes: [
    "../../src/app/api/admin/hubs/[hubSlug]/onboarding/route.js",
    "../../src/app/api/admin/hubs/[hubSlug]/payments/account-session/route.js",
    "../../src/app/api/admin/hubs/[hubSlug]/payments/sync/route.js",
    "../../src/app/api/media/upload/route.js",
    "../../src/app/api/member/avatar/route.js",
  ],
  platformActions: [
    "../../src/app/(platform)/platform/hubs/create/actions.js",
    "../../src/app/(platform)/platform/hubs/[hubId]/invite-admin/actions.js",
    "../../src/app/(platform)/platform/support/[hubId]/actions.js",
  ],
  internalAutomation: [
    "../../src/lib/config/env.js",
    "../../src/lib/domain/custom-domain-runtime-config.js",
    "../../../product-site/src/lib/config/env.js",
    "../../../product-site/src/lib/server/provision-hub.js",
    "../../../product-site/src/lib/server/provision-owner-admin.js",
    "../../../product-site/src/lib/server/hub-package-authority.js",
  ],
  stripeConnectWebhook: [
    "../../src/lib/server/hub-payment-webhooks.js",
    "../../src/app/api/stripe/webhooks/route.js",
  ],
  uploads: [
    "../../src/lib/domain/media.js",
    "../../src/app/api/media/upload/route.js",
    "../../src/app/api/member/avatar/route.js",
  ],
};

function readTarget(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("security remediation phase 0 tracks the source files that must be guarded", () => {
  for (const paths of Object.values(securityTargets)) {
    for (const relativePath of paths) {
      assert.equal(
        existsSync(new URL(relativePath, import.meta.url)),
        true,
        `${relativePath} should remain in the security remediation inventory`
      );
    }
  }
});

test("security remediation phase 0 keeps Stripe webhook signature verification in the safety baseline", () => {
  const routeSource = readTarget("../../src/app/api/stripe/webhooks/route.js");
  const productRouteSource = readTarget("../../../product-site/src/app/api/stripe/webhooks/route.js");

  assert.match(routeSource, /constructEvent/);
  assert.match(routeSource, /stripe-signature/);
  assert.match(productRouteSource, /constructEvent/);
  assert.match(productRouteSource, /stripe-signature/);
});

test("admin mutation actions use the shared hub action access guard", { todo: true }, () => {});

test("admin mutation API routes use shared route access guards", { todo: true }, () => {});

test("platform mutation actions use the shared platform action access guard", { todo: true }, () => {});

test("automation integrations use INTERNAL_AUTOMATION_SECRET as the canonical secret", { todo: true }, () => {});

test("Stripe Connect webhook reconciliation asserts connected-account ownership before mutation", { todo: true }, () => {});

test("upload entry points use the shared upload policy and file-signature validator", { todo: true }, () => {});
