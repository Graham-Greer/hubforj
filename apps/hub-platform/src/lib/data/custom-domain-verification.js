try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  releaseCustomDomainClaimForHub,
  upsertCustomDomainClaimForHub,
} from "@/lib/data/custom-domain-claims";
import { getCustomDomainVercelConfig } from "@/lib/domain/custom-domain-vercel-config";
import { checkCustomDomainVercelReadiness } from "@/lib/domain/custom-domain-vercel";
import { verifyCustomDomainDnsTxt } from "@/lib/domain/custom-domain-verification";
import { getCustomDomainRuntimeBlockedReason, isCustomDomainRuntimeEnabled } from "@/lib/domain/custom-domain-activation";
import { deleteCustomDomainMappingByHostname, writeCustomDomainMappingForHub } from "@/lib/data/custom-domain-mappings";
import { sanitizeStoredCustomDomainRecord } from "@/lib/domain/hub-domains";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildVerificationFailureReason() {
  return "The expected TXT verification record was not found yet. DNS propagation may still be in progress.";
}

function buildActivationBlockedReason({ readiness, runtimeEnabled, autoActivateEnabled }) {
  if (!readiness.externalReady) {
    if (readiness.dnsRoutingStatus === "misconfigured") {
      return readiness.dnsRoutingFailureReason || "DNS routing is not pointing to Vercel yet.";
    }

    if (readiness.vercelVerificationStatus !== "verified") {
      return "The domain is not verified by the hosting provider yet.";
    }

    if (readiness.certificateStatus !== "ready") {
      return "The secure connection is still being prepared.";
    }

    return "Custom-domain readiness checks are still pending.";
  }

  if (!runtimeEnabled) {
    return getCustomDomainRuntimeBlockedReason();
  }

  if (!autoActivateEnabled) {
    return "Custom-domain readiness is complete, but automatic activation is not enabled in this environment yet.";
  }

  return "";
}

function hasStoredExternalReadiness(customDomain) {
  return Boolean(
    normalizeString(customDomain.verifiedAt) &&
    normalizeString(customDomain.dnsRoutingStatus) === "ready" &&
    normalizeString(customDomain.vercelVerificationStatus) === "verified" &&
    normalizeString(customDomain.certificateStatus) === "ready"
  );
}

