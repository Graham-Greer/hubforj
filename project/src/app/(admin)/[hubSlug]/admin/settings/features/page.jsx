import { notFound } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import DataTable from "@/components/patterns/data-table/DataTable";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { listHubFeatures } from "@/lib/data/hubs/feature-flags";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminFeaturesPage({ params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const rows = listHubFeatures(hub.features);

  return (
    <section className={styles.root}>
      <PageHeader
        title="Feature Flags"
        subtitle="Feature visibility is informational only. Enforcement remains server-side."
      />
      <DataTable
        columns={[
          { key: "label", label: "Feature" },
          { key: "description", label: "Description" },
          {
            key: "status",
            label: "Status",
            render: (row) => <Badge tone={row.enabled ? "success" : "warning"}>{row.enabled ? "Enabled" : "Locked"}</Badge>,
          },
          {
            key: "action",
            label: "Route",
            render: (row) => (
              <Button
                href={`/${hub.slug}/admin/settings/features/${row.key}`}
                size="sm"
                variant="secondary"
              >
                {row.enabled ? "View details" : "View locked route"}
              </Button>
            ),
          },
        ]}
        rows={rows}
      />
    </section>
  );
}
