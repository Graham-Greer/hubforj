import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminRouteStack,
  AdminStatsListFallback,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";

export default function WhatWeDoLoading() {
  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="What we do"
        title="Manage items"
        description="Review homepage offering content, we recommend keeping it to 6 items max to avoid cluttering the home page."
      />
      <AdminStatsListFallback rows={4} />
    </AdminRouteStack>
  );
}
