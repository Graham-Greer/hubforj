function normalizeString(value) {
  return String(value || "").trim();
}

export function assertStripeConnectEventOwnsTransaction({
  event,
  transaction,
  hubPaymentConfiguration = null,
  context = "stripe_connect_webhook",
} = {}) {
  const eventAccountId = normalizeString(event?.account);
  const transactionAccountId = normalizeString(transaction?.stripeAccountId);
  const configurationAccountId = normalizeString(hubPaymentConfiguration?.stripeAccountId);
  const eventId = normalizeString(event?.id);
  const eventType = normalizeString(event?.type);
  const transactionId = normalizeString(transaction?.id);

  if (!eventAccountId) {
    throw new Error(
      `Stripe Connect ownership check failed: missing event account for ${context} (${eventType || "unknown_event"}:${eventId || "unknown_id"}).`
    );
  }

  if (!transactionAccountId) {
    throw new Error(
      `Stripe Connect ownership check failed: missing transaction account for ${context} (${transactionId || "unknown_transaction"}).`
    );
  }

  if (eventAccountId !== transactionAccountId) {
    throw new Error(
      `Stripe Connect ownership check failed: event account does not match transaction account for ${context} (${eventType || "unknown_event"}:${eventId || "unknown_id"}).`
    );
  }

  if (hubPaymentConfiguration && configurationAccountId !== eventAccountId) {
    throw new Error(
      `Stripe Connect ownership check failed: event account does not match hub payment configuration for ${context} (${eventType || "unknown_event"}:${eventId || "unknown_id"}).`
    );
  }

  return {
    eventAccountId,
    transactionAccountId,
    configurationAccountId,
  };
}
