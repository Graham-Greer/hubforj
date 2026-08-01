import AccountRouteShell from "@/components/patterns/account-route-shell/AccountRouteShell";
import { AccountBillingPanelsSkeleton } from "@/components/patterns/account-loading/AccountPanelSkeletons";
import { accountRouteCopy } from "@/lib/navigation/account-route-copy";

export default function AccountBillingLoading() {
  return (
    <AccountRouteShell {...accountRouteCopy.billing}>
      <AccountBillingPanelsSkeleton />
    </AccountRouteShell>
  );
}
