import AccountRouteShell from "@/components/patterns/account-route-shell/AccountRouteShell";
import AdminHandoffLauncher from "./AdminHandoffLauncher";

export const dynamic = "force-dynamic";

export default function AccountAdminLauncherPage() {
  return (
    <AccountRouteShell
      eyebrow="Admin area"
      title="Opening your admin area"
      description="Keep this tab open while Hubforj signs you into your community workspace."
      identityLabel="Admin access"
    >
      <AdminHandoffLauncher />
    </AccountRouteShell>
  );
}
