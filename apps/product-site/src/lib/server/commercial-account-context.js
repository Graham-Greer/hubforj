import "server-only";

import { syncCommercialAccountVerificationState } from "@/lib/auth/commercial-auth";
import { listCommercialAccountHubs } from "@/lib/data/commercial-accounts";
import { getProductHubSummaryById } from "@/lib/data/hubs";
import { requireCommercialAccountSessionContext } from "@/lib/server/account-session";
import { refreshCommercialAccountSubscriptionState } from "@/lib/server/commercial-billing";

function normalizeString(value) {
  return String(value || "").trim();
}

function formatPackageSourceLabel(source) {
  const normalizedSource = normalizeString(source).replace(/[_-]+/g, " ");

  if (!normalizedSource) {
    return "Product site";
  }

  return normalizedSource
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function requireCommercialAccountContext({ refreshSubscription = false } = {}) {
  const { session, account, authUser } = await requireCommercialAccountSessionContext();
  const verifiedAccount = await syncCommercialAccountVerificationState({ account, authUser });
  const syncedAccount = refreshSubscription
    ? await refreshCommercialAccountSubscriptionState(verifiedAccount)
    : verifiedAccount;
  const ownedHubs = (await listCommercialAccountHubs(syncedAccount.id)).filter(hub => hub.relationship === "owner");
  const currentOwnedHub =
    ownedHubs.find((hub) => hub.hubId === session.hubId) ||
    ownedHubs.find((hub) => hub.hubId === syncedAccount.lastHubId) ||
    ownedHubs.find((hub) => hub.hubId === syncedAccount.primaryHubId) ||
    ownedHubs[0] ||
    null;
  const productHub = currentOwnedHub ? await getProductHubSummaryById(currentOwnedHub.hubId) : null;
  const currentHub = {
    id: productHub?.id || "",
    name: productHub?.name || "",
    slug: productHub?.slug || "",
    packageTier: productHub?.packageTier || "free",
    packageStatus: productHub?.packageStatus || "",
    packageSource: formatPackageSourceLabel(productHub?.packageSource || "product_site"),
  };

  return {
    session,
    account: syncedAccount,
    ownedHubs,
    currentHub,
  };
}
