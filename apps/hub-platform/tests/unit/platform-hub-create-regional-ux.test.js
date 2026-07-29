import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("platform hub create flow uses the canonical regional model instead of legacy UK defaults", () => {
  const formStateSource = readFileSync(
    new URL("../../src/app/(platform)/platform/hubs/create/form-state.js", import.meta.url),
    "utf8"
  );
  const formSource = readFileSync(
    new URL("../../src/app/(platform)/platform/hubs/create/CreateHubForm.jsx", import.meta.url),
    "utf8"
  );
  const actionSource = readFileSync(
    new URL("../../src/app/(platform)/platform/hubs/create/actions.js", import.meta.url),
    "utf8"
  );

  assert.match(formStateSource, /country:\s*"US"/);
  assert.match(formStateSource, /locale:\s*"en-US"/);
  assert.match(formStateSource, /timezone:\s*"America\/New_York"/);
  assert.match(formStateSource, /defaultCurrency:\s*"USD"/);

  assert.match(formSource, /getSupportedCountryOptions/);
  assert.match(formSource, /getAllowedLocalesForCountry/);
  assert.match(formSource, /getAllowedTimezonesForCountry/);
  assert.match(formSource, /getDefaultCurrencyForCountry/);
  assert.match(formSource, /label="Country"/);
  assert.match(formSource, /label="Default currency"/);
  assert.doesNotMatch(formSource, /English \(UK\)/);
  assert.doesNotMatch(formSource, /placeholder="Europe\/London"/);

  assert.match(actionSource, /country: String\(formData\.get\("country"\) \|\| "US"\)/);
  assert.match(actionSource, /defaultCurrency: String\(formData\.get\("defaultCurrency"\) \|\| "USD"\)/);
  assert.match(actionSource, /country: values\.country/);
  assert.match(actionSource, /defaultCurrency: values\.defaultCurrency/);
});
