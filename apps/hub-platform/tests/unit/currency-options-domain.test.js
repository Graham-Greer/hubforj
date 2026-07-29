import test from "node:test";
import assert from "node:assert/strict";
import {
  getHubCurrencySelectOptions,
  resolveHubCurrencyValue,
} from "../../src/lib/domain/currency-options.js";

test("hub currency helpers prefer the hub regional default", () => {
  const hub = {
    country: "ES",
    defaultCurrency: "EUR",
  };

  assert.equal(resolveHubCurrencyValue(hub, ""), "EUR");
  assert.deepEqual(getHubCurrencySelectOptions(hub, ""), [
    { value: "EUR", label: "EUR" },
  ]);
});

test("hub currency helpers preserve legacy saved currencies while keeping the hub default available", () => {
  const hub = {
    country: "ES",
    defaultCurrency: "EUR",
  };

  assert.equal(resolveHubCurrencyValue(hub, "USD"), "USD");
  assert.deepEqual(getHubCurrencySelectOptions(hub, "USD"), [
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
  ]);
});
