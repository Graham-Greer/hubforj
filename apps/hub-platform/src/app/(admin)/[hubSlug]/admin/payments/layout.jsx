import RegionalSetupRequiredState from "@/components/patterns/regional-setup-required-state/RegionalSetupRequiredState";
import { requireHubBySlug } from "@/lib/data/hubs";
import { isHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";

export default async function PaymentsAdminLayout({ children, params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);

  if (!isHubRegionalSetupComplete(hub)) {
    return (
      <RegionalSetupRequiredState
        hub={hub}
        title="Complete regional setup before using payments"
        description="Membership plans, payment reporting, and Stripe Connect setup need your community country and currency confirmed first."
      />
    );
  }

  return children;
}
