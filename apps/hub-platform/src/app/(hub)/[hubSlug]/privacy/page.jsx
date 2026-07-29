import PublicLegalPage from "@/components/patterns/public-legal-page/PublicLegalPage";
import { getPublicSiteContext } from "@/lib/data/public-site";
import { buildPublicLegalPageModel } from "@/lib/domain/public-legal";
import { getLegalSettingsByHubId } from "@/lib/legal/legalRepository";
import { getTemplateStaticPageConfig } from "@/lib/templates/template-registry";

export async function generateMetadata({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings } = await getPublicSiteContext(hubSlug);
  const siteLabel = siteSettings.siteName || hub.name || "Community";

  return {
    title: `Privacy Policy | ${siteLabel}`,
  };
}

export default async function PrivacyPage({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings } = await getPublicSiteContext(hubSlug);
  const legalSettings = await getLegalSettingsByHubId(hub.id);
  const pageTemplate = getTemplateStaticPageConfig(hub.template);
  const model = buildPublicLegalPageModel("privacy", siteSettings, hub, legalSettings);

  return (
    <PublicLegalPage
      variant={pageTemplate.variant}
      eyebrow={model.eyebrow}
      title={model.title}
      description={model.description}
      sections={model.sections}
    />
  );
}
