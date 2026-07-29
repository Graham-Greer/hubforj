import SettingsOverview from "@/components/patterns/settings-overview/SettingsOverview";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getSiteSettingsByHub } from "@/lib/data/site-settings";
import { getLegalSettingsByHubId } from "@/lib/legal/legalRepository";

export default async function SettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [siteSettings, legalSettings, paymentConfiguration] = await Promise.all([
    getSiteSettingsByHub(hub),
    getLegalSettingsByHubId(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);

  return <SettingsOverview hub={hub} siteSettings={siteSettings} legalSettings={legalSettings} paymentConfiguration={paymentConfiguration} />;
}
