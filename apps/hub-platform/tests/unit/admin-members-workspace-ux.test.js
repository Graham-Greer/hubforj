import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("members workspace uses summary cards and the shared search plus compact-filter pattern", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/members-workspace/MembersWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /StatCard label="Members"/);
  assert.match(source, /StatCard label="Suspended"/);
  assert.match(source, /StatCard label="Upgrade requests"/);
  assert.match(source, /StatCard label="Payment attention"/);
  assert.match(source, /SearchField/);
  assert.match(source, /CompactMenu/);
  assert.match(source, /Button/);
  assert.match(source, /PaginationControls/);
  assert.match(source, /pageSizeOptions=\{\[5, 10, 20\]\}/);
  assert.match(source, /useDebouncedValue/);
  assert.match(source, /useSearchParams/);
  assert.match(source, /router\.replace/);
  assert.match(source, /buildMembersQuery/);
  assert.match(source, /triggerTooltip=\{filter\.label\}/);
  assert.match(source, /Export CSV/);
  assert.match(source, /handleExportCsv/);
  assert.match(source, /Last sign in date/);
  assert.match(source, /window\.URL\.createObjectURL/);
  assert.doesNotMatch(source, /Last seen/);
  assert.doesNotMatch(source, /No recent activity/);
  assert.match(source, /No members match the current view/);
});

test("members page loads the lightweight operational signals for triage", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/members/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /MembersWorkspace/);
  assert.match(source, /listMembershipsByHub/);
  assert.match(source, /listPendingMembershipUpgradeRequestsByHub/);
  assert.match(source, /listEventBookingPaymentItemsByHub/);
  assert.match(source, /listCoursePaymentItemsByHub/);
  assert.match(source, /lastSignedInAt: member\.lastSignedInAt \|\| ""/);
  assert.match(source, /email: member\.email \|\| ""/);
  assert.match(source, /getUserStatusLabel\(member\.status\)/);
  assert.match(source, /key: "lastSeen"/);
  assert.match(source, /"Seen in last 7 days"/);
  assert.match(source, /"Seen in last 30 days"/);
  assert.match(source, /"Seen over 30 days ago"/);
  assert.match(source, /"Never seen"/);
  assert.match(source, /"Upgrade request"/);
  assert.match(source, /"Payment attention"/);
  assert.match(source, /No membership assigned yet\./);
});
