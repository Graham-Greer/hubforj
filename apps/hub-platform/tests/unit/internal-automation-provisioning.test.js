import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProvisionHubAutomationRequestBody } from "../../src/lib/domain/internal-automation.js";

test("normalizeProvisionHubAutomationRequestBody trims and preserves provisioning fields", () => {
  assert.deepEqual(
    normalizeProvisionHubAutomationRequestBody({
      name: " North Shore ",
      slug: " north shore ",
      contactEmail: " Team@NorthShore.Com ",
      customDomain: " northshore.example.com ",
      template: " civic ",
      theme: " dark ",
      description: " Community for coastal families ",
      country: " gb ",
      timezone: " Europe/London ",
      locale: " en-GB ",
      defaultCurrency: " gbp ",
      packageTier: " starter ",
      packageStatus: " active ",
      packageSource: " product_site ",
    }),
    {
      name: "North Shore",
      slug: "northshore",
      contactEmail: "Team@NorthShore.Com",
      customDomain: "northshore.example.com",
      template: "civic",
      theme: "dark",
      description: "Community for coastal families",
      country: "gb",
      timezone: "Europe/London",
      locale: "en-GB",
      defaultCurrency: "gbp",
      packageTier: "starter",
      packageStatus: "active",
      packageSource: "product_site",
    }
  );
});
