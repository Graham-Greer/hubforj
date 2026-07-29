import RegionalSetupRequiredState from "@/components/patterns/regional-setup-required-state/RegionalSetupRequiredState";
import { requireHubBySlug } from "@/lib/data/hubs";
import { isHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";

export default async function EventsAdminLayout({ children, params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);

  if (!isHubRegionalSetupComplete(hub)) {
    return (
      <RegionalSetupRequiredState
        hub={hub}
        title="Complete regional setup before managing events"
        description="Event scheduling, recurrence, and member-facing pricing all depend on your community timezone and currency."
      />
    );
  }

  return children;
}

