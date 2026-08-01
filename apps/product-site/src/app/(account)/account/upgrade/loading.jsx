import AccountRouteShell from "@/components/patterns/account-route-shell/AccountRouteShell";
import { AccountUpgradePanelsSkeleton } from "@/components/patterns/account-loading/AccountPanelSkeletons";
import { accountRouteCopy } from "@/lib/navigation/account-route-copy";

export default function AccountUpgradeLoading() {
  return (
    <AccountRouteShell {...accountRouteCopy.upgrade}>
      <AccountUpgradePanelsSkeleton />
    </AccountRouteShell>
  );
}
