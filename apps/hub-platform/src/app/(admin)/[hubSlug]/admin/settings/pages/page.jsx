import PageSettingsOverview from "@/components/patterns/page-settings-overview/PageSettingsOverview";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getSiteSettingsByHub } from "@/lib/data/site-settings";

export default async function PageSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const siteSettings = await getSiteSettingsByHub(hub);

  return <PageSettingsOverview hub={hub} siteSettings={siteSettings} />;
}
