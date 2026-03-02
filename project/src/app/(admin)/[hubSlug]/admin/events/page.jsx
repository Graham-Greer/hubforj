import { notFound } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import DataTable from "@/components/patterns/data-table/DataTable";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Link from "@/components/ui/link/Link";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { listEventsByHub } from "@/lib/data/events/event-repository";
import { formatEventDateRange } from "./event-form-data";
import styles from "./page.module.css";

function statusTone(status) {
  if (status === "published") return "success";
  if (status === "cancelled") return "danger";
  return "warning";
}

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const events = await listEventsByHub(hub.id);

  return (
    <section className={styles.root}>
      <PageHeader
        title="Events"
        subtitle="Create and manage hub events with lifecycle controls."
        actions={<Button href={`/${hub.slug}/admin/events/create`}>Create event</Button>}
      />
      <DataTable
        columns={[
          {
            key: "title",
            label: "Title",
            render: (row) => (
              <div className={styles.titleCell}>
                <strong>{row.title}</strong>
                <span>{row.slug}</span>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
          },
          { key: "schedule", label: "Schedule", render: (row) => formatEventDateRange(row.startAt, row.endAt) },
          { key: "category", label: "Category" },
          { key: "visibility", label: "Visibility" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => <Link href={`/${hub.slug}/admin/events/${row.id}`}>Edit</Link>,
          },
        ]}
        rows={events}
        empty={
          <EmptyState
            title="No events yet"
            body="Create your first event to start taking registrations."
            action={<Button href={`/${hub.slug}/admin/events/create`}>Create event</Button>}
          />
        }
      />
    </section>
  );
}
