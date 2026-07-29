import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readTarget(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const migratedAdminActionFiles = [
  "../../src/app/(admin)/[hubSlug]/admin/admins/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/admins/invite/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/courses/create/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/attendance/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/registrations/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/events/create/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/registrations/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/events/series/[seriesId]/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/members/[memberId]/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/onboarding/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/payments/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/settings/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/settings/legal/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/testimonials/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/testimonials/create/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/testimonials/[testimonialId]/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/what-we-do/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/what-we-do/create/actions.js",
  "../../src/app/(admin)/[hubSlug]/admin/what-we-do/[itemId]/actions.js",
];

const migratedAdminRouteFiles = [
  "../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/attendance/export/route.js",
  "../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/attendance/export/route.js",
  "../../src/app/(admin)/[hubSlug]/admin/payments/export/route.js",
  "../../src/app/api/admin/hubs/[hubSlug]/onboarding/route.js",
  "../../src/app/api/admin/hubs/[hubSlug]/payments/account-session/route.js",
  "../../src/app/api/admin/hubs/[hubSlug]/payments/sync/route.js",
  "../../src/app/api/media/upload/route.js",
];

test("phase 1 shared action-access helpers centralize hub and platform mutation authorization", () => {
  const source = readTarget("../../src/lib/auth/action-access.js");

  assert.match(source, /requireHubOperatorActionAccess/);
  assert.match(source, /requireHubOperatorRouteAccess/);
  assert.match(source, /requireHubOperatorRouteAccessForHub/);
  assert.match(source, /assertActionHubIdMatches/);
  assert.match(source, /requirePlatformOperatorActionAccess/);
  assert.match(source, /requireCurrentSuperadminSession/);
  assert.match(source, /getCurrentHubOperatorAccess/);
  assert.match(source, /actorRole\) === "superadmin"/);
});

test("phase 1 event and course create/edit actions authorize through shared guards", () => {
  const eventCreate = readTarget("../../src/app/(admin)/[hubSlug]/admin/events/create/actions.js");
  const eventEdit = readTarget("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js");
  const courseCreate = readTarget("../../src/app/(admin)/[hubSlug]/admin/courses/create/actions.js");
  const courseEdit = readTarget("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js");

  assert.match(eventCreate, /requireHubOperatorActionAccess/);
  assert.match(eventEdit, /requireHubOperatorActionAccess/);
  assert.match(eventEdit, /assertActionHubIdMatches/);
  assert.match(courseCreate, /requireHubOperatorActionAccess/);
  assert.match(courseEdit, /requireHubOperatorActionAccess/);
  assert.match(courseEdit, /assertActionHubIdMatches/);

  for (const source of [eventCreate, eventEdit, courseCreate, courseEdit]) {
    assert.doesNotMatch(source, /"hub-admin"/);
  }
});

test("phase 1 settings, onboarding, and payments actions authorize through shared guards", () => {
  const settings = readTarget("../../src/app/(admin)/[hubSlug]/admin/settings/actions.js");
  const onboarding = readTarget("../../src/app/(admin)/[hubSlug]/admin/onboarding/actions.js");
  const payments = readTarget("../../src/app/(admin)/[hubSlug]/admin/payments/actions.js");

  assert.match(settings, /requireHubOperatorActionAccess/);
  assert.match(onboarding, /requireHubOperatorActionAccess/);
  assert.match(payments, /requireHubOperatorActionAccess/);

  assert.doesNotMatch(settings, /"hub-admin"/);
  assert.doesNotMatch(onboarding, /"hub-admin"/);
  assert.doesNotMatch(payments, /"hub-admin"/);
});

test("phase 1 admin access management preserves owner-only semantics through shared guards", () => {
  const adminActions = readTarget("../../src/app/(admin)/[hubSlug]/admin/admins/actions.js");
  const inviteActions = readTarget("../../src/app/(admin)/[hubSlug]/admin/admins/invite/actions.js");

  assert.match(adminActions, /requireHubAdminManagerActionAccess/);
  assert.match(adminActions, /canTransferHubOwnership/);
  assert.match(inviteActions, /requireHubAdminManagerActionAccess/);
});

test("phase 1 platform mutations require the shared platform action guard", () => {
  const createHub = readTarget("../../src/app/(platform)/platform/hubs/create/actions.js");
  const inviteAdmin = readTarget("../../src/app/(platform)/platform/hubs/[hubId]/invite-admin/actions.js");
  const supportMode = readTarget("../../src/app/(platform)/platform/support/[hubId]/actions.js");

  for (const source of [createHub, inviteAdmin, supportMode]) {
    assert.match(source, /requirePlatformOperatorActionAccess/);
  }

  assert.doesNotMatch(createHub, /"platform-operator"/);
  assert.doesNotMatch(inviteAdmin, /"platform-operator"/);
});

test("phase 1 migrated browser API routes use shared route guards", () => {
  const onboarding = readTarget("../../src/app/api/admin/hubs/[hubSlug]/onboarding/route.js");
  const accountSession = readTarget("../../src/app/api/admin/hubs/[hubSlug]/payments/account-session/route.js");
  const sync = readTarget("../../src/app/api/admin/hubs/[hubSlug]/payments/sync/route.js");
  const mediaUpload = readTarget("../../src/app/api/media/upload/route.js");

  assert.match(onboarding, /requireHubOperatorRouteAccess/);
  assert.match(accountSession, /requireHubOperatorRouteAccess/);
  assert.match(sync, /requireHubOperatorRouteAccess/);
  assert.match(mediaUpload, /requireHubOperatorRouteAccessForHub/);
});

test("phase 1 migrated admin mutation files no longer use legacy page-level auth patterns", () => {
  for (const relativePath of [...migratedAdminActionFiles, ...migratedAdminRouteFiles]) {
    const source = readTarget(relativePath);

    assert.doesNotMatch(source, /getCurrentHubOperatorAccess/);
    assert.doesNotMatch(source, /requireHubBySlug/);
    assert.doesNotMatch(source, /"hub-admin"/);
  }
});

test("phase 1 migrated admin actions use an action-level guard", () => {
  for (const relativePath of migratedAdminActionFiles) {
    const source = readTarget(relativePath);

    assert.match(source, /requireHub(?:OperatorActionAccess|AdminManagerActionAccess)/);
  }
});

test("phase 1 migrated admin routes use a route-level guard", () => {
  for (const relativePath of migratedAdminRouteFiles) {
    const source = readTarget(relativePath);

    assert.match(source, /requireHubOperatorRouteAccess/);
  }
});
