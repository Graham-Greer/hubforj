import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("booking notification outbox queues reminders from confirmed and immediately eligible flows", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/booking-notification-outbox.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /queueReminderNotification/);
  assert.match(source, /resolveReminderNotificationKind/);
  assert.match(source, /resolveReminderScheduledFor/);
  assert.match(source, /shouldSkipReminderSchedulingForLateBooking/);
  assert.match(source, /isReminderEligible/);
  assert.match(source, /reminder: buildReminderPayload/);
});

test("booking notification processor route requires internal automation auth and runs the outbox processor", () => {
  const routeSource = readFileSync(
    new URL("../../src/app/api/internal/booking-notifications/process/route.js", import.meta.url),
    "utf8"
  );
  const processorSource = readFileSync(
    new URL("../../src/lib/server/booking-notification-processor.js", import.meta.url),
    "utf8"
  );
  const automationSource = readFileSync(
    new URL("../../src/lib/domain/internal-automation.js", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /getInternalAutomationAuthorizationState/);
  assert.match(routeSource, /processBookingNotificationOutbox/);
  assert.match(automationSource, /INTERNAL_AUTOMATION_SECRET|internalAutomationSecret|getInternalAutomationSecret/);
  assert.match(automationSource, /authorization/);
  assert.match(automationSource, /x-internal-automation-secret/);

  assert.match(processorSource, /claimDueNotificationOutboxRecords/);
  assert.match(processorSource, /sendBookingNotificationEmail/);
  assert.match(processorSource, /markNotificationOutboxRecordSent/);
  assert.match(processorSource, /markNotificationOutboxRecordFailed/);
});
