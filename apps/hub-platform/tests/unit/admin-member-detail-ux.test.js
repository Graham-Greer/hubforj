import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("member detail route uses a flatter header and unified membership workflow", () => {
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/AdminMemberDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const identitySource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberIdentitySection.jsx", import.meta.url),
    "utf8"
  );
  const membershipSource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberMembershipSection.jsx", import.meta.url),
    "utf8"
  );
  const statsSource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberStatsRow.jsx", import.meta.url),
    "utf8"
  );
  const actionsSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/members/[memberId]/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(workspaceSource, /MemberStateSection/);
  assert.match(workspaceSource, /<MemberIdentitySection hub=\{hub\} user=\{detail\.user\} statusAction=\{statusAction\} membersQuery=\{membersQuery\} \/>/);
  assert.match(workspaceSource, /membershipPlans=\{membershipPlans\}/);
  assert.match(workspaceSource, /membershipAction=\{membershipAction\}/);
  assert.match(workspaceSource, /membersQuery=\{membersQuery\}/);
  assert.match(identitySource, /PageHeader/);
  assert.match(identitySource, /Review identity, membership, bookings, and payment context in one place\./);
  assert.match(identitySource, /getMemberStatusAction/);
  assert.match(identitySource, /Back to members/);
  assert.match(identitySource, /membersQuery/);
  assert.match(identitySource, /label="Created"/);
  assert.match(identitySource, /label="Last seen"/);
  assert.match(identitySource, /resolveLaunchFormattingLocale/);
  assert.match(identitySource, /const locale = resolveLaunchFormattingLocale\(hub\.locale, hub\.country\)/);
  assert.match(identitySource, /formatAdminDate\(user\.lastSignedInAt, locale\)/);
  assert.match(identitySource, /label="Email"/);
  assert.match(identitySource, /className=\{styles\.detailList\}/);
  assert.doesNotMatch(identitySource, /Current status/);
  assert.doesNotMatch(identitySource, /WorkspaceSection/);
  assert.match(membershipSource, /MemberMembershipProvisioningSection/);
  assert.match(membershipSource, /embedded/);
  assert.match(membershipSource, /membersQuery/);
  assert.match(membershipSource, /Update membership assignment/);
  assert.match(membershipSource, /Default plan scheduled/);
  assert.match(membershipSource, /Schedule return to default plan/);
  assert.match(membershipSource, /Cancel scheduled return/);
  assert.match(workspaceSource, /revertMembershipAction=\{revertMembershipAction\}/);
  assert.match(workspaceSource, /cancelScheduledMembershipChangeAction=\{cancelScheduledMembershipChangeAction\}/);
  assert.match(actionsSource, /revertMemberToDefaultMembershipAction/);
  assert.match(actionsSource, /scheduleMembershipDefaultPlanDowngradeForUser/);
  assert.match(actionsSource, /cancelScheduledMemberMembershipDowngradeAction/);
  assert.doesNotMatch(membershipSource, /Free membership plans are always treated as settled/);
  assert.doesNotMatch(statsSource, /Event registrations/);
  assert.doesNotMatch(statsSource, /Course enrolments/);
  assert.match(actionsSource, /buildMemberDetailRedirect/);
  assert.match(actionsSource, /membersQuery/);
});

test("member detail activity section consolidates event and course history and hides free-payment noise", () => {
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/AdminMemberDetailWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const activitySource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberRegistrationsSection.jsx", import.meta.url),
    "utf8"
  );
  const paginationSource = readFileSync(
    new URL("../../src/components/patterns/pagination-controls/PaginationControls.jsx", import.meta.url),
    "utf8"
  );
  const provisioningSource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberMembershipProvisioningSection.jsx", import.meta.url),
    "utf8"
  );
  assert.match(workspaceSource, /buildMemberActivityItems/);
  assert.match(workspaceSource, /Booking activity/);
  assert.match(workspaceSource, /Events and courses/);
  assert.match(activitySource, /Badge tone="neutral">\{getTypeLabel\(item\.kind\)\}/);
  assert.match(activitySource, /item\.paymentStatus === "not_required"/);
  assert.match(activitySource, /PaginationControls/);
  assert.match(activitySource, /pageSizeOptions=\{\[5, 10\]\}/);
  assert.match(paginationSource, /CompactMenu/);
  assert.match(paginationSource, /Change items per page/);
  assert.match(paginationSource, /Page \{safeCurrentPage\} of \{totalPages\}/);
  assert.doesNotMatch(provisioningSource, /baseline assigned when someone joins the hub/i);
  assert.match(provisioningSource, /Assign a membership plan, update status, and adjust renewal details\./);
});

test("member detail payment history renders free event and course records as Free", () => {
  const paymentHistorySource = readFileSync(
    new URL("../../src/components/patterns/admin-member-detail-workspace/MemberPaymentHistorySection.jsx", import.meta.url),
    "utf8"
  );

  assert.match(paymentHistorySource, /item\.paymentStatus === "not_required"/);
  assert.match(paymentHistorySource, /Number\(item\.amountMinor\) === 0/);
  assert.match(paymentHistorySource, /return "Free"/);
});
