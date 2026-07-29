import PublicLegalPage from "@/components/patterns/public-legal-page/PublicLegalPage";
import { getPublicSiteContext } from "@/lib/data/public-site";
import { buildPublicLegalPageModel } from "@/lib/domain/public-legal";
import { getTemplateStaticPageConfig } from "@/lib/templates/template-registry";

export async function generateMetadata({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings } = await getPublicSiteContext(hubSlug);
  const siteLabel = siteSettings.siteName || hub.name || "Community";

  return {
    title: `Cookies Policy | ${siteLabel}`,
  };
}

export default async function CookiesPage({ params }) {
  const { hubSlug } = await params;
  const { hub, siteSettings } = await getPublicSiteContext(hubSlug);
  const pageTemplate = getTemplateStaticPageConfig(hub.template);
  const model = buildPublicLegalPageModel("cookies", siteSettings, hub);

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
