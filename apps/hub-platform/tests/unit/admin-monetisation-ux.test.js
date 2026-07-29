import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("membership plan manager source supports external payment fields and cleaner membership plan guidance", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/MembershipPlanManager.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /name="externalPaymentUrl"/);
  assert.match(source, /name="paymentInstructions"/);
  assert.match(source, /title="Manage membership plans"/);
  assert.match(source, /Manage your community's default plan and create membership upgrade options to suit your needs\./);
  assert.match(source, /Paid membership plans start on Starter/);
  assert.match(source, /Collect payments through an external checkout link/);
  assert.match(source, /bank transfer or manual reference/i);
  assert.match(source, /checkout link, payment instructions, or both/i);
  assert.match(source, /This default free plan is assigned automatically when someone joins your community\./);
  assert.match(source, /Members can move onto this plan after joining when your community wants to offer a higher tier membership option\./);
  assert.match(source, /name="title"[\s\S]*requiredIndicator/);
  assert.match(source, /name="pricingMode"[\s\S]*requiredIndicator/);
  assert.match(source, /name=\{isLockedPaidPlan \? "price_display" : "price"\}[\s\S]*requiredIndicator/);
  assert.match(source, /getHubCurrencySelectOptions/);
  assert.match(source, /name=\{isLockedPaidPlan \? "currency_display" : "currency"\}[\s\S]*options=\{currencyOptions\}/);
  assert.match(source, /Defaults to your hub regional settings\./);
  assert.match(source, /Finish Stripe setup before charging for memberships/);
  assert.match(source, /nativePaymentsBlocked/);
  assert.doesNotMatch(source, /Connect Stripe from the hub admin portal/);
  assert.match(source, /name="durationUnit"[\s\S]*requiredIndicator/);
  assert.match(source, /name="durationValue"[\s\S]*requiredIndicator/);
  assert.match(source, /name="visibility"[\s\S]*requiredIndicator/);
  assert.match(source, /name="status"[\s\S]*requiredIndicator/);
  assert.doesNotMatch(source, /Default membership\.\s*This free plan is assigned automatically when someone joins the hub\./);
  assert.doesNotMatch(source, /Visibility\.\s*This default plan stays public as the hub&apos;s baseline membership and is assigned automatically during join\./);
  assert.doesNotMatch(source, /Keep this plan active and free so every new member has a clear starting point\./);
  assert.doesNotMatch(source, /formatPlanSummary/);
});

test("event admin source distinguishes Starter external payments from Growth built-in payments", () => {
  const createSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/create/CreateEventForm.jsx", import.meta.url),
    "utf8"
  );
  const editSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/EditEventForm.jsx", import.meta.url),
    "utf8"
  );
  const fieldSource = readFileSync(
    new URL("../../src/components/patterns/event-form-fields/EventFormFields.jsx", import.meta.url),
    "utf8"
  );

  assert.match(createSource, /Paid events start on Starter/);
  assert.match(createSource, /External payments are active on Starter/);
  assert.match(createSource, /Finish Stripe setup before charging for events/);
  assert.doesNotMatch(createSource, /Connect Stripe from the hub admin portal/);
  assert.match(editSource, /This paid event pricing is protected on your current package/);
  assert.match(editSource, /Free event edits can continue, but Stripe setup must be completed/);
  assert.doesNotMatch(editSource, /Connect Stripe from the hub admin portal/);
  assert.match(fieldSource, /name="externalPaymentUrl"/);
  assert.match(fieldSource, /name="paymentInstructions"/);
  assert.match(fieldSource, /getHubCurrencySelectOptions/);
  assert.match(fieldSource, /name=\{isLockedPaidEvent \? "currency_display" : "currency"\}[\s\S]*options=\{currencyOptions\}/);
  assert.match(fieldSource, /End time must be after the start time for a single-day event\./);
  assert.match(fieldSource, /hint=\{endTimeHint\}/);
  assert.match(fieldSource, /hintTone=\{hasInvalidSingleDayTimeRange \? "danger" : "neutral"\}/);
  assert.match(fieldSource, /aria-invalid=\{hasInvalidSingleDayTimeRange \? "true" : undefined\}/);
  assert.match(fieldSource, /setCustomValidity/);
  assert.match(fieldSource, /Defaults to your hub regional settings\./);
  assert.match(fieldSource, /name="bookingMode"/);
  assert.match(fieldSource, /name="maxAttendeesPerBooking"/);
  assert.match(fieldSource, /Guest and group bookings are available on the Growth package tier only\./);
  assert.match(fieldSource, /V1 stores guest first and last name for attendance and reporting\./);
  assert.match(fieldSource, /bank transfer or manual reference/i);
  assert.match(fieldSource, /complete payment inside the platform/i);
  assert.match(fieldSource, /type="hidden" name="refundWindowMode" value="custom"/);
  assert.match(fieldSource, /name="refundWindowHours"/);
  assert.match(fieldSource, /name="refundPolicy"/);
  assert.doesNotMatch(createSource, /Built-in payments are active on Growth/);
  assert.doesNotMatch(editSource, /Set the refund policy clearly now/);
});