export async function processHubCustomDomainVerificationRecord(hubRecord, actorId = "system") {
  const hubId = normalizeString(hubRecord?.id);
  const customDomain = sanitizeStoredCustomDomainRecord(hubRecord?.customDomain || {});
  const hostname = normalizeString(customDomain.hostname);
  const token = normalizeString(customDomain.verificationTarget);

  if (!hubId || !hostname || !token) {
    return {
      hubId,
      processed: false,
      reason: "missing_custom_domain_state",
    };
  }

  const now = new Date().toISOString();
  const result = await verifyCustomDomainDnsTxt({ hostname, token });
  const runtimeEnabled = isCustomDomainRuntimeEnabled();
  const vercelConfig = getCustomDomainVercelConfig();
  const readiness = result.matched
    ? await checkCustomDomainVercelReadiness(hostname, { now })
    : {
        ok: true,
        skipped: true,
        externalReady: false,
        dnsRoutingStatus: normalizeString(customDomain.dnsRoutingStatus),
        dnsRoutingLastCheckedAt: normalizeString(customDomain.dnsRoutingLastCheckedAt),
        dnsRoutingFailureReason: normalizeString(customDomain.dnsRoutingFailureReason),
        vercelProjectId: normalizeString(customDomain.vercelProjectId),
        vercelDomainId: normalizeString(customDomain.vercelDomainId),
        vercelVerificationStatus: normalizeString(customDomain.vercelVerificationStatus),
        vercelVerificationLastCheckedAt: normalizeString(customDomain.vercelVerificationLastCheckedAt),
        certificateStatus: normalizeString(customDomain.certificateStatus),
        certificateLastCheckedAt: normalizeString(customDomain.certificateLastCheckedAt),
        lastLifecycleRunAt: now,
        lastLifecycleError: "",
      };
  const autoActivateEnabled = vercelConfig.autoActivateEnabled === true;
  const shouldActivate = result.matched && readiness.externalReady && runtimeEnabled && autoActivateEnabled;
  const nextStatus = !result.matched
    ? "verification_failed"
    : shouldActivate
      ? "verifying"
      : readiness.externalReady
        ? "activation_ready"
        : "verifying";
  const nextCustomDomain = {
    ...sanitizeStoredCustomDomainRecord(customDomain),
    status: nextStatus,
    verificationHost: result.verificationHostname || normalizeString(customDomain.verificationHost),
    verifiedAt: result.matched ? now : normalizeString(customDomain.verifiedAt),
    activationReadyAt: result.matched ? now : normalizeString(customDomain.activationReadyAt),
    lastCheckedAt: now,
    failureReason: result.matched ? normalizeString(readiness.failureReason) : buildVerificationFailureReason(),
    activationBlockedReason: result.matched
      ? buildActivationBlockedReason({ readiness, runtimeEnabled, autoActivateEnabled })
      : "",
    dnsRoutingStatus: normalizeString(readiness.dnsRoutingStatus),
    dnsRoutingLastCheckedAt: normalizeString(readiness.dnsRoutingLastCheckedAt) || (result.matched ? now : ""),
    dnsRoutingFailureReason: normalizeString(readiness.dnsRoutingFailureReason),
    vercelProjectId: normalizeString(readiness.vercelProjectId || customDomain.vercelProjectId),
    vercelDomainId: normalizeString(readiness.vercelDomainId || customDomain.vercelDomainId),
    vercelVerificationStatus: normalizeString(readiness.vercelVerificationStatus),
    vercelVerificationLastCheckedAt:
      normalizeString(readiness.vercelVerificationLastCheckedAt) || (result.matched ? now : ""),
    certificateStatus: normalizeString(readiness.certificateStatus),
    certificateLastCheckedAt: normalizeString(readiness.certificateLastCheckedAt) || (result.matched ? now : ""),
    lastLifecycleRunAt: normalizeString(readiness.lastLifecycleRunAt) || now,
    lastLifecycleError: normalizeString(readiness.lastLifecycleError),
    updatedByUserId: actorId,
  };

  await getFirebaseAdminDb().collection("hubs").doc(hubId).update({
    customDomain: nextCustomDomain,
    updatedAt: now,
    updatedBy: actorId,
  });

  await deleteCustomDomainMappingByHostname(hostname);

  if (shouldActivate) {
    const activationResult = await processHubCustomDomainActivationRecord(
      {
        ...hubRecord,
        customDomain: nextCustomDomain,
      },
      actorId
    );

    return {
      hubId,
      processed: true,
      matched: result.matched,
      status: activationResult.status || nextCustomDomain.status,
      hostname,
      readiness,
      activated: activationResult.activated === true,
      activationBlocked: activationResult.blocked === true,
    };
  }

  return {
    hubId,
    processed: true,
    matched: result.matched,
    status: nextCustomDomain.status,
    hostname,
    readiness,
    activated: false,
    activationBlocked: Boolean(nextCustomDomain.activationBlockedReason),
  };
}

export async function runPendingCustomDomainVerificationBatch({
  actorId = "system",
  hubSlug = "",
  limit = 25,
} = {}) {
  const db = getFirebaseAdminDb();
  const snapshot = hubSlug
    ? await db.collection("hubs").where("slug", "==", normalizeString(hubSlug)).limit(1).get()
    : await db.collection("hubs").limit(limit).get();

  const candidates = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((hub) => {
      const status = normalizeString(hub?.customDomain?.status);
      return (
        status === "pending_verification" ||
        status === "verifying" ||
        status === "verification_failed" ||
        status === "activation_ready"
      );
    });

  const results = [];

  for (const candidate of candidates) {
    // Sequential updates avoid noisy concurrent writes on the same collection and keep logs easier to follow.
    results.push(await processHubCustomDomainVerificationRecord(candidate, actorId));
  }

  return {
    processedCount: results.filter((result) => result.processed).length,
    matchedCount: results.filter((result) => result.matched).length,
    checkedCount: results.length,
    results,
  };
}

