import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSiteSettingsRecord,
  resolvePublicHeaderNav,
} from "../../src/lib/domain/public-site.js";

test("resolvePublicHeaderNav builds public nav from hub slug", () => {
  const config = resolvePublicHeaderNav({ slug: "oak-hill" });

  assert.equal(config[0].href, "/oak-hill");
  assert.equal(config[1].href, "/oak-hill/events");
  assert.deepEqual(config.at(-1), { label: "Testimonials", href: "/oak-hill/testimonials" });
});

test("resolvePublicHeaderNav can build host-local public nav", () => {
  const config = resolvePublicHeaderNav({ slug: "oak-hill" }, undefined, "host");

  assert.equal(config[0].href, "/");
  assert.equal(config[1].href, "/events");
  assert.deepEqual(config.at(-1), { label: "Testimonials", href: "/testimonials" });
});

test("normalizeSiteSettingsRecord falls back to hub values and normalizes theme", () => {
  const settings = normalizeSiteSettingsRecord(
    { id: "hub_1", name: "Oak Hill", theme: "dark" },
    { siteName: "", contactEmail: " hello@example.com ", themeKey: "light", logoAssetId: "asset_logo", logoAlt: "Oak Hill logo" }
  );

  assert.equal(settings.hubId, "hub_1");
  assert.equal(settings.siteName, "Oak Hill");
  assert.equal(settings.contactEmail, "hello@example.com");
  assert.equal(settings.logoAssetId, "asset_logo");
  assert.equal(settings.logoAlt, "Oak Hill logo");
  assert.equal(settings.themeKey, "light");
});

test("normalizeSiteSettingsRecord maps internal homepage actions onto public hrefs", () => {
  const settings = normalizeSiteSettingsRecord(
    { id: "hub_1", slug: "oak-hill", name: "Oak Hill" },
    {
      homePage: {
        hero: {
          actions: [
            { label: "Join", destination: "join", variant: "primary" },
            { label: "View events", destination: "events", variant: "secondary" },
          ],
        },
      },
    }
  );

  assert.equal(settings.homePage.hero.actions.length, 2);
  assert.deepEqual(settings.homePage.hero.actions[0], {
    label: "Join",
    type: "internal",
    destination: "join",
    href: "/oak-hill/join",
    variant: "primary",
  });
  assert.equal(settings.homePage.hero.actions[1].href, "/oak-hill/events");
});

test("normalizeSiteSettingsRecord can map internal homepage actions onto host-local hrefs", () => {
  const settings = normalizeSiteSettingsRecord(
    { id: "hub_1", slug: "oak-hill", name: "Oak Hill" },
    {
      homePage: {
        hero: {
          actions: [
            { label: "Join", destination: "join", variant: "primary" },
            { label: "View events", destination: "events", variant: "secondary" },
          ],
        },
      },
    },
    { routeMode: "host" }
  );

  assert.equal(settings.homePage.hero.actions.length, 2);
  assert.equal(settings.homePage.hero.actions[0].href, "/join");
  assert.equal(settings.homePage.hero.actions[1].href, "/events");
});
