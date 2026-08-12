function normalizeString(value) {
  return String(value || "").trim();
}

export function formatDateTimeLabel(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(normalized));
  } catch {
    return normalized;
  }
}

export function countCompleteSteps(steps = []) {
  return steps.filter((step) => step.state === "complete").length;
}

export function getStepTone(state) {
  return (
    {
      complete: "success",
      needs_attention: "danger",
      in_progress: "info",
      pending: "neutral",
    }[state] || "neutral"
  );
}

export function getStepStatusLabel(state) {
  return (
    {
      complete: "Complete",
      needs_attention: "Needs attention",
      in_progress: "In progress",
      pending: "Pending",
    }[state] || "Pending"
  );
}

export function getStepIcon(state) {
  return (
    {
      complete: "task_alt",
      needs_attention: "warning",
      in_progress: "sync",
      pending: "radio_button_unchecked",
    }[state] || "radio_button_unchecked"
  );
}

function getState({ complete = false, needsAttention = false, inProgress = false } = {}) {
  if (complete) {
    return "complete";
  }

  if (needsAttention) {
    return "needs_attention";
  }

  if (inProgress) {
    return "in_progress";
  }

  return "pending";
}

export function getCustomDomainStatusTone(domainState = {}, domainStatus = "") {
  if (domainStatus === "connected") {
    return "success";
  }

  if (domainStatus === "verification_failed" || domainStatus === "provisioning_failed" || domainStatus === "disconnect_failed") {
    return "danger";
  }

  if (domainStatus === "not_configured" || !domainState?.hostname) {
    return "neutral";
  }

  return "warning";
}

export function getCustomDomainStatusIcon(domainState = {}, domainStatus = "") {
  const tone = getCustomDomainStatusTone(domainState, domainStatus);

  return (
    {
      success: "task_alt",
      danger: "warning",
      warning: "sync",
      neutral: "info",
    }[tone] || "info"
  );
}

export function buildDnsRecords(domainState = {}) {
  const records = [];
  const routingValues = Array.isArray(domainState?.dnsRoutingRecordValues)
    ? domainState.dnsRoutingRecordValues.filter(Boolean)
    : [];
  const routingValue = routingValues.length
    ? routingValues.join(", ")
    : normalizeString(domainState?.dnsRoutingRecordValue);

  if (domainState?.verificationHost || domainState?.verificationTarget) {
    records.push({
      id: "ownership",
      purpose: "Verify ownership",
      type: "TXT",
      name: domainState?.verificationHost || "Not generated yet",
      value: domainState?.verificationTarget || "Not generated yet",
      ttl: "Auto/default",
      copyName: domainState?.verificationHost || "",
      copyValue: domainState?.verificationTarget || "",
    });
  }

  if (domainState?.dnsRoutingRecordType || routingValue) {
    const values = routingValues.length ? routingValues : [routingValue].filter(Boolean);
    const safeValues = values.length ? values : ["Check DNS to load the recommended value"];

    safeValues.forEach((value, index) => records.push({
      id: `routing-${index}`,
      purpose: "Point visitors to HubForJ",
      type: domainState?.dnsRoutingRecordType || "A/CNAME",
      name: domainState?.dnsRoutingRecordName || "Use your DNS provider's host/name field",
      value,
      ttl: domainState?.dnsRoutingRecordTtl || "Auto/default",
      copyName: domainState?.dnsRoutingRecordName || "",
      copyValue: routingValues.length || routingValue ? value : "",
    }));
  }

  return records;
}

function getConnectionEvidence(domainState = {}, domainStatus = "") {
  const hasHostname = Boolean(domainState?.hostname);
  const hasVerificationRecord = Boolean(domainState?.verificationHost || domainState?.verificationTarget);
  const ownershipComplete =
    Boolean(domainState?.verifiedAt) ||
    ["verifying", "activation_ready", "connected"].includes(domainStatus);
  const ownershipFailed = domainStatus === "verification_failed";
  const routingComplete = domainState?.dnsRoutingStatus === "ready" || domainStatus === "connected";
  const routingFailed = domainState?.dnsRoutingStatus === "misconfigured";
  const certificateComplete = domainState?.certificateStatus === "ready" || domainStatus === "connected";
  const certificateFailed = domainState?.certificateStatus === "failed";
  const activationHasAttention = Boolean(
    normalizeString(domainState?.activationBlockedReason) ||
    normalizeString(domainState?.lastLifecycleError)
  );
  const connected = domainStatus === "connected";

  return {
    hasHostname,
    hasVerificationRecord,
    ownershipComplete,
    ownershipFailed,
    routingComplete,
    routingFailed,
    certificateComplete,
    certificateFailed,
    activationHasAttention,
    connected,
  };
}

