try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit/source tests.
}

import { getCustomDomainVercelConfig } from "@/lib/domain/custom-domain-vercel-config";
import { checkCustomDomainVercelReadiness } from "@/lib/domain/custom-domain-vercel";
import { buildCustomDomainMappingRecordsForHub, deleteCustomDomainMappingByHostname, getCustomDomainMappingByHostname, writeCustomDomainMappingForHub } from "@/lib/data/custom-domain-mappings";
import { getCustomDomainClaimByHostname, isCustomDomainClaimActive, releaseCustomDomainClaimForHub, upsertCustomDomainClaimForHub } from "@/lib/data/custom-domain-claims";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { runCustomDomainLifecycleBatch } from "@/lib/data/custom-domain-verification";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeHostname(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function nowIso() {
  return new Date().toISOString();
}

function isRoutableCustomDomainStatus(status) {
  return status === "connected";
}

function isClaimedCustomDomainStatus(status) {
  return [
    "pending_verification",
    "verification_failed",
    "verifying",
    "activation_ready",
    "connected",
    "disconnect_scheduled",
  ].includes(status);
}

function shouldProviderCheck(status) {
  return [
    "pending_verification",
    "verification_failed",
    "verifying",
    "activation_ready",
    "connected",
  ].includes(status);
}

function compactIssue(issue) {
  return {
    code: normalizeString(issue.code),
    severity: normalizeString(issue.severity) || "warning",
    message: normalizeString(issue.message),
    hostname: normalizeHostname(issue.hostname),
    details: issue.details || {},
  };
}

function addIssue(issues, issue, limit) {
  if (issues.length >= limit) {
    return;
  }

  issues.push(compactIssue(issue));
}

function summarizeIssues(issues) {
  const counts = new Map();

  for (const issue of issues) {
    counts.set(issue.code, (counts.get(issue.code) || 0) + 1);
  }

  return Array.from(counts.entries()).map(([code, count]) => ({
    code,
    count,
  }));
}

async function getFreshHub(hub) {
  const hubId = normalizeString(hub?.id);

  if (!hubId) {
    return hub;
  }

  const doc = await getFirebaseAdminDb().collection("hubs").doc(hubId).get();

  return doc.exists ? { id: doc.id, ...doc.data() } : hub;
}

async function inspectMappings({ hub, hostname, status, issues, issueLimit }) {
  const expectedMappings = buildCustomDomainMappingRecordsForHub(hub, "custom-domain-reconciliation") || [];

  if (status === "connected") {
    if (!expectedMappings.length) {
      addIssue(issues, {
        code: "connected_domain_mapping_unbuildable",
        severity: "critical",
        message: "The hub is connected to a custom domain, but expected runtime mappings could not be built.",
        hostname,
      }, issueLimit);
      return;
    }

    for (const expected of expectedMappings) {
      const existing = await getCustomDomainMappingByHostname(expected.hostname, { hydrateFromHub: false });

      if (!existing) {
        addIssue(issues, {
          code: "mapping_missing",
          severity: "critical",
          message: "A connected custom domain is missing a runtime mapping.",
          hostname: expected.hostname,
          details: {
            expectedHubId: expected.hubId,
            expectedHubSlug: expected.hubSlug,
            matchType: expected.matchType,
          },
        }, issueLimit);
        continue;
      }

      if (
        existing.hubId !== expected.hubId ||
        existing.hubSlug !== expected.hubSlug ||
        existing.status !== "connected" ||
        existing.canonicalHost !== expected.canonicalHost ||
        existing.redirectTo !== expected.redirectTo ||
        existing.matchType !== expected.matchType
      ) {
        addIssue(issues, {
          code: "mapping_mismatch",
          severity: "critical",
          message: "A custom-domain runtime mapping does not match the hub record.",
          hostname: expected.hostname,
          details: {
            expected: {
              hubId: expected.hubId,
              hubSlug: expected.hubSlug,
              canonicalHost: expected.canonicalHost,
              redirectTo: expected.redirectTo,
              matchType: expected.matchType,
            },
            actual: {
              hubId: existing.hubId,
              hubSlug: existing.hubSlug,
              canonicalHost: existing.canonicalHost,
              redirectTo: existing.redirectTo,
              matchType: existing.matchType,
              status: existing.status,
            },
          },
        }, issueLimit);
      }
    }

    return;
  }

  if (hostname) {
    const staleMappings = buildCustomDomainMappingRecordsForHub({
      ...hub,
      customDomain: {
        ...(hub.customDomain || {}),
        hostname,
        status: "connected",
      },
    }, "custom-domain-reconciliation") || [];

    for (const expected of staleMappings) {
      const existing = await getCustomDomainMappingByHostname(expected.hostname, { hydrateFromHub: false });

      if (existing) {
        addIssue(issues, {
          code: "inactive_domain_mapping_present",
          severity: "critical",
          message: "A non-connected custom domain still has a runtime mapping.",
          hostname: expected.hostname,
          details: {
            hubStatus: status,
            mappedHubId: existing.hubId,
            mappedHubSlug: existing.hubSlug,
          },
        }, issueLimit);
      }
    }
  }
}

async function inspectClaim({ hub, hostname, status, issues, issueLimit }) {
  if (!hostname) {
    return;
  }

  const claim = await getCustomDomainClaimByHostname(hostname);
  const claimShouldBeActive = isClaimedCustomDomainStatus(status);

  if (claimShouldBeActive) {
    if (!claim || !isCustomDomainClaimActive(claim)) {
      addIssue(issues, {
        code: "claim_missing",
        severity: "critical",
        message: "A configured custom domain is missing an active ownership claim.",
        hostname,
        details: {
          status,
          expectedHubId: hub.id,
        },
      }, issueLimit);
      return;
    }

    if (claim.hubId !== hub.id || claim.hubSlug !== hub.slug) {
      addIssue(issues, {
        code: "claim_mismatch",
        severity: "critical",
        message: "A custom-domain claim points to a different hub than the configured domain.",
        hostname,
        details: {
          expectedHubId: hub.id,
          expectedHubSlug: hub.slug,
          actualHubId: claim.hubId,
          actualHubSlug: claim.hubSlug,
          claimStatus: claim.status,
        },
      }, issueLimit);
      return;
    }

    if (status === "connected" && claim.status !== "connected") {
      addIssue(issues, {
        code: "connected_claim_not_marked_connected",
        severity: "warning",
        message: "A connected custom-domain claim is active but not marked connected.",
        hostname,
        details: {
          claimStatus: claim.status,
        },
      }, issueLimit);
    }

    return;
  }

  if (claim && isCustomDomainClaimActive(claim) && claim.hubId === hub.id) {
    addIssue(issues, {
      code: "inactive_domain_claim_present",
      severity: "warning",
      message: "A non-active custom-domain state still has an active ownership claim.",
      hostname,
      details: {
        status,
        claimStatus: claim.status,
      },
    }, issueLimit);
  }
}

async function inspectProvider({ hostname, status, issues, issueLimit }) {
  const vercelConfig = getCustomDomainVercelConfig();

  if (!hostname || !vercelConfig.enabled || !shouldProviderCheck(status)) {
    return null;
  }

  const readiness = await checkCustomDomainVercelReadiness(hostname);

  if (!readiness.ok) {
    addIssue(issues, {
      code: "vercel_readiness_failed",
      severity: readiness.providerErrorRetryable ? "warning" : "critical",
      message: readiness.lastLifecycleError || "Vercel readiness could not be checked.",
      hostname,
      details: {
        category: readiness.providerErrorCategory || "",
        retryable: readiness.providerErrorRetryable === true,
      },
    }, issueLimit);
    return readiness;
  }

  if (status === "connected" && !readiness.externalReady) {
    addIssue(issues, {
      code: "connected_domain_provider_not_ready",
      severity: "critical",
      message: "The hub is connected in Firestore, but Vercel readiness is not complete.",
      hostname,
      details: {
        dnsRoutingStatus: readiness.dnsRoutingStatus,
        vercelVerificationStatus: readiness.vercelVerificationStatus,
        certificateStatus: readiness.certificateStatus,
      },
    }, issueLimit);
  }

  return readiness;
}

export async function getHubCustomDomainReconciliationReport(hub, { issueLimit = 25 } = {}) {
  const freshHub = await getFreshHub(hub);
  const customDomain = freshHub?.customDomain || {};
  const hostname = normalizeHostname(customDomain.hostname);
  const status = normalizeString(customDomain.status) || "not_configured";
  const issues = [];
  const boundedIssueLimit = Math.min(Math.max(Number.parseInt(String(issueLimit || ""), 10) || 25, 1), 100);

  if (Array.isArray(freshHub?.customDomains) && freshHub.customDomains.length && !hostname) {
    addIssue(issues, {
      code: "legacy_custom_domains_without_primary",
      severity: "warning",
      message: "Legacy customDomains are present but the primary customDomain hostname is missing.",
      hostname: freshHub.customDomains[0],
      details: {
        legacyCount: freshHub.customDomains.length,
      },
    }, boundedIssueLimit);
  }

  if (hostname) {
    await inspectClaim({ hub: freshHub, hostname, status, issues, issueLimit: boundedIssueLimit });
    await inspectMappings({ hub: freshHub, hostname, status, issues, issueLimit: boundedIssueLimit });
    await inspectProvider({ hostname, status, issues, issueLimit: boundedIssueLimit });
  }

  if (status === "disconnect_scheduled") {
    const disconnectAt = normalizeString(customDomain.disconnectAt);

    if (!disconnectAt || disconnectAt <= nowIso()) {
      addIssue(issues, {
        code: "disconnect_due",
        severity: "warning",
        message: "A custom-domain disconnect is due and should be processed by lifecycle maintenance.",
        hostname,
        details: {
          disconnectAt,
        },
      }, boundedIssueLimit);
    }
  }

  return {
    generatedAt: nowIso(),
    totalIssues: issues.length,
    summary: summarizeIssues(issues),
    issues,
    state: {
      hostname,
      status,
      lifecyclePhase: normalizeString(customDomain.lifecyclePhase),
      vercelEnabled: getCustomDomainVercelConfig().enabled === true,
    },
  };
}

export async function reconcileHubCustomDomainState(hub, actorId = "system") {
  const before = await getHubCustomDomainReconciliationReport(hub, { issueLimit: 100 });
  const lifecycle = await runCustomDomainLifecycleBatch({
    hubSlug: normalizeString(hub?.slug),
    limit: 1,
  });
  const freshHub = await getFreshHub(hub);
  const customDomain = freshHub?.customDomain || {};
  const hostname = normalizeHostname(customDomain.hostname);
  const status = normalizeString(customDomain.status) || "not_configured";
  const repairs = {
    lifecycle,
    claim: "not_applicable",
    mapping: "not_applicable",
  };

  if (hostname && isClaimedCustomDomainStatus(status)) {
    const claim = await upsertCustomDomainClaimForHub({
      hostname,
      hubId: freshHub.id,
      hubSlug: freshHub.slug,
      actorId,
      status: status === "connected" ? "connected" : "pending",
    });
    repairs.claim = claim?.status || "upserted";
  } else if (hostname) {
    await releaseCustomDomainClaimForHub({
      hostname,
      hubId: freshHub.id,
      actorId,
      reason: "custom_domain_reconciliation",
    });
    repairs.claim = "released_if_present";
  }

  if (hostname && isRoutableCustomDomainStatus(status)) {
    repairs.mapping = await writeCustomDomainMappingForHub(freshHub, actorId);
  } else if (hostname) {
    await deleteCustomDomainMappingByHostname(hostname);
    repairs.mapping = "deleted_if_present";
  }

  const after = await getHubCustomDomainReconciliationReport(freshHub, { issueLimit: 100 });

  return {
    status: after.totalIssues === 0 ? "reconciled" : "issues_remain",
    before: {
      totalIssues: before.totalIssues,
      summary: before.summary,
    },
    after: {
      totalIssues: after.totalIssues,
      summary: after.summary,
    },
    repairs,
  };
}

export async function runCustomDomainReconciliationBatch({
  actorId = "system",
  limit = 25,
} = {}) {
  const boundedLimit = Math.min(Math.max(Number.parseInt(String(limit || ""), 10) || 25, 1), 100);
  const snapshot = await getFirebaseAdminDb()
    .collection("hubs")
    .where("customDomain.status", "in", [
      "pending_verification",
      "verification_failed",
      "verifying",
      "activation_ready",
      "connected",
      "disconnect_scheduled",
    ])
    .limit(boundedLimit)
    .get();
  const results = [];

  for (const doc of snapshot.docs) {
    const hub = { id: doc.id, ...doc.data() };

    try {
      results.push({
        hubId: hub.id,
        hubSlug: normalizeString(hub.slug),
        ok: true,
        error: "",
        ...(await reconcileHubCustomDomainState(hub, actorId)),
      });
    } catch (error) {
      results.push({
        hubId: hub.id,
        hubSlug: normalizeString(hub.slug),
        ok: false,
        status: "failed",
        error: String(error?.message || "Unable to reconcile custom-domain state."),
      });
    }
  }

  const failed = results.filter((result) => result.ok === false).length;

  return {
    ok: failed === 0,
    processed: results.length,
    failed,
    results,
  };
}