test("course admin source keeps Starter external payments lighter than Growth built-in controls", () => {
  const createSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/create/CreateCourseForm.jsx", import.meta.url),
    "utf8"
  );
  const editSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/EditCourseForm.jsx", import.meta.url),
    "utf8"
  );
  const fieldSource = readFileSync(
    new URL("../../src/components/patterns/course-form-fields/CourseFormFields.jsx", import.meta.url),
    "utf8"
  );

  assert.match(createSource, /Paid courses start on Starter/);
  assert.match(createSource, /External payments are active on Starter/);
  assert.match(createSource, /Finish Stripe setup before charging for courses/);
  assert.doesNotMatch(createSource, /Connect Stripe from the hub admin portal/);
  assert.match(editSource, /This paid course pricing is protected on your current package/);
  assert.match(editSource, /Upgrade to Growth later for built-in payments/);
  assert.match(editSource, /Free course edits can continue, but Stripe setup must be completed/);
  assert.doesNotMatch(editSource, /Connect Stripe from the hub admin portal/);
  assert.match(fieldSource, /{isPaid \? \(/);
  assert.match(fieldSource, /name="startTime"[\s\S]*required=\{isActive\}/);
  assert.match(fieldSource, /name="endTime"[\s\S]*required=\{isActive\}/);
  assert.match(fieldSource, /name="externalPaymentUrl"/);
  assert.match(fieldSource, /name="paymentInstructions"/);
  assert.match(fieldSource, /getHubCurrencySelectOptions/);
  assert.match(fieldSource, /name=\{isLockedPaidCourse \? "currency_display" : "currency"\}[\s\S]*options=\{currencyOptions\}/);
  assert.match(fieldSource, /name="paymentDeadline"[\s\S]*required=\{isActive\}/);
  assert.match(fieldSource, /Defaults to your hub regional settings\./);
  assert.match(fieldSource, /bank transfer or manual reference/i);
  assert.match(fieldSource, /name="requiresDeposit" value="false"/);
  assert.match(fieldSource, /type="hidden" name="refundWindowMode" value="custom"/);
  assert.match(fieldSource, /name="refundWindowHours"/);
  assert.match(fieldSource, /name="refundPolicy"/);
  assert.doesNotMatch(fieldSource, /className=\{!isPaid \? styles\.fieldHidden : ""\}/);
});

test("admin monetisation forms read payment processing mode from the normalized hub field", () => {
  const membershipSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/MembershipPlanManager.jsx", import.meta.url),
    "utf8"
  );
  const createEventSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/create/CreateEventForm.jsx", import.meta.url),
    "utf8"
  );
  const editEventSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/EditEventForm.jsx", import.meta.url),
    "utf8"
  );
  const createCourseSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/create/CreateCourseForm.jsx", import.meta.url),
    "utf8"
  );
  const editCourseSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/EditCourseForm.jsx", import.meta.url),
    "utf8"
  );

  assert.match(membershipSource, /packagePaymentProcessingMode/);
  assert.match(createEventSource, /packagePaymentProcessingMode/);
  assert.match(createEventSource, /paymentSetupState/);
  assert.match(editEventSource, /packagePaymentProcessingMode/);
  assert.match(editEventSource, /paymentSetupState/);
  assert.match(createEventSource, /groupBookingsEnabled/);
  assert.match(editEventSource, /groupBookingsEnabled/);
  assert.match(createCourseSource, /packagePaymentProcessingMode/);
  assert.match(createCourseSource, /paymentSetupState/);
  assert.match(editCourseSource, /packagePaymentProcessingMode/);
  assert.match(editCourseSource, /paymentSetupState/);

  assert.doesNotMatch(membershipSource, /packageCapabilities\?\.paymentProcessingMode/);
  assert.doesNotMatch(createEventSource, /packageCapabilities\?\.paymentProcessingMode/);
  assert.doesNotMatch(editEventSource, /packageCapabilities\?\.paymentProcessingMode/);
  assert.doesNotMatch(createCourseSource, /packageCapabilities\?\.paymentProcessingMode/);
  assert.doesNotMatch(editCourseSource, /packageCapabilities\?\.paymentProcessingMode/);
});

test("admin monetisation create flows seed commercial defaults from the hub regional settings", () => {
  const membershipSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/MembershipPlanManager.jsx", import.meta.url),
    "utf8"
  );
  const createEventSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/create/CreateEventForm.jsx", import.meta.url),
    "utf8"
  );
  const createCourseSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/create/CreateCourseForm.jsx", import.meta.url),
    "utf8"
  );

  assert.match(membershipSource, /currency:\s*hub\.defaultCurrency/);
  assert.match(membershipSource, /useActionState\(createMembershipPlanAction, seededState\)/);
  assert.match(createEventSource, /currency:\s*hub\.defaultCurrency/);
  assert.match(createEventSource, /useActionState\(createEventAction, seededState\)/);
  assert.match(createCourseSource, /currency:\s*hub\.defaultCurrency/);
  assert.match(createCourseSource, /useActionState\(createCourseAction, seededState\)/);
  assert.match(createCourseSource, /timezone:\s*.*hub\.timezone.*"America\/New_York"/);
  assert.match(membershipSource, /"USD"/);
  assert.match(createEventSource, /"USD"/);
  assert.match(createCourseSource, /"USD"/);
});

test("account settings package highlights distinguish locked monetisation from external and built-in payments", () => {
  const source = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/settings/account/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /Built-in payments/);
  assert.match(source, /External payments/);
  assert.match(source, /Paid offerings locked/);
  assert.match(source, /resolvePackageManagementHandoff/);
  assert.match(source, /Manage package changes and billing through your commercial account area\./);
});
