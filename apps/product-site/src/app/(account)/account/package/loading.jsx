import AccountRouteShell from "@/components/patterns/account-route-shell/AccountRouteShell";
import { AccountPackagePanelsSkeleton } from "@/components/patterns/account-loading/AccountPanelSkeletons";
import { accountRouteCopy } from "@/lib/navigation/account-route-copy";

export default function AccountPackageLoading() {
  return (
    <AccountRouteShell {...accountRouteCopy.package}>
      <AccountPackagePanelsSkeleton />
    </AccountRouteShell>
  );
}
