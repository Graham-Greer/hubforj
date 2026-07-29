"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Surface from "@/components/primitives/surface/Surface";
import {
  canResendInvite,
  canRevokeInvite,
  getInviteStatusLabel,
  getInviteStatusTone,
} from "@/lib/domain/invites";
import styles from "./InviteLifecycleList.module.css";

export default function InviteLifecycleList({ hub, invites, onRevoke, onResend, canManageInvites = true }) {
  const [copiedInviteId, setCopiedInviteId] = useState("");
  const [copyErrorState, setCopyErrorState] = useState({ inviteId: "", message: "" });

  async function handleCopyLink(invite) {
    setCopyErrorState({ inviteId: "", message: "" });

    if (!invite?.acceptanceHref) {
      setCopyErrorState({
        inviteId: invite?.id || "",
        message: "Acceptance link is unavailable for this invite.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(invite.acceptanceHref);
      setCopiedInviteId(invite.id);
    } catch {
      setCopiedInviteId("");
      setCopyErrorState({
        inviteId: invite.id,
        message: "Unable to copy the acceptance link from this browser.",
      });
    }
  }

  return (
    <div className={styles.list}>
      {invites.map((invite) => {
        const resendFormId = `invite-resend-${invite.id}`;
        const revokeFormId = `invite-revoke-${invite.id}`;
        const menuItems = [];

        if (canManageInvites && invite.acceptanceHref && invite.derivedStatus === "pending") {
          menuItems.push({
            label: copiedInviteId === invite.id ? "Acceptance link copied" : "Copy acceptance link",
            value: "copy",
            onSelect: () => handleCopyLink(invite),
          });
        }

        if (canManageInvites && canResendInvite(invite.status, invite.expiresAt)) {
          menuItems.push({
            label: "Resend invite",
            value: "resend",
            onSelect: () => document.getElementById(resendFormId)?.requestSubmit(),
          });
        }

        if (canManageInvites && canRevokeInvite(invite.status, invite.expiresAt)) {
          menuItems.push({
            label: "Revoke invite",
            value: "revoke",
            onSelect: () => document.getElementById(revokeFormId)?.requestSubmit(),
          });
        }

        return (
          <Surface key={invite.id} padding="md" className={styles.card}>
            <div className={styles.header}>
              <div className={styles.copy}>
                <h3 className={styles.email}>{invite.email}</h3>
                <p className={styles.meta}>
                  {invite.role} access
                  {invite.expiresAt ? ` • expires ${invite.expiresAt.slice(0, 10)}` : ""}
                </p>
              </div>
              <div className={styles.statusActions}>
                <Badge tone={getInviteStatusTone(invite.derivedStatus)}>
                  {getInviteStatusLabel(invite.derivedStatus)}
                </Badge>
                {menuItems.length ? (
                  <CompactMenu
                    items={menuItems}
                    triggerAriaLabel={`Invite actions for ${invite.email}`}
                    triggerTooltip="Invite actions"
                    triggerVariant="ghost"
                    triggerSize="sm"
                  >
                    <Icon name="more_vert" size="sm" decorative />
                  </CompactMenu>
                ) : null}
              </div>
            </div>
            {canManageInvites && canResendInvite(invite.status, invite.expiresAt) ? (
              <form id={resendFormId} action={onResend} className={styles.hiddenActionForm}>
                <input type="hidden" name="hubSlug" value={hub.slug} />
                <input type="hidden" name="inviteId" value={invite.id} />
              </form>
            ) : null}
            {canManageInvites && canRevokeInvite(invite.status, invite.expiresAt) ? (
              <form id={revokeFormId} action={onRevoke} className={styles.hiddenActionForm}>
                <input type="hidden" name="hubSlug" value={hub.slug} />
                <input type="hidden" name="inviteId" value={invite.id} />
              </form>
            ) : null}
          {copiedInviteId === invite.id ? <FormMessage tone="success">Acceptance link copied.</FormMessage> : null}
          {copyErrorState.inviteId === invite.id && copyErrorState.message ? (
            <FormMessage tone="danger">{copyErrorState.message}</FormMessage>
          ) : null}
          </Surface>
        );
      })}
    </div>
  );
}
