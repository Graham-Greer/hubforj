"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal/Modal";
import Surface from "@/components/primitives/surface/Surface";
import {
  getUserRoleLabel,
  getUserRoleTone,
  getUserStatusLabel,
  getUserStatusTone,
} from "@/lib/domain/users";
import styles from "./AdminAccessList.module.css";

function formatShortDate(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, 10) : "";
}

function buildConfirmationCopy(mode, person) {
  const name = person?.name || person?.email || "this admin";

  if (mode === "suspend") {
    return {
      title: "Suspend admin access",
      description: `${name} will lose access to the hub admin portal until you reactivate them. This does not delete their historical records.`,
      confirmLabel: "Suspend admin",
    };
  }

  if (mode === "reactivate") {
    return {
      title: "Reactivate admin access",
      description: `${name} will regain access to the hub admin portal immediately.`,
      confirmLabel: "Reactivate admin",
    };
  }

  return {
    title: "Transfer ownership",
    description: `${name} will become the owner of this hub. You will become a standard admin, and only one owner can exist at a time.`,
    confirmLabel: "Transfer ownership",
  };
}

export default function AdminAccessList({
  hubSlug,
  people,
  canManageAdminAccess = false,
  onSuspend,
  onReactivate,
  onTransferOwnership,
}) {
  const [pendingAction, setPendingAction] = useState(null);
  const confirmation = pendingAction ? buildConfirmationCopy(pendingAction.type, pendingAction.person) : null;

  if (!people.length) {
    return (
      <Surface tone="muted" padding="md" data-onboarding="admins-active-list">
        <p className={styles.empty}>Admin users will appear here once access is granted.</p>
      </Surface>
    );
  }

  return (
    <>
      <div className={styles.list} data-onboarding="admins-active-list">
        {people.map((person) => {
          const canManagePerson = canManageAdminAccess && person.role === "admin";
          const isSuspended = person.status === "suspended";
          const actionItems = [
            isSuspended
              ? {
                  label: "Reactivate",
                  value: "reactivate",
                  onSelect: () => setPendingAction({ type: "reactivate", person }),
                }
              : {
                  label: "Suspend",
                  value: "suspend",
                  onSelect: () => setPendingAction({ type: "suspend", person }),
                },
            !isSuspended
              ? {
                  label: "Transfer ownership",
                  value: "transfer",
                  onSelect: () => setPendingAction({ type: "transfer", person }),
                }
              : null,
          ].filter(Boolean);

          return (
            <Surface key={person.id} padding="md" className={styles.row}>
              <div className={styles.identity}>
                <strong className={styles.name}>{person.name || person.email}</strong>
                <span className={styles.email}>{person.email}</span>
              </div>

              <div className={styles.meta}>
                <div className={styles.badgeRow}>
                  <Badge tone={getUserRoleTone(person.role)}>{getUserRoleLabel(person.role)}</Badge>
                  <Badge tone={getUserStatusTone(person.status)}>{getUserStatusLabel(person.status)}</Badge>
                </div>
                <div className={styles.dateRow}>
                  {person.lastSignedInAt ? <span className={styles.secondary}>Last seen {formatShortDate(person.lastSignedInAt)}</span> : null}
                  {person.createdAt ? <span className={styles.secondary}>Created {formatShortDate(person.createdAt)}</span> : null}
                </div>
              </div>

              {canManagePerson ? (
                <div className={styles.actions}>
                  <CompactMenu
                    items={actionItems}
                    triggerAriaLabel={`Manage ${person.name || person.email}`}
                    triggerTooltip="Admin actions"
                    triggerVariant="ghost"
                    triggerSize="sm"
                    align="end"
                  >
                    <Icon name="more_vert" size="sm" decorative />
                  </CompactMenu>
                </div>
              ) : null}
            </Surface>
          );
        })}
      </div>

      {pendingAction && confirmation ? (
        <Modal
          title={confirmation.title}
          onClose={() => setPendingAction(null)}
          actions={
            <>
              <Button type="button" variant="ghost" onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <form
                action={
                  pendingAction.type === "suspend"
                    ? onSuspend
                    : pendingAction.type === "reactivate"
                      ? onReactivate
                      : onTransferOwnership
                }
              >
                <input type="hidden" name="hubSlug" value={hubSlug} />
                <input type="hidden" name="userId" value={pendingAction.person.id} />
                <Button type="submit">
                  {confirmation.confirmLabel}
                </Button>
              </form>
            </>
          }
        >
          <div className={styles.modalBody}>
            <p className={styles.modalText}>{confirmation.description}</p>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
