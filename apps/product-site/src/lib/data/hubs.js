import "server-only";

import { normalizeProductHubSummary } from "@/lib/domain/commercial-accounts";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function getProductHubSummaryById(hubId) {
  const normalizedHubId = normalizeString(hubId);

  if (!normalizedHubId) {
    return null;
  }

  const doc = await getFirebaseAdminDb().collection("hubs").doc(normalizedHubId).get();

  if (!doc.exists) {
    return null;
  }

  return normalizeProductHubSummary({
    id: doc.id,
    ...doc.data(),
  });
}
