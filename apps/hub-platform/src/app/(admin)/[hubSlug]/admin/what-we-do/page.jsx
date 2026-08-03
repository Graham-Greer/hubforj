import { Suspense } from "react";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminRouteStack,
  AdminStatsListFallback,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WhatWeDoAdminList from "@/components/patterns/what-we-do-admin-list/WhatWeDoAdminList";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { listWhatWeDoItemsByHubSlug } from "@/lib/data/what-we-do";
import { deleteWhatWeDoAction } from "./actions";

async function WhatWeDoWorkspace({ hub }) {
  const items = await listWhatWeDoItemsByHubSlug(hub.slug);

  return <WhatWeDoAdminList hub={hub} items={items} deleteWhatWeDoAction={deleteWhatWeDoAction} showHeader={false} />;
}

export default async function WhatWeDoPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="What we do"
        title="Manage items"
        description="Review homepage offering content, we recommend keeping it to 6 items max to avoid cluttering the home page."
        actions={<Button href={`/${hub.slug}/admin/what-we-do/create`}>Create item</Button>}
      />
      <Suspense fallback={<AdminStatsListFallback rows={4} />}>
        <WhatWeDoWorkspace hub={hub} />
      </Suspense>
    </AdminRouteStack>
  );
}
