import { isPlainObject, normalizeText } from "./shared.js";

const ALLOWED_CURRENCIES = new Set(["GBP", "USD", "EUR"]);

function normalizeAmountMinor(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

export function normalizeMoneyFragment(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const currency = normalizeText(source.currency).toUpperCase();

  return {
    amountMinor: normalizeAmountMinor(source.amountMinor),
    currency: ALLOWED_CURRENCIES.has(currency) ? currency : "GBP",
    display: normalizeText(source.display),
  };
}

export function evaluateMoneyReadiness(input = {}, fieldLabel = "Price") {
  const source = isPlainObject(input) ? input : {};
  const missing = [];
  const amount = Number(source.amountMinor);
  const currency = normalizeText(source.currency).toUpperCase();

  if (!Number.isInteger(amount) || amount < 0) {
    missing.push(`${fieldLabel}: amountMinor must be a non-negative integer.`);
  }
  if (!ALLOWED_CURRENCIES.has(currency)) {
    missing.push(`${fieldLabel}: currency must be GBP, USD, or EUR.`);
  }

  return missing;
}

export const MONEY_CURRENCIES = Array.from(ALLOWED_CURRENCIES);
