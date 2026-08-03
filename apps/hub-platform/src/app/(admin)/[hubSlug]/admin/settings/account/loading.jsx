import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminAccountSettingsFallback,
  AdminRouteStack,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";

export default function AccountSettingsLoading() {
  return (
    <AdminRouteStack>
      <PageHeader
        eyebrow="Account settings"
        title="Plan and domain"
        description="Check your plan, monitor usage, and manage your hub domain from one place."
      />
      <AdminAccountSettingsFallback />
    </AdminRouteStack>
  );
}
