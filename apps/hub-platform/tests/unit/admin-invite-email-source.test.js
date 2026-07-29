import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub-platform server env includes invite email delivery configuration", () => {
  const source = readFileSync(
    new URL("../../src/lib/config/env.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /hubPlatformBaseUrl/);
  assert.match(source, /resendApiKey/);
  assert.match(source, /resendFromEmail/);
});

test("invite records preserve delivery metadata for email-backed admin onboarding", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/invites.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /deliveryStatus/);
  assert.match(source, /emailSentAt/);
  assert.match(source, /lastEmailAttemptAt/);
  assert.match(source, /deliveryError/);
  assert.match(source, /markAdminInviteDelivery/);
});

test("admin invite surfaces now describe real email delivery", () => {
  const adminFormSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/admins/invite/AdminInviteForm.jsx", import.meta.url),
    "utf8"
  );
  const adminPageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/admins/page.jsx", import.meta.url),
    "utf8"
  );

  assert.match(adminFormSource, /Send invite email/);
  assert.match(adminPageSource, /Invite email sent\./);
  assert.match(adminPageSource, /inviteCreatedLogged/);
  assert.match(adminPageSource, /buildHubAdminInviteAcceptUrl/);
});

test("admin invite email formatting uses the launch formatting locale instead of raw hub locale or hardcoded UK locale", () => {
  const source = readFileSync(
    new URL("../../src/lib/server/admin-invite-email.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /getFallbackRegionalMarket/);
  assert.match(source, /resolveLaunchFormattingLocale/);
  assert.match(source, /resolveLaunchFormattingLocale\(hub\?\.locale, hub\?\.country\)/);
  assert.doesNotMatch(source, /hub\?\.locale \|\| "en-GB"/);
});
