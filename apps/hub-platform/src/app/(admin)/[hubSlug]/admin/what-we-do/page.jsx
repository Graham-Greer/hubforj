import WhatWeDoAdminList from "@/components/patterns/what-we-do-admin-list/WhatWeDoAdminList";
import { requireHubBySlug } from "@/lib/data/hubs";
import { listWhatWeDoItemsByHubSlug } from "@/lib/data/what-we-do";
import { deleteWhatWeDoAction } from "./actions";

export default async function WhatWeDoPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const items = await listWhatWeDoItemsByHubSlug(hub.slug);

  return <WhatWeDoAdminList hub={hub} items={items} deleteWhatWeDoAction={deleteWhatWeDoAction} />;
}
