import { notFound } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import FeatureLocked from "@/components/patterns/feature-locked/FeatureLocked";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import Text from "@/components/primitives/text/Text";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { getHubFeatureByKey } from "@/lib/data/hubs/feature-flags";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminFeatureDetailsPage({ params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const feature = getHubFeatureByKey(hub.features, params.featureKey);
  if (!feature) notFound();

  return (
    <section className={styles.root}>
      <PageHeader
        title={feature.label}
        subtitle="Feature access is enforced server-side. Disabled routes render FeatureLocked."
      />

      {feature.enabled ? (
        <Card className={styles.panel}>
          <div className={styles.statusRow}>
            <Text as="strong">{feature.label} is enabled for this hub.</Text>
            <Badge tone="success">Enabled</Badge>
          </div>
          <Text tone="secondary">{feature.description}</Text>
          {typeof feature.enabledHref === "function" ? (
            <div>
              <Button href={feature.enabledHref(hub.slug)} variant="secondary">
                Open feature surface
              </Button>
            </div>
          ) : (
            <Text size="sm" tone="secondary">
              This feature is enabled but does not have a dedicated admin route in this milestone.
            </Text>
          )}
        </Card>
      ) : (
        <FeatureLocked featureKey={feature.label} benefits={feature.lockedBenefits} />
      )}
    </section>
  );
}
