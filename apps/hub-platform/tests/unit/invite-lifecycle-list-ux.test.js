import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("invite lifecycle list uses a compact menu for invite actions", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/invite-lifecycle-list/InviteLifecycleList.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /CompactMenu/);
  assert.match(source, /triggerTooltip="Invite actions"/);
  assert.match(source, /<Icon name="more_vert"/);
  assert.doesNotMatch(source, />\s*Resend invite\s*<\/Button>/);
  assert.doesNotMatch(source, />\s*Revoke invite\s*<\/Button>/);
});
