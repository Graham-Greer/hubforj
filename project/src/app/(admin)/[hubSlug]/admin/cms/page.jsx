import { notFound } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import FeatureLocked from "@/components/patterns/feature-locked/FeatureLocked";
import Text from "@/components/primitives/text/Text";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";

export const dynamic = "force-dynamic";

export default async function AdminCmsPage({ params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const featureEnabled = Boolean(hub.features?.cmsPages);

  return (
    <section>
      <PageHeader title="CMS" subtitle="Hub-admin CMS access is feature-gated." />
      <Text tone="secondary">
        CMS editing is currently superadmin-only in MVP.
      </Text>
      <FeatureLocked
        featureKey={featureEnabled ? "cmsPages (superadmin-only)" : "cmsPages"}
        benefits={[
          "Create and manage custom pages",
          "Draft/publish workflows",
          "Header and footer overrides",
        ]}
      />
    </section>
  );
}
