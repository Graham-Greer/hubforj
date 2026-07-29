import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug } from "@/lib/data/hubs";
import { isHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import {
  resolveLaunchFormattingLocale,
  resolveRegionalDefaults,
} from "@/lib/domain/regional-markets";
import { redirect } from "next/navigation";
import RegionalSetupForm from "./RegionalSetupForm";
import styles from "../settings/settings.module.css";

export default async function RegionalOnboardingPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);

  if (isHubRegionalSetupComplete(hub)) {
    redirect(`/${hub.slug}/admin`);
  }

  const regionalDefaults = resolveRegionalDefaults({
    country: hub.country,
    locale: resolveLaunchFormattingLocale(hub.locale, hub.country),
    timezone: hub.timezone,
    defaultCurrency: hub.defaultCurrency,
  });

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Onboarding"
        title="Set up your community region"
        description="Before you create events, courses, or payment plans, confirm the country, timezone, community currency, and English date format your hub should operate with."
      >
        <RegionalSetupForm
          hub={hub}
          initialValues={{
            country: regionalDefaults.country,
            locale: regionalDefaults.locale,
            timezone: regionalDefaults.timezone,
            defaultCurrency: regionalDefaults.defaultCurrency,
          }}
        />
      </WorkspaceSection>
    </div>
  );
}
