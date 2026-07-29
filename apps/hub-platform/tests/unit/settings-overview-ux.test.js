import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("site settings overview keeps only site configuration panels with task-specific actions", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/settings-overview/SettingsOverview.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /Regional setup/);
  assert.match(source, /Complete regional setup/);
  assert.match(source, /Edit brand settings/);
  assert.match(source, /Edit site settings/);
  assert.match(source, /Finish Stripe setup/);
  assert.doesNotMatch(source, /Account settings/);
  assert.doesNotMatch(source, /Open panel/);
  assert.match(source, /deriveBrandingSettingsPanelStatus/);
  assert.match(source, /deriveSiteSettingsPanelStatus/);
  assert.match(source, /getHubRegionalOnboardingHref/);
});

test("site settings overview cards pin actions consistently", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/settings-panel-card/SettingsPanelCard.module.css", import.meta.url),
    "utf8"
  );

  assert.match(source, /grid-template-rows: minmax\(0, 1fr\) auto;/);
  assert.match(source, /height: 100%;/);
  assert.match(source, /\.actions\s*\{/);
});

test("site settings nav stays active for branding and site routes", () => {
  const navSource = readFileSync(
    new URL("../../src/lib/navigation/hub-admin-nav.js", import.meta.url),
    "utf8"
  );
  const sidebarSource = readFileSync(
    new URL("../../src/components/patterns/platform-sidebar/PlatformSidebar.jsx", import.meta.url),
    "utf8"
  );

  assert.match(navSource, /activeMatchPrefixes: \[`.*\/settings\/branding`, `.*\/settings\/site`\]/s);
  assert.match(navSource, /Launch setup/);
  assert.match(navSource, /label: "Regional setup"/);
  assert.match(navSource, /locked: !regionalSetupComplete/);
  assert.match(sidebarSource, /activeMatchPrefixes/);
});

test("settings overview statuses expose reusable completion states", () => {
  const source = readFileSync(
    new URL("../../src/lib/domain/site-settings.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /label: "Complete", tone: "success"/);
  assert.match(source, /label: "Needs attention", tone: "warning"/);
  assert.match(source, /label: "Partially configured", tone: "accent"/);
  assert.match(source, /label: "Planned", tone: "neutral"/);
  assert.match(source, /isHubRegionalSetupComplete/);
  assert.match(source, /siteSettings\.hub\?\.country/);
  assert.match(source, /siteSettings\.hub\?\.defaultCurrency/);
  assert.match(source, /export function deriveHomepageSettingsPanelStatus/);
  assert.match(source, /export function deriveEventsPageSettingsPanelStatus/);
  assert.match(source, /export function deriveCoursesPageSettingsPanelStatus/);
});

test("site settings form exposes regional defaults and locks country after Stripe setup begins", () => {
  const formSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/settings/site/SiteSettingsForm.jsx", import.meta.url),
    "utf8"
  );
  const pageSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/settings/site/page.jsx", import.meta.url),
    "utf8"
  );
  const actionSource = readFileSync(
    new URL("../../src/lib/data/site-settings.js", import.meta.url),
    "utf8"
  );

  assert.match(formSource, /title="Regional defaults"/);
  assert.match(formSource, /name="country"/);
  assert.match(formSource, /name="locale"/);
  assert.match(formSource, /name="timezone"/);
  assert.match(formSource, /name="defaultCurrency"/);
  assert.match(formSource, /getDefaultLocaleForCountry/);
  assert.match(formSource, /resolveRegionalDefaults/);
  assert.match(formSource, /Changing these regional defaults updates future events, courses, and membership plans/);
  assert.match(formSource, /Country cannot be changed after Stripe setup begins/);
  assert.match(pageSource, /getHubPaymentConfigurationByHubId/);
  assert.match(pageSource, /countryLocked/);
  assert.match(pageSource, /Stripe setup is still incomplete for this Growth hub/);
  assert.match(actionSource, /Country cannot be changed after Stripe setup begins/);
});

test("page settings overview uses reusable status badges for live and planned panels", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/page-settings-overview/PageSettingsOverview.jsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /deriveHomepageSettingsPanelStatus/);
  assert.match(source, /deriveEventsPageSettingsPanelStatus/);
  assert.match(source, /deriveCoursesPageSettingsPanelStatus/);
  assert.match(source, /status=\{homepageStatus\}/);
  assert.match(source, /status=\{eventsStatus\}/);
  assert.match(source, /status=\{coursesStatus\}/);
  assert.doesNotMatch(source, /title="About"/);
  assert.doesNotMatch(source, /title="Contact"/);
});
