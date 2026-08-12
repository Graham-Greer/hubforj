import { Suspense } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import StatCard from "@/components/ui/stat-card/StatCard";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminAccountSettingsFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import Surface from "@/components/primitives/surface/Surface";
import { getHubAdminOverviewBySlug } from "@/lib/data/hub-admin";
import { resolvePackageManagementHandoff } from "@/lib/domain/package-management-handoff";
import AccountDomainConnectionHealth from "./AccountDomainConnectionHealth";
import AccountDomainTools from "./AccountDomainTools";
import AccountDomainSetupForm from "./AccountDomainSetupForm";
import {
  buildConnectionHealthSteps,
  buildDnsRecords,
  buildSetupGuideChecks,
  formatDateTimeLabel,
  getCustomDomainStatusIcon,
  getCustomDomainStatusTone,
} from "./accountDomainViewModel";
import styles from "./page.module.css";

function buildPackageHighlights(packageInfo) {
  if (!packageInfo) {
    return [];
  }

  const items = [];

  if (!packageInfo.capabilities.customDomainEnabled) {
    items.push({
      label: "Custom domain locked",
      tone: "warning",
    });
  }

  if (packageInfo.paymentProcessingMode === "internal") {
    items.push({
      label: "Built-in payments",
      tone: "success",
    });
  } else if (packageInfo.paymentProcessingMode === "external") {
    items.push({
      label: "External payments",
      tone: "neutral",
    });
  } else {
    items.push({
      label: "Paid offerings locked",
      tone: "warning",
    });
  }

  if (!packageInfo.capabilities.reportingEnabled) {
    items.push({
      label: "Reporting locked",
      tone: "warning",
    });
  }

  return items;
}

function buildDomainStatusDescription({ canManageCustomDomain, domainStatus, domainState }) {
  const hostedAddress = domainState?.platformHostedHref || domainState?.currentHostLabel || "the Hubforj-hosted address";

  if (!canManageCustomDomain) {
    return `Upgrade to Growth to replace ${hostedAddress} with your own branded website address.`;
  }

  if (domainStatus === "connected") {
    return "This hub is currently serving on its custom domain.";
  }

  if (domainStatus === "disconnect_scheduled") {
    return `This hub is scheduled to return to ${hostedAddress} once the disconnect runs.`;
  }

  if (domainStatus === "verifying") {
    return domainState?.activationBlockedReason
      ? "Your DNS record has been found. Final connection is still pending in this environment."
      : "Your DNS record has been found. Final connection is the next step.";
  }

  if (domainStatus === "provisioning") {
    return "HubForJ is preparing this domain for DNS verification.";
  }

  if (domainStatus === "provisioning_failed") {
    return domainState?.failureReason || "HubForJ could not prepare this domain just now. Try again in a moment.";
  }

  if (domainStatus === "activation_ready") {
    return domainState?.activationBlockedReason || "Custom-domain checks are complete. Activation is pending.";
  }

  if (domainStatus === "pending_verification") {
    return "Your custom domain has been added and is waiting for DNS verification.";
  }

  if (domainStatus === "verification_failed") {
    return "We could not confirm the DNS record yet. Update it if needed and try again.";
  }

  if (domainStatus === "disconnected") {
    return "The previous custom domain has been disconnected. You can connect a new domain from here.";
  }

  return "This hub has Growth entitlement and is ready for a custom domain.";
}

function buildDomainSetupTitle(domainStatus) {
  if (domainStatus === "disconnected") {
    return "Reconnect custom domain";
  }

  if (domainStatus === "provisioning") {
    return "Preparing custom domain";
  }

  if (domainStatus === "provisioning_failed") {
    return "Retry custom-domain setup";
  }

  if (domainStatus === "pending_verification") {
    return "Verification is pending";
  }

  if (domainStatus === "activation_ready") {
    return "Ready to connect";
  }

  if (domainStatus === "verification_failed") {
    return "Update custom-domain setup";
  }

  return "Connect custom domain";
}

function buildDomainSetupDescription(domainStatus) {
  if (domainStatus === "disconnected") {
    return "The last custom domain has been removed. Enter the hostname you want to connect next.";
  }

  if (domainStatus === "provisioning") {
    return "We are attaching the domain to the HubForJ hosting project before DNS verification can continue.";
  }

  if (domainStatus === "provisioning_failed") {
    return "The previous setup attempt could not complete. Check the hostname and try again.";
  }

  if (domainStatus === "pending_verification") {
    return "The hostname is stored and waiting for DNS verification.";
  }

  if (domainStatus === "activation_ready") {
    return "All external domain checks have passed. Final activation is controlled by the platform environment.";
  }

  if (domainStatus === "verification_failed") {
    return "Update the hostname if needed, then continue the DNS verification flow.";
  }

  return "Enter the primary hostname the hub should use publicly.";
}