export async function processHubCustomDomainActivationRecord(hubRecord, actorId = "system") {
  const hubId = normalizeString(hubRecord?.id);
  const customDomain = sanitizeStoredCustomDomainRecord(hubRecord?.customDomain || {});
  const hostname = normalizeString(customDomain.hostname);
  const status = normalizeString(customDomain.status);

  if (!hubId || !hostname || (status !== "verifying" && status !== "activation_ready")) {
    return {
      hubId,
      processed: false,
      reason: "not_ready_for_activation",
    };
  }

  const now = new Date().toISOString();
  const autoActivateEnabled = getCustomDomainVercelConfig().autoActivateEnabled === true;

  if (!hasStoredExternalReadiness(customDomain)) {
    const nextCustomDomain = {
      ...sanitizeStoredCustomDomainRecord(customDomain),
      activationBlockedReason: "Custom-domain readiness checks are not complete yet.",
      updatedByUserId: actorId,
    };

    await getFirebaseAdminDb().collection("hubs").doc(hubId).update({
      customDomain: nextCustomDomain,
      updatedAt: now,
      updatedBy: actorId,
    });

    await deleteCustomDomainMappingByHostname(hostname);

    return {
      hubId,
      processed: true,
      activated: false,
      status: nextCustomDomain.status,
      hostname,
      blocked: true,
      reason: "external_readiness_incomplete",
    };
  }

  if (!isCustomDomainRuntimeEnabled()) {
    const nextCustomDomain = {
      ...sanitizeStoredCustomDomainRecord(customDomain),
      activationReadyAt: normalizeString(customDomain.activationReadyAt) || now,
      activationBlockedReason: getCustomDomainRuntimeBlockedReason(),
      updatedByUserId: actorId,
    };

    await getFirebaseAdminDb().collection("hubs").doc(hubId).update({
      customDomain: nextCustomDomain,
      updatedAt: now,
      updatedBy: actorId,
    });

    await deleteCustomDomainMappingByHostname(hostname);

    return {
      hubId,
      processed: true,
      activated: false,
      status: nextCustomDomain.status,
      hostname,
      blocked: true,
    };
  }

  if (!autoActivateEnabled) {
    const nextCustomDomain = {
      ...sanitizeStoredCustomDomainRecord(customDomain),
      activationReadyAt: normalizeString(customDomain.activationReadyAt) || now,
      activationBlockedReason: "Custom-domain readiness is complete, but automatic activation is not enabled in this environment yet.",
      updatedByUserId: actorId,
    };

    await getFirebaseAdminDb().collection("hubs").doc(hubId).update({
      customDomain: nextCustomDomain,
      updatedAt: now,
      updatedBy: actorId,
    });

    await deleteCustomDomainMappingByHostname(hostname);

    return {
      hubId,
      processed: true,
      activated: false,
      status: nextCustomDomain.status,
      hostname,
      blocked: true,
    };
  }

  const nextCustomDomain = {
    ...sanitizeStoredCustomDomainRecord(customDomain),
    status: "connected",
    connectedAt: now,
    connectedByUserId: actorId,
    activationBlockedReason: "",
    updatedByUserId: actorId,
  };

  const db = getFirebaseAdminDb();
  await db.runTransaction(async (transaction) => {
    await upsertCustomDomainClaimForHub({
      db,
      transaction,
      hostname,
      hubId,
      hubSlug: hubRecord.slug,
      actorId,
      status: "connected",
      now,
    });

    transaction.update(db.collection("hubs").doc(hubId), {
      customDomain: nextCustomDomain,
      updatedAt: now,
      updatedBy: actorId,
    });
  });

  await writeCustomDomainMappingForHub(
    {
      ...hubRecord,
      customDomain: nextCustomDomain,
    },
    actorId
  );

  return {
    hubId,
    processed: true,
    activated: true,
    status: nextCustomDomain.status,
    hostname,
    blocked: false,
  };
}

export async function runReadyCustomDomainActivationBatch({
  actorId = "system",
  hubSlug = "",
  limit = 25,
} = {}) {
  const db = getFirebaseAdminDb();
  const snapshot = hubSlug
    ? await db.collection("hubs").where("slug", "==", normalizeString(hubSlug)).limit(1).get()
    : await db.collection("hubs").limit(limit).get();

  const candidates = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((hub) => {
      const status = normalizeString(hub?.customDomain?.status);
      return status === "verifying" || status === "activation_ready";
    });

  const results = [];

  for (const candidate of candidates) {
    results.push(await processHubCustomDomainActivationRecord(candidate, actorId));
  }

  return {
    processedCount: results.filter((result) => result.processed).length,
    activatedCount: results.filter((result) => result.activated).length,
    checkedCount: results.length,
    results,
  };
}

export async function scheduleHubCustomDomainDisconnectRecord(hubRecord, {
  actorId = "system",
  disconnectAt = "",
  reason = "manual_disconnect",
} = {}) {
  const hubId = normalizeString(hubRecord?.id);
  const customDomain = sanitizeStoredCustomDomainRecord(hubRecord?.customDomain || {});
  const hostname = normalizeString(customDomain.hostname);

  if (!hubId || !hostname) {
    throw new Error("No custom domain is configured for this hub.");
  }

  const now = new Date().toISOString();
  const effectiveDisconnectAt = normalizeString(disconnectAt) || now;
  const nextCustomDomain = {
    ...sanitizeStoredCustomDomainRecord(customDomain),
    status: "disconnect_scheduled",
    disconnectAt: effectiveDisconnectAt,
    failureReason: "",
    activationBlockedReason: "",
    disconnectReason: reason,
    updatedByUserId: actorId,
  };

  await getFirebaseAdminDb().collection("hubs").doc(hubId).update({
    customDomain: nextCustomDomain,
    updatedAt: now,
    updatedBy: actorId,
  });

  return {
    hubId,
    processed: true,
    hostname,
    status: nextCustomDomain.status,
    disconnectAt: effectiveDisconnectAt,
  };
}