export function buildConnectionHealthSteps(domainState = {}, domainStatus = "", { canManageCustomDomain = false } = {}) {
  const evidence = getConnectionEvidence(domainState, domainStatus);

  return [
    {
      id: "domain-entered",
      title: "Domain entered",
      description: evidence.hasHostname ? domainState.hostname : "Choose the domain members should use.",
      state: getState({
        complete: evidence.hasHostname,
        inProgress: canManageCustomDomain && !evidence.hasHostname,
      }),
    },
    {
      id: "ownership-verified",
      title: "Ownership verified",
      description: evidence.ownershipComplete
        ? "The ownership TXT record has been found."
        : "Add the TXT record with your DNS provider.",
      state: getState({
        complete: evidence.ownershipComplete,
        needsAttention: evidence.ownershipFailed,
        inProgress: evidence.hasHostname && evidence.hasVerificationRecord,
      }),
    },
    {
      id: "dns-routing",
      title: "DNS routing",
      description: evidence.routingComplete
        ? "Visitors are pointed to HubForJ hosting."
        : "Add or update the routing record shown in DNS records.",
      state: getState({
        complete: evidence.routingComplete,
        needsAttention: evidence.routingFailed,
        inProgress: evidence.ownershipComplete,
      }),
    },
    {
      id: "secure-connection",
      title: "Secure connection",
      description: evidence.certificateComplete
        ? "HTTPS is ready for this domain."
        : "HubForJ checks the secure connection after DNS points correctly.",
      state: getState({
        complete: evidence.certificateComplete,
        needsAttention: evidence.certificateFailed,
        inProgress: evidence.routingComplete,
      }),
    },
    {
      id: "connected",
      title: "Connected",
      description: evidence.connected ? "This custom domain is live." : "Connection completes automatically when checks pass.",
      state: getState({
        complete: evidence.connected,
        needsAttention: evidence.activationHasAttention,
        inProgress: ["activation_ready", "verifying"].includes(domainStatus) && evidence.ownershipComplete,
      }),
    },
  ];
}

export function buildSetupGuideChecks({ domainState = {}, domainStatus = "", records = [] } = {}) {
  const evidence = getConnectionEvidence(domainState, domainStatus);
  const hasVerificationRecord = records.some((record) => record.type === "TXT") || evidence.hasVerificationRecord;

  return [
    {
      id: "add-txt-record",
      title: "Add TXT record",
      description: evidence.ownershipComplete
        ? "The verification TXT record has been found."
        : "Add the verification TXT record to prove domain ownership.",
      state: getState({
        complete: evidence.ownershipComplete,
        needsAttention: evidence.ownershipFailed,
        inProgress: hasVerificationRecord && !evidence.ownershipComplete,
      }),
    },
    {
      id: "point-traffic",
      title: "Point traffic to HubForJ",
      description: evidence.routingComplete
        ? "Visitors are pointed to HubForJ hosting."
        : "Update your A or CNAME record to point visitors to HubForJ hosting.",
      state: getState({
        complete: evidence.routingComplete,
        needsAttention: evidence.routingFailed,
        inProgress: evidence.ownershipComplete && !evidence.routingComplete,
      }),
    },
    {
      id: "wait-for-verification",
      title: "Wait for verification",
      description: evidence.connected
        ? "Your custom domain is connected."
        : "HubForJ verifies DNS, hosting, and HTTPS readiness automatically.",
      state: getState({
        complete: evidence.connected,
        needsAttention: evidence.activationHasAttention || evidence.certificateFailed,
        inProgress: evidence.ownershipComplete && !evidence.connected,
      }),
    },
  ];
}
