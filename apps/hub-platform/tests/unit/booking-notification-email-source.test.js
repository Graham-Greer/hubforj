import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("booking notification sender normalizes provider response fields and logs safely without Resend config", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/booking-notification-email.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /renderBookingNotificationEmail/);
  assert.match(source, /sendResendEmail/);
  assert.match(source, /status: "logged"/);
  assert.match(source, /status: "sent"/);
  assert.match(source, /status: "failed"/);
  assert.match(source, /attemptedAt/);
  assert.match(source, /sentAt/);
  assert.match(source, /provider: "resend"/);
  assert.match(source, /providerMessageId/);
  assert.match(source, /error/);
  assert.match(source, /buildCommunitySenderAddress/);
  assert.match(source, /via Hubforj/);
});