export async function processHubCustomDomainDisconnectRecord(hubRecord, actorId = "system") {
  const hubId = normalizeString(hubRecord?.id);
  const customDomain = sanitizeStoredCustomDomainRecord(hubRecord?.customDomain || {});
  const hostname = normalizeString(customDomain.hostname);
  const status = normalizeString(customDomain.status);
  const disconnectAt = normalizeString(customDomain.disconnectAt);
  const now = new Date().toISOString();

  if (!hubId || !hostname || status !== "disconnect_scheduled") {
    return {
      hubId,
      processed: false,
      reason: "not_ready_for_disconnect",
    };
  }

  if (disconnectAt && disconnectAt > now) {
    return {
      hubId,
      processed: false,
      reason: "disconnect_not_due",
      disconnectAt,
    };
  }

  const nextCustomDomain = {
    ...sanitizeStoredCustomDomainRecord(customDomain),
    status: "disconnected",
    disconnectedAt: now,
    connectedAt: "",
    verifiedAt: normalizeString(customDomain.verifiedAt),
    activationBlockedReason: "",
    failureReason: "",
    updatedByUserId: actorId,
  };

  const db = getFirebaseAdminDb();
  await db.runTransaction(async (transaction) => {
    await releaseCustomDomainClaimForHub({
      db,
      transaction,
      hostname,
      hubId,
      actorId,
      reason: normalizeString(customDomain.disconnectReason) || "manual_disconnect",
      now,
    });

    transaction.update(db.collection("hubs").doc(hubId), {
      customDomain: nextCustomDomain,
      customDomains: [],
      updatedAt: now,
      updatedBy: actorId,
    });
  });

  await deleteCustomDomainMappingByHostname(hostname);

  return {
    hubId,
    processed: true,
    disconnected: true,
    hostname,
    status: nextCustomDomain.status,
  };
}

export async function runScheduledCustomDomainDisconnectBatch({
  actorId = "system",
  hubSlug = "",
  limit = 25,
} = {}) {
  const db = getFirebaseAdminDb();
  const snapshot = hubSlug
    ? await db.collection("hubs").where("slug", "==", normalizeString(hubSlug)).limit(1).get()
    : await db.collection("hubs").limit(limit).get();

  const candidates = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((hub) => normalizeString(hub?.customDomain?.status) === "disconnect_scheduled");

  const results = [];

  for (const candidate of candidates) {
    results.push(await processHubCustomDomainDisconnectRecord(candidate, actorId));
  }

  return {
    processedCount: results.filter((result) => result.processed).length,
    disconnectedCount: results.filter((result) => result.disconnected).length,
    checkedCount: results.length,
    results,
  };
}

export async function runCustomDomainLifecycleBatch({
  hubSlug = "",
  limit = 25,
} = {}) {
  async function runPhase(name, runner) {
    try {
      const result = await runner();
      return {
        name,
        ok: true,
        error: "",
        ...result,
      };
    } catch (error) {
      return {
        name,
        ok: false,
        error: String(error?.message || `Unable to run the ${name} phase.`),
        processedCount: 0,
        checkedCount: 0,
        results: [],
      };
    }
  }

  const disconnect = await runPhase("disconnect", () =>
    runScheduledCustomDomainDisconnectBatch({
      actorId: "internal-domain-disconnector",
      hubSlug,
      limit,
    })
  );

  const verification = await runPhase("verification", () =>
    runPendingCustomDomainVerificationBatch({
      actorId: "internal-domain-verifier",
      hubSlug,
      limit,
    })
  );

  const activation = await runPhase("activation", () =>
    runReadyCustomDomainActivationBatch({
      actorId: "internal-domain-activator",
      hubSlug,
      limit,
    })
  );

  return {
    lifecycle: {
      disconnect,
      verification,
      activation,
    },
    ok: disconnect.ok && verification.ok && activation.ok,
    totals: {
      disconnectedCount: disconnect.disconnectedCount || 0,
      verificationMatchedCount: verification.matchedCount || 0,
      activationCount: activation.activatedCount || 0,
      checkedCount: disconnect.checkedCount + verification.checkedCount + activation.checkedCount,
    },
  };
}
