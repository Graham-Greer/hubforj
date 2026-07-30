import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import StatCard from "@/components/ui/stat-card/StatCard";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import { getHubAdminOverviewBySlug } from "@/lib/data/hub-admin";
import { resolvePackageManagementHandoff } from "@/lib/domain/package-management-handoff";
import AccountDomainDisconnectForm from "./AccountDomainDisconnectForm";
import AccountDomainSetupForm from "./AccountDomainSetupForm";
import AccountDomainVerificationCheckForm from "./AccountDomainVerificationCheckForm";
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

export default async function AccountSettingsPage({ params }) {
  const { hubSlug } = await params;
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
  const isVerifying = domainStatus === "verifying";
  const isVerificationFailed = domainStatus === "verification_failed";
  const showVerificationPanel =
    canManageCustomDomain &&
    !isDisconnected &&
    Boolean(domainState?.verificationMethod) &&
    (isPendingVerification || isVerifying || isVerificationFailed);
  const showSetupForm = canManageCustomDomain && !isConnected && !isDisconnectScheduled;
  const showDisconnectForm = canManageCustomDomain && isConnected;
  const visibleCustomDomainValue =
    isConnected || isDisconnectScheduled || isPendingVerification || isVerifying || isVerificationFailed
      ? domainState?.hostname || "Not connected"
      : domainState?.hostname || "Not connected";
  const customDomainLabel =
    isConnected || isDisconnectScheduled ? "Custom domain" : isDisconnected ? "Previously connected domain" : "Custom domain";
  const setupTitle = isDisconnected
    ? "Reconnect custom domain"
    : isPendingVerification
      ? "Verification is pending"
      : isVerificationFailed
        ? "Update custom-domain setup"
        : "Connect custom domain";
  const setupDescription = isDisconnected
    ? "The last custom domain has been removed. Enter the hostname you want to connect next."
    : isPendingVerification
      ? "The hostname is stored and waiting for DNS verification."
      : isVerificationFailed
        ? "Update the hostname if needed, then continue the DNS verification flow."
        : "Enter the primary hostname the hub should use publicly.";
  const setupInitialHostname = isDisconnected ? "" : domainState?.hostname || "";
  const domainStatusDescription = buildDomainStatusDescription({ canManageCustomDomain, domainStatus, domainState });
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
    <div className={styles.root}>
      <PageHeader
        eyebrow="Account settings"
        title="Plan and domain"
        description="Check your plan, monitor usage, and manage your hub domain from one place."
      />

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
              : "Active members available on this package."
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
              : "Published upcoming events available on this package."
          }
        />
        <StatCard
          label="Hubforj-hosted address"
          value={domainState?.platformHostedHref || hub?.domainLabel || "Unknown"}
          className={styles.hostStat}
          detail="This Hubforj-hosted address remains available even when no custom domain is connected."
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
                  <div className={styles.noticeCopy}>
                    <span className={styles.domainLabel}>Status</span>
                    <div className={styles.badgeRow}>
                      <Badge tone={domainState?.statusTone || "neutral"}>{domainState?.statusLabel || "Unknown"}</Badge>
                    </div>
                    <p className={styles.capabilityDetail}>{domainStatusDescription}</p>
                  </div>
                </div>

                <div className={styles.domainFacts}>
                  <div className={styles.domainFact}>
                    <span className={styles.domainLabel}>Hubforj-hosted address</span>
                    <strong className={styles.domainValue}>{domainState?.platformHostedHref || "Unknown"}</strong>
                  </div>
                  <div className={styles.domainFact}>
                    <span className={styles.domainLabel}>{customDomainLabel}</span>
                    <strong className={styles.domainValue}>{visibleCustomDomainValue}</strong>
                  </div>
                  {domainState?.disconnectAt && isDisconnectScheduled ? (
                    <div className={styles.domainFact}>
                      <span className={styles.domainLabel}>Scheduled disconnect</span>
                      <strong className={styles.domainValue}>{domainState.disconnectAt}</strong>
                    </div>
                  ) : null}
                </div>
              </Surface>

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
                  {showVerificationPanel ? (
                    <div className={styles.verificationPanel}>
                      <div className={styles.verificationGrid}>
                        <div className={styles.domainDetailsItem}>
                          <span className={styles.domainLabel}>Verification record type</span>
                          <strong className={styles.domainValue}>TXT</strong>
                        </div>
                        <div className={styles.domainDetailsItem}>
                          <span className={styles.domainLabel}>Verification host</span>
                          <strong className={styles.domainValue}>{domainState.verificationHost || "Not generated yet"}</strong>
                        </div>
                        <div className={styles.domainDetailsItem}>
                          <span className={styles.domainLabel}>Verification value</span>
                          <strong className={styles.domainValue}>{domainState.verificationTarget || "Not generated yet"}</strong>
                        </div>
                        <div className={styles.domainDetailsItem}>
                          <span className={styles.domainLabel}>Last checked</span>
                          <strong className={styles.domainValue}>{domainState.lastCheckedAt || "Not checked yet"}</strong>
                        </div>
                      </div>
                      <p className={styles.capabilityDetail}>
                        Add this TXT record with your DNS provider, wait for it to update, then check again.
                      </p>
                      {domainState?.failureReason ? <p className={styles.capabilityDetail}>{domainState.failureReason}</p> : null}
                      {domainState?.activationBlockedReason ? (
                        <p className={styles.capabilityDetail}>{domainState.activationBlockedReason}</p>
                      ) : null}
                      <AccountDomainVerificationCheckForm hubSlug={hub.slug} />
                    </div>
                  ) : null}
                </Surface>
              ) : null}

              {showDisconnectForm ? (
                <Surface tone="accent" padding="md" className={styles.domainActionPanel}>
                  <div className={styles.noticeCopy}>
                    <h3 className={styles.noticeTitle}>Disconnect custom domain</h3>
                    <p className={styles.capabilityDetail}>
                      Use this if you want the hub to stop using the current custom domain and return to its Hubforj-hosted address.
                    </p>
                  </div>
                  <AccountDomainDisconnectForm hubSlug={hub.slug} hostname={domainState.hostname} />
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
    </div>
  );
}
