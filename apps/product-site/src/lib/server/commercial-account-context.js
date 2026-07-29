import "server-only";

import { redirect } from "next/navigation";
import { syncCommercialAccountVerificationState } from "@/lib/auth/commercial-auth";
import { getCommercialAccountByEmail, getCommercialAccountById, listCommercialAccountHubs } from "@/lib/data/commercial-accounts";
import { getProductHubSummaryById } from "@/lib/data/hubs";
import { requireCommercialAccountSession } from "@/lib/server/account-session";
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

export async function requireCommercialAccountContext() {
  const session = await requireCommercialAccountSession();
  const account =
    (session.accountId ? await getCommercialAccountById(session.accountId) : null) ||
    (session.ownerEmail ? await getCommercialAccountByEmail(session.ownerEmail) : null);

  if (!account) {
    redirect("/signup");
  }

  const verifiedAccount = account.authUid ? await syncCommercialAccountVerificationState({ account }) : account;
  const syncedAccount = await refreshCommercialAccountSubscriptionState(verifiedAccount);
  const ownedHubs = await listCommercialAccountHubs(syncedAccount.id);
  const currentOwnedHub =
    ownedHubs.find((hub) => hub.hubId === session.hubId) ||
    ownedHubs.find((hub) => hub.hubId === syncedAccount.lastHubId) ||
    ownedHubs.find((hub) => hub.hubId === syncedAccount.primaryHubId) ||
    ownedHubs[0] ||
    null;
  const productHub = currentOwnedHub ? await getProductHubSummaryById(currentOwnedHub.hubId) : null;
  const currentHub = {
    id: productHub?.id || currentOwnedHub?.hubId || "",
    name: productHub?.name || currentOwnedHub?.communityName || session.communityName || "",
    slug: productHub?.slug || currentOwnedHub?.hubSlug || session.hubSlug || "",
    packageTier: productHub?.packageTier || currentOwnedHub?.packageTier || session.packageTier || "starter",
    packageStatus: productHub?.packageStatus || currentOwnedHub?.packageStatus || "active",
    packageSource: formatPackageSourceLabel(productHub?.packageSource || "product_site"),
  };

  return {
    session,
    account: syncedAccount,
    ownedHubs,
    currentHub,
  };
}
