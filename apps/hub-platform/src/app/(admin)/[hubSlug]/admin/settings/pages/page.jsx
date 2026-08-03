import { Suspense } from "react";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminPageSettingsFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PageSettingsOverview from "@/components/patterns/page-settings-overview/PageSettingsOverview";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { getSiteSettingsByHub } from "@/lib/data/site-settings";

async function PageSettingsOverviewLoader({ hub }) {
  const siteSettings = await getSiteSettingsByHub(hub);

  return <PageSettingsOverview hub={hub} siteSettings={siteSettings} showHeader={false} />;
}

export default async function PageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Pages"
        title="Edit your public pages"
        description="Update the main content your visitors see on the homepage, events page, courses page, and testimonials page."
      />
      <Suspense fallback={<AdminPageSettingsFallback />}>
        <PageSettingsOverviewLoader hub={hub} />
      </Suspense>
    </AdminRouteStack>
  );
}
