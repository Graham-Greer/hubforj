import Link from "next/link";
import { redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Button from "@/components/ui/button/Button";
import DataTable from "@/components/patterns/data-table/DataTable";
import { requireSessionRole } from "@/lib/auth/guards";
import { listHubs } from "@/lib/data/hubs/hub-repository";

export const dynamic = "force-dynamic";

export default async function PlatformHubsPage() {
  const session = await requireSessionRole("superadmin", "/platform/sign-in");
  if (!session) redirect("/platform/sign-in");

  const hubs = await listHubs();

  return (
    <section>
      <PageHeader
        title="Hubs"
        subtitle="Provision and configure tenant hubs."
        actions={<Button href="/platform/hubs/create">Create hub</Button>}
      />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "templateKey", label: "Template" },
          {
            key: "customDomains",
            label: "Domains",
            render: (row) => (row.customDomains?.length ? row.customDomains.join(", ") : "—"),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <>
                <Link href={`/platform/hubs/${row.id}`}>Edit</Link>{" "}
                <Link href={`/platform/hubs/${row.id}/invite-admin`}>Invite</Link>{" "}
                <Link href={`/platform/hubs/${row.id}/cms`}>CMS</Link>{" "}
                <Link href={`/platform/support/${row.id}`}>Support mode</Link>
              </>
            ),
          },
        ]}
        rows={hubs}
      />
    </section>
  );
}