function DomainFact({ icon, label, value, hint }) {
  return (
    <div className={styles.domainFact}>
      <span className={styles.domainFactIcon} aria-hidden="true">
        <Icon name={icon} size="sm" decorative />
      </span>
      <div className={styles.domainFactBody}>
        <span className={styles.domainLabel}>{label}</span>
        <strong className={styles.domainValue}>{value}</strong>
        {hint ? <span className={styles.domainHint}>{hint}</span> : null}
      </div>
    </div>
  );
}

function DomainMetaItem({ icon, label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className={styles.domainMetaItem}>
      {icon === "status_dot" ? (
        <span className={styles.domainMetaDot} aria-hidden="true" />
      ) : (
        <Icon name={icon} size="sm" decorative className={styles.domainMetaIcon} />
      )}
      <span className={styles.domainMetaLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function AccountSettingsContent({ hubSlug }) {
  const overview = await getHubAdminOverviewBySlug(hubSlug);
  const hub = overview?.hub || null;
  const packageInfo = overview?.package || null;
  const packageManagementHandoff = resolvePackageManagementHandoff({
    hubId: hub?.id,
    hubSlug: hub?.slug,
    returnPath: `/${hubSlug}/admin/settings/account`,
  });
  const domainState = hub?.customDomain || null;
  const activeMembersLimit = packageInfo?.limits?.activeMembers;
  const activeUpcomingEventsLimit = packageInfo?.limits?.activeUpcomingEvents;
  const packageHighlights = buildPackageHighlights(packageInfo);
  const isGrowthPackage = packageInfo?.packageTier === "growth";
  const canManageCustomDomain = packageInfo?.capabilities?.customDomainEnabled === true;
  const domainStatus = domainState?.status || "not_configured";
  const hasHistoricalHostname = Boolean(domainState?.hostname);
  const isConnected = domainStatus === "connected";
  const isDisconnectScheduled = domainStatus === "disconnect_scheduled";
  const isDisconnected = domainStatus === "disconnected";
  const isPendingVerification = domainStatus === "pending_verification";
  const isActivationReady = domainStatus === "activation_ready";
  const isVerifying = domainStatus === "verifying";
  const isVerificationFailed = domainStatus === "verification_failed";
  const showVerificationPanel =
    canManageCustomDomain &&
    !isDisconnected &&
    Boolean(domainState?.verificationMethod) &&
    (isPendingVerification || isVerifying || isVerificationFailed || isActivationReady);
  const showDnsInstructionPanel =
    canManageCustomDomain &&
    !isDisconnected &&
    hasHistoricalHostname &&
    Boolean(domainState?.verificationMethod) &&
    (showVerificationPanel || isConnected);
  const showSetupForm = canManageCustomDomain && !isConnected && !isDisconnectScheduled;
  const showDisconnectForm = canManageCustomDomain && isConnected;
  const visibleCustomDomainValue = domainState?.hostname || "Not connected";
  const customDomainLabel =
    isConnected || isDisconnectScheduled ? "Custom domain" : isDisconnected ? "Previously connected domain" : "Custom domain";
  const setupTitle = buildDomainSetupTitle(domainStatus);
  const setupDescription = buildDomainSetupDescription(domainStatus);
  const setupInitialHostname = isDisconnected ? "" : domainState?.hostname || "";
  const domainStatusDescription = buildDomainStatusDescription({ canManageCustomDomain, domainStatus, domainState });
  const dnsRecords = buildDnsRecords(domainState);
  const connectionHealthSteps = buildConnectionHealthSteps(domainState, domainStatus, { canManageCustomDomain });
  const setupGuideChecks = buildSetupGuideChecks({ domainState, domainStatus, records: dnsRecords });
  const domainStatusTone = getCustomDomainStatusTone(domainState, domainStatus);
  const domainStatusIcon = getCustomDomainStatusIcon(domainState, domainStatus);
  const connectedAtLabel = formatDateTimeLabel(domainState?.connectedAt);
  const lastCheckedLabel = formatDateTimeLabel(domainState?.lastCheckedAt || domainState?.dnsRoutingLastCheckedAt || domainState?.vercelVerificationLastCheckedAt);
  const disconnectAtLabel = formatDateTimeLabel(domainState?.disconnectAt);
  const domainCardClassName = styles.card;
  const showLockedDomainUpgradePanel = !canManageCustomDomain;
  const domainContentClassName = [
    styles.domainContent,
    !showLockedDomainUpgradePanel && !showSetupForm && !showDisconnectForm && !isDisconnectScheduled
      ? styles.domainContentSingle
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const domainOverviewClassName = [
    styles.domainOverview,
    !showLockedDomainUpgradePanel && !showSetupForm && !showDisconnectForm && !isDisconnectScheduled
      ? styles.domainOverviewExpanded
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {packageInfo ? (
        <Surface padding="md" className={styles.packagePanel} data-onboarding="account-package-panel">
          <div className={styles.packageIdentity}>
            <div className={styles.packageCopy}>
              <div className={styles.badgeRow}>
                <Badge tone="accent">{packageInfo.packageTierLabel}</Badge>
                <Badge
                  tone={
                    packageInfo.packageStatus === "active"
                      ? "success"
                      : packageInfo.packageStatus === "trialing"
                        ? "warning"
                        : "danger"
                  }
                >
                  {packageInfo.packageStatusLabel}
                </Badge>
              </div>
              <h2 className={styles.sectionTitle}>Current package</h2>
              <p className={styles.description}>
                See your current plan, the features available to you, and where you are nearing your limits.
              </p>
            </div>
            <div className={styles.actions}>
              <Button
                href={packageManagementHandoff.managePackageHref || undefined}
                variant="secondary"
                disabled={!packageManagementHandoff.managePackageAvailable}
                target="_blank"
                rel="noreferrer"
                data-onboarding="account-manage-package-button"
              >
                Open package management
              </Button>
              {!isGrowthPackage ? (
                <Button
                  href={packageManagementHandoff.upgradeToGrowthHref || undefined}
                  disabled={!packageManagementHandoff.upgradeToGrowthAvailable}
                  target="_blank"
                  rel="noreferrer"
                  data-onboarding="account-upgrade-growth-button"
                >
                  Upgrade to Growth
                </Button>
              ) : null}
            </div>
          </div>
          {packageHighlights.length > 0 ? (
            <div className={styles.packageHighlights}>
              {packageHighlights.map((item) => (
                <Badge key={item.label} tone={item.tone}>
                  {item.label}
                </Badge>
              ))}
            </div>
          ) : null}
          <p className={styles.meta}>
            {!packageManagementHandoff.managePackageAvailable && !packageManagementHandoff.upgradeToGrowthAvailable
              ? "Package changes will appear here once the commercial account handoff is configured for this environment."
              : isGrowthPackage
                ? "Manage this package and billing through your commercial account area."
                : "Manage package changes and billing through your commercial account area."}
          </p>
        </Surface>
      ) : null}

      <div className={styles.stats}>
        <StatCard
          label="Active members"
          value={
            Number.isFinite(activeMembersLimit)
              ? `${overview.activeMemberCount}/${activeMembersLimit}`
              : String(overview?.activeMemberCount || 0)
          }
          detail={
            Number.isFinite(activeMembersLimit)
              ? "Current active-member usage against this package limit."
              : "No active-member package limit is enforced."
          }
        />
        <StatCard
          label="Active upcoming events"
          value={
            Number.isFinite(activeUpcomingEventsLimit)
              ? `${overview.activeUpcomingPublishedEventCount}/${activeUpcomingEventsLimit}`
              : String(overview?.activeUpcomingPublishedEventCount || 0)
          }
          detail={
            Number.isFinite(activeUpcomingEventsLimit)
              ? "Published upcoming event usage against this package limit."
              : "No published-upcoming-event package limit is enforced."
          }
        />
        <StatCard
          label="Hubforj-hosted address"
          value={domainState?.platformHostedHref || hub?.domainLabel || "Unknown"}
          className={styles.hostStat}
          detail={
            isConnected
              ? "This HubForJ-hosted address remains available as a fallback for admin access and support."
              : "This HubForJ-hosted address remains available until a custom domain is connected."
          }
        />
      </div>

      <div className={styles.grid}>
        <Surface padding="md" className={domainCardClassName} data-onboarding="account-custom-domain-card">
          <div className={styles.cardCopy}>
            <h2 className={styles.sectionTitle}>Custom domain</h2>
            <p className={styles.description}>Manage the website address people use to visit this hub.</p>
          </div>
          <div className={styles.domainPanel}>
            <div className={domainContentClassName}>
              <Surface padding="md" className={domainOverviewClassName}>
                <div className={styles.domainOverviewHeader}>
                  <h3 className={styles.noticeTitle}>Domain overview</h3>
                  <div className={styles.badgeRow}>
                    <Badge tone={domainState?.statusTone || "neutral"}>{domainState?.statusLabel || "Unknown"}</Badge>
                    {canManageCustomDomain ? <Badge tone="accent">Growth feature</Badge> : null}
                  </div>
                </div>

                <div className={styles.domainStatusSummary} data-tone={domainStatusTone}>
                  <span className={styles.domainStatusIcon} aria-hidden="true">
                    <Icon name={domainStatusIcon} size="md" decorative />
                  </span>
                  <div className={styles.domainStatusCopy}>
                    <strong>{domainState?.statusLabel || "Unknown"}</strong>
                    <p>{domainStatusDescription}</p>
                  </div>
                </div>

                <div className={styles.domainFacts}>
                  <DomainFact
                    icon="home"
                    label="HubForJ fallback"
                    value={domainState?.platformHostedHref || "Unknown"}
                    hint={
                      isConnected
                        ? "Fallback address used if the custom domain is unavailable."
                        : "Default HubForJ-hosted address for this hub."
                    }
                  />
                  <DomainFact
                    icon="language"
                    label={customDomainLabel}
                    value={visibleCustomDomainValue}
                    hint={
                      isConnected
                        ? "Primary domain visitors use to access your hub."
                        : "Becomes active after DNS checks pass."
                    }
                  />
                </div>

                {connectedAtLabel || lastCheckedLabel || (disconnectAtLabel && isDisconnectScheduled) ? (
                  <div className={styles.domainMetaStrip}>
                    {connectedAtLabel && isConnected ? (
                      <DomainMetaItem icon="status_dot" label="Connected" value={connectedAtLabel} />
                    ) : null}
                    {lastCheckedLabel ? (
                      <DomainMetaItem icon="schedule" label="Last checked" value={lastCheckedLabel} />
                    ) : null}
                    {disconnectAtLabel && isDisconnectScheduled ? (
                      <DomainMetaItem icon="event" label="Scheduled disconnect" value={disconnectAtLabel} />
                    ) : null}
                  </div>
                ) : null}

                {hasHistoricalHostname ? <AccountDomainConnectionHealth steps={connectionHealthSteps} /> : null}
              </Surface>

              {showDnsInstructionPanel ? (
                <AccountDomainTools
                  records={dnsRecords}
                  setupChecks={setupGuideChecks}
                  hubSlug={hub.slug}
                  hostname={domainState?.hostname || ""}
                  isConnected={isConnected}
                  showDisconnect={showDisconnectForm}
                  showVerification={showVerificationPanel}
                  failureReason={domainState?.failureReason || ""}
                  dnsRoutingFailureReason={domainState?.dnsRoutingFailureReason || ""}
                  activationBlockedReason={domainState?.activationBlockedReason || ""}
                />
              ) : null}

              {showLockedDomainUpgradePanel ? (
                <Surface padding="md" className={styles.domainActionPanel} data-onboarding="account-growth-domain-upgrade-panel">
                  <div className={styles.noticeCopy}>
                    <h3 className={styles.noticeTitle}>Custom domain becomes available on Growth</h3>
                    <p className={styles.capabilityDetail}>
                      Your hub stays live on its Hubforj-hosted address on this package. When you move to Growth, you can connect a branded website address here.
                    </p>
                    <p className={styles.capabilityDetail}>
                      Use the package controls above when you are ready to unlock custom domain support.
                    </p>
                  </div>
                </Surface>
              ) : null}

              {showSetupForm ? (
                <Surface tone="muted" padding="md" className={styles.domainActionPanel} data-onboarding="account-domain-setup-panel">
                  <div className={styles.noticeCopy}>
                    <h3 className={styles.noticeTitle}>{setupTitle}</h3>
                    <p className={styles.capabilityDetail}>{setupDescription}</p>
                  </div>
                  <AccountDomainSetupForm hubSlug={hub.slug} domainState={domainState} initialHostname={setupInitialHostname} />
                </Surface>
              ) : null}

              {isDisconnectScheduled ? (
                <Surface tone="accent" padding="md" className={styles.domainActionPanel}>
                  <div className={styles.noticeCopy}>
                    <h3 className={styles.noticeTitle}>Disconnect scheduled</h3>
                    <p className={styles.capabilityDetail}>
                      This domain is scheduled to be disconnected{domainState.disconnectAt ? ` at ${domainState.disconnectAt}` : ""}.
                    </p>
                    <p className={styles.capabilityDetail}>
                      Once this is complete, the hub will continue on its Hubforj-hosted address: {domainState.platformHostedHref}.
                    </p>
                  </div>
                </Surface>
              ) : null}
            </div>
          </div>
        </Surface>
      </div>
    </>
  );
}

export default async function AccountSettingsPage({ params }) {
  const { hubSlug } = await params;

  return (
    <div className={styles.root}>
      <AdminRouteStack>
        <PageHeader
          eyebrow="Account settings"
          title="Plan and domain"
          description="Check your plan, monitor usage, and manage your hub domain from one place."
        />
        <Suspense fallback={<AdminAccountSettingsFallback />}>
          <AccountSettingsContent hubSlug={hubSlug} />
        </Suspense>
      </AdminRouteStack>
    </div>
  );
}
