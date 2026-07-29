import PublicStaticPage from "@/components/patterns/public-static-page/PublicStaticPage";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getTemplateStaticPageConfig } from "@/lib/templates/template-registry";

export default async function AboutPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const pageTemplate = getTemplateStaticPageConfig(hub.template);

  return (
    <PublicStaticPage
      variant={pageTemplate.variant}
      eyebrow="About"
      title="About this hub"
      description="This route is being rebuilt to fit the newer SaaS public-site structure and section system."
      body={[
        "The previous about page implementation has been retired so the replacement can be planned and built cleanly.",
        "For now, use the homepage, testimonials, and footer contact details as the primary public trust surfaces.",
      ]}
    />
  );
}
