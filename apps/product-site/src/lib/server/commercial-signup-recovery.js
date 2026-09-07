import "server-only";
import { readCommercialSignupOperation, completeCommercialSignupOperation } from "@/lib/data/commercial-signup-operations";
import { getProductHubSummaryById } from "@/lib/data/hubs";
import { provisionHubFromProductSite } from "@/lib/server/provision-hub";

// Caller must establish authority first; the data boundary rechecks account/UID.
export async function resumeCommercialSignup(account) {
  const identity = { accountId: account.id, authUid: account.authUid };
  const operation = await readCommercialSignupOperation(identity);
  if (operation.status === "complete") {
    const hub = await getProductHubSummaryById(operation.hub?.id);
    if (!hub || hub.slug !== operation.hub.slug) throw new Error("The saved workspace is no longer available. Please contact support.");
    return { ...operation.hub, ...hub };
  }
  const hub = await provisionHubFromProductSite(operation.payload, { idempotencyKey: operation.operationId });
  return completeCommercialSignupOperation({ ...identity, operationId: operation.operationId, hub });
}
