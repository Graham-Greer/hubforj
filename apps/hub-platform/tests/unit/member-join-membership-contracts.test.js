import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub creation source seeds the default membership plan", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/hub-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /buildDefaultMembershipPlanWriteModel/);
  assert.match(source, /buildDefaultMembershipPlanWriteModel\(ref\.id, actorId, now, writeModel\.defaultCurrency \|\| "USD"\)/);
  assert.match(source, /await batch\.commit\(\)/);
});

test("member join route assigns the default membership and defaults back to the public site", () => {
  const routeSource = readFileSync(
    new URL("../../src/app/api/auth/member/join/route.js", import.meta.url),
    "utf8"
  );

  assert.match(routeSource, /assignDefaultMembershipToUser/);
  assert.match(routeSource, /await assignDefaultMembershipToUser\(hub\.id, userRef\.id, decodedToken\.uid\)/);
  assert.match(routeSource, /const nextPath = normalizeString\(body\?\.nextPath\) \|\| `\/\$\{hubSlug\}`/);
  assert.doesNotMatch(routeSource, /`\/\$\{hubSlug\}\/account`/);
});

test("member join page and form default redirects stay on the public site", () => {
  const pageSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/join/page.jsx", import.meta.url),
    "utf8"
  );
  const formSource = readFileSync(
    new URL("../../src/app/(hub)/[hubSlug]/join/MemberJoinForm.jsx", import.meta.url),
    "utf8"
  );

  assert.match(pageSource, /resolvedSearchParams\?\.next \|\| `\/\$\{hub\.slug\}`/);
  assert.doesNotMatch(pageSource, /`\/\$\{hub\.slug\}\/account`/);
  assert.match(formSource, /router\.replace\(String\(result\.redirectTo \|\| \(routeMode === "host" \? "\/" : `\/\$\{hubSlug\}`\)\)\)/);
  assert.doesNotMatch(formSource, /`\/\$\{hubSlug\}\/account`/);
});

test("admin navigation and membership plan workspace use membership-plan language", () => {
  const navSource = readFileSync(
    new URL("../../src/lib/navigation/hub-admin-nav.js", import.meta.url),
    "utf8"
  );
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/hub-payments-workspace/MembershipPlanManager.jsx", import.meta.url),
    "utf8"
  );

  assert.match(navSource, /label: "Membership plans"/);
  assert.doesNotMatch(navSource, /label: "Payment plans"/);
  assert.match(workspaceSource, /eyebrow="Membership plans"/);
});

test("membership user record source exposes a shared revert-to-default helper", () => {
  const source = readFileSync(
    new URL("../../src/lib/data/membership-user-records.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /revertMembershipToDefaultPlanForUser/);
  assert.match(source, /This member is already on the default membership plan\./);
  assert.match(source, /Reverted to the default membership plan\./);
});
