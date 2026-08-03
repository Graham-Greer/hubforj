import { Suspense } from "react";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminRouteStack,
  AdminSettingsOverviewFallback,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import SettingsOverview from "@/components/patterns/settings-overview/SettingsOverview";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getSiteSettingsByHub } from "@/lib/data/site-settings";
import { getLegalSettingsByHubId } from "@/lib/legal/legalRepository";

async function SettingsOverviewLoader({ hub }) {
  const [siteSettings, legalSettings, paymentConfiguration] = await Promise.all([
    getSiteSettingsByHub(hub),
    getLegalSettingsByHubId(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);

  return (
    <SettingsOverview
      hub={hub}
      siteSettings={siteSettings}
      legalSettings={legalSettings}
      paymentConfiguration={paymentConfiguration}
      showHeader={false}
    />
  );
}

export default async function SettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Site settings"
        title="Manage site settings"
        description="Manage site-wide identity, public defaults, and structured contact details without mixing them into page-level copy."
      />
      <Suspense fallback={<AdminSettingsOverviewFallback />}>
        <SettingsOverviewLoader hub={hub} />
      </Suspense>
    </AdminRouteStack>
  );
}
