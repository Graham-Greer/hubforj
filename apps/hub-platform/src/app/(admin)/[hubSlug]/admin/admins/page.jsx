import EmptyState from "@/components/patterns/empty-state/EmptyState";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import InviteLifecycleList from "@/components/patterns/invite-lifecycle-list/InviteLifecycleList";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { getCurrentHubOperatorAccess } from "@/lib/auth/hub-access";
import { createAdminInviteToken } from "@/lib/auth/admin-invite-token";
import { getServerEnv } from "@/lib/config/env";
import { buildHubAdminInviteAcceptUrl } from "@/lib/domain/admin-invite-links";
import { canManageHubAdmins, isHubOperatorRole } from "@/lib/domain/users";
import { requireHubBySlug } from "@/lib/data/hubs";
import { listInvitesByHub } from "@/lib/data/invites";
import { listUsersByHub } from "@/lib/data/users";
import AdminAccessList from "./AdminAccessList";
import {
  reactivateHubAdminAccessAction,
  resendHubAdminInviteAction,
  revokeHubAdminInviteAction,
  suspendHubAdminAccessAction,
  transferHubOwnershipAction,
} from "./actions";
import styles from "./page.module.css";

export default async function AdminsPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const { success = "", error = "" } = await searchParams;
  const hub = await requireHubBySlug(hubSlug);
  const access = await getCurrentHubOperatorAccess(hub);
  const canManageAdminAccess = Boolean(access && canManageHubAdmins(access.actorRole));
  const admins = (await listUsersByHub(hub.id))
    .filter((user) => isHubOperatorRole(user.role))
    .sort((left, right) => {
      if (left.role === right.role) {
        return 0;
      }

      if (left.role === "owner") {
        return -1;
      }

      if (right.role === "owner") {
        return 1;
      }

      return 0;
    });
  const invites = (await listInvitesByHub(hub.id)).map((invite) => ({
    ...invite,
    acceptanceHref: buildHubAdminInviteAcceptUrl(hub, createAdminInviteToken(invite, getServerEnv().sessionHmacSecret), {
      hubPlatformBaseUrl: getServerEnv().hubPlatformBaseUrl,
      productSiteBaseUrl: getServerEnv().productSiteBaseUrl,
    }),
  }));
  const actionableInvites = invites.filter(
    (invite) => invite.derivedStatus === "pending" || invite.derivedStatus === "expired"
  );

  return (
    <div className={styles.layout}>
      <PageHeader
        eyebrow="Admins"
        title="Manage admin access"
        description="Review who has admin access, keep pending invites visible, and make access changes deliberately."
        actions={
          canManageAdminAccess ? (
            <Button href={`/${hubSlug}/admin/admins/invite`} data-onboarding="admins-invite-button">
              Invite admin
            </Button>
          ) : null
        }
      />
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      {success === "inviteRevoked" ? <FormMessage tone="success">Invite revoked.</FormMessage> : null}
      {success === "inviteResent" ? <FormMessage tone="success">Invite email sent again and expiry extended.</FormMessage> : null}
      {success === "inviteResentLogged" ? (
        <FormMessage tone="warning">Invite expiry was refreshed, but email delivery is not configured yet. Use the acceptance link to share it manually.</FormMessage>
      ) : null}
      {success === "inviteCreated" ? <FormMessage tone="success">Invite email sent.</FormMessage> : null}
      {success === "inviteCreatedLogged" ? (
        <FormMessage tone="warning">Invite created, but email delivery is not configured yet. Use the acceptance link to share it manually.</FormMessage>
      ) : null}
      {success === "inviteAccepted" ? <FormMessage tone="success">Admin onboarding completed.</FormMessage> : null}
      {success === "adminSuspended" ? <FormMessage tone="success">Admin access suspended.</FormMessage> : null}
      {success === "adminReactivated" ? <FormMessage tone="success">Admin access reactivated.</FormMessage> : null}
      {success === "ownershipTransferred" ? <FormMessage tone="success">Ownership transferred.</FormMessage> : null}
      <AdminAccessList
        hubSlug={hubSlug}
        people={admins}
        canManageAdminAccess={canManageAdminAccess}
        onSuspend={suspendHubAdminAccessAction}
        onReactivate={reactivateHubAdminAccessAction}
        onTransferOwnership={transferHubOwnershipAction}
      />
      {actionableInvites.length ? (
        <WorkspaceSection
          eyebrow="Pending access"
          title={`${actionableInvites.length} invite${actionableInvites.length === 1 ? "" : "s"} awaiting action`}
          description="Only pending or expired invites stay here. Accepted admins move into the active list, and revoked invites drop out of the queue."
          actions={canManageAdminAccess ? <Button href={`/${hubSlug}/admin/admins/invite`} variant="secondary">Invite another admin</Button> : null}
          data-onboarding="admins-pending-list"
        >
          <InviteLifecycleList
            hub={hub}
            invites={actionableInvites}
            onRevoke={revokeHubAdminInviteAction}
            onResend={resendHubAdminInviteAction}
            canManageInvites={canManageAdminAccess}
          />
        </WorkspaceSection>
      ) : (
        <div data-onboarding="admins-pending-list">
          <EmptyState
            eyebrow="Pending access"
            title="No invites awaiting action"
            description="Pending or expired admin invites will appear here when action is needed."
            primaryAction={canManageAdminAccess ? { href: `/${hubSlug}/admin/admins/invite`, label: "Invite admin" } : undefined}
            secondaryAction={{ href: `/${hubSlug}/admin`, label: "Back to overview" }}
          />
        </div>
      )}
    </div>
  );
}
