import PublicLegalPage from "@/components/patterns/public-legal-page/PublicLegalPage";
import { getPublicSiteContext } from "@/lib/data/public-site";
import { buildPublicLegalPageModel } from "@/lib/domain/public-legal";
import { getLegalSettingsByHubId } from "@/lib/legal/legalRepository";
import { getTemplateStaticPageConfig } from "@/lib/templates/template-registry";

export async function generateMetadata({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings } = await getPublicSiteContext(hubSlug, { homeMedia: false, pageHeroKeys: [] });
  const siteLabel = siteSettings.siteName || hub.name || "Community";

  return {
    title: `Terms of Service | ${siteLabel}`,
  };
}

export default async function TermsPage({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings } = await getPublicSiteContext(hubSlug, { homeMedia: false, pageHeroKeys: [] });
  const legalSettings = await getLegalSettingsByHubId(hub.id);
  const pageTemplate = getTemplateStaticPageConfig(hub.template);
  const model = buildPublicLegalPageModel("terms", siteSettings, hub, legalSettings);

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
