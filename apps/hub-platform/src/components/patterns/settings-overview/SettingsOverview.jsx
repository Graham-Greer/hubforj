import StatCard from "@/components/ui/stat-card/StatCard";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import SettingsPanelCard from "@/components/patterns/settings-panel-card/SettingsPanelCard";
import {
  deriveBrandingSettingsPanelStatus,
  deriveSiteSettingsPanelStatus,
} from "@/lib/domain/site-settings";
import { getHubPaymentSetupState, hubUsesInternalNativePayments } from "@/lib/domain/hub-payment-configuration";
import {
  getHubRegionalOnboardingHref,
  isHubRegionalSetupComplete,
} from "@/lib/domain/hub-regional-setup";
import styles from "./SettingsOverview.module.css";

function deriveLegalSettingsPanelStatus(legalSettings) {
  const legalStatus = legalSettings?.legalStatus || {};

  if (legalStatus.requiresOwnerReview) {
    return {
      label: "Review needed",
      tone: "warning",
    };
  }

  if (Array.isArray(legalStatus.missingDocuments) && legalStatus.missingDocuments.length > 0) {
    return {
      label: "Incomplete",
      tone: "warning",
    };
  }

  return {
    label: "Ready",
    tone: "success",
  };
}

export default function SettingsOverview({ hub, siteSettings, legalSettings = null, paymentConfiguration = null }) {
  const socialCount = Object.values(siteSettings.socialLinks || {}).filter(Boolean).length;
  const brandingStatus = deriveBrandingSettingsPanelStatus(hub, siteSettings);
  const siteStatus = deriveSiteSettingsPanelStatus(hub, siteSettings);
  const legalStatus = deriveLegalSettingsPanelStatus(legalSettings);
  const regionalSetupComplete = isHubRegionalSetupComplete(hub);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const shouldShowStripeSetupCard = hubUsesInternalNativePayments(hub) && paymentSetupState.key !== "ready";
  const legalMeta = legalSettings?.legalStatus?.requiresOwnerReview
    ? "Platform changes mean at least one legal page should be reviewed."
    : Array.isArray(legalSettings?.legalStatus?.missingDocuments) && legalSettings.legalStatus.missingDocuments.length > 0
      ? "Owner-provided legal content is still missing for at least one document."
      : "Terms and Privacy currently have accepted owner-provided content.";

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Site settings"
        title="Manage site settings"
        description="Manage site-wide identity, public defaults, and structured contact details without mixing them into page-level copy."
      />

      <div className={styles.stats}>
        <StatCard label="Public theme" value={hub.theme} detail="Current public and member-facing theme mode." />
        <StatCard label="Public template" value={hub.template} detail="Current public site template family." />
        <StatCard label="Social links" value={String(socialCount)} detail="Configured public social destinations." />
      </div>

      <div className={styles.grid}>
        {!regionalSetupComplete ? (
          <SettingsPanelCard
            onboardingKey="regional-setup-card"
            title="Regional setup"
            body="Confirm the community country, timezone, currency, and English date format before you start using events, courses, or payments."
            meta="Required before scheduling and payment workflows unlock."
            href={getHubRegionalOnboardingHref(hub)}
            actionLabel="Complete regional setup"
            status={{ label: "Needs attention", tone: "warning" }}
          />
        ) : null}
        <SettingsPanelCard
          onboardingKey="branding-settings-card"
          title="Branding"
          body="Manage hub identity, public site name, tagline, and the public theme/template choices."
          meta={`${siteSettings.siteName} • ${siteSettings.themeKey}`}
          href={`/${hub.slug}/admin/settings/branding`}
          actionLabel="Edit brand settings"
          status={brandingStatus}
        />
        <SettingsPanelCard
          onboardingKey="site-settings-card"
          title="Site"
          body="Update contact details, address, hours, social links, and SEO defaults as structured public-site configuration."
          meta={siteSettings.contactEmail || "Contact details not configured"}
          href={`/${hub.slug}/admin/settings/site`}
          actionLabel="Edit site settings"
          status={siteStatus}
        />
        {shouldShowStripeSetupCard ? (
          <SettingsPanelCard
            onboardingKey="stripe-setup-card"
            title="Stripe setup"
            body="Complete Stripe setup before you start charging members through paid events, courses, or membership plans on Growth."
            meta="Required before native member payments can go live."
            href={`/${hub.slug}/admin/payments?view=setup`}
            actionLabel="Finish Stripe setup"
            status={{ label: "Needs attention", tone: "warning" }}
          />
        ) : null}
        <SettingsPanelCard
          title="Legal pages"
          body="Review the platform data-use summary and manage the Terms of Service and Privacy Policy shown on the public website."
          meta={legalMeta}
          href={`/${hub.slug}/admin/settings/legal`}
          actionLabel="Open legal settings"
          status={legalStatus}
        />
      </div>
    </div>
  );
}
