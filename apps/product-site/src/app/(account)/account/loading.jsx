import AccountRouteShell from "@/components/patterns/account-route-shell/AccountRouteShell";
import { AccountOverviewPanelsSkeleton } from "@/components/patterns/account-loading/AccountPanelSkeletons";
import { accountRouteCopy } from "@/lib/navigation/account-route-copy";

export default function AccountLoading() {
  return (
    <AccountRouteShell {...accountRouteCopy.overview}>
      <AccountOverviewPanelsSkeleton />
    </AccountRouteShell>
  );
}
