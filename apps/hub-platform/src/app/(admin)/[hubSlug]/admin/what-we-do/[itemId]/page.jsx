import WhatWeDoDetailWorkspace from "@/components/patterns/what-we-do-detail-workspace/WhatWeDoDetailWorkspace";
import EditWhatWeDoForm from "./EditWhatWeDoForm";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getWhatWeDoItemById } from "@/lib/data/what-we-do";
import { normalizeAdminReturnContext } from "@/lib/navigation/admin-return-context";
import { notFound } from "next/navigation";

export default async function WhatWeDoDetailPage({ params, searchParams }) {
  const { hubSlug, itemId } = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await requireHubBySlug(hubSlug);
  const item = await getWhatWeDoItemById(hub.id, itemId);
  const returnContext = normalizeAdminReturnContext({
    hubSlug: hub.slug,
    returnTo: resolvedSearchParams?.returnTo,
    returnSection: resolvedSearchParams?.returnSection || resolvedSearchParams?.section,
  });

  if (!item) {
    notFound();
  }

  return (
    <WhatWeDoDetailWorkspace
      hub={hub}
      item={item}
      returnContext={returnContext}
      form={
        <EditWhatWeDoForm
          key={`${item.id}:${item.updatedAt || ""}`}
          hub={hub}
          item={item}
          returnContext={returnContext}
          initialSuccessMessage={
            resolvedSearchParams?.created === "1"
              ? "What we do item created."
              : resolvedSearchParams?.saved === "1"
                ? "What we do item updated."
                : ""
          }
        />
      }
    />
  );
}
