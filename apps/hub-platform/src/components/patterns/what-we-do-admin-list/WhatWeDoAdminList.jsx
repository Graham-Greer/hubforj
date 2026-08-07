"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminFormRuntime } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import StatCard from "@/components/ui/stat-card/StatCard";
import Surface from "@/components/primitives/surface/Surface";
import {
  getWhatWeDoStatusLabel,
  getWhatWeDoStatusTone,
  summarizeWhatWeDoItems,
} from "@/lib/domain/what-we-do";
import styles from "./WhatWeDoAdminList.module.css";

const initialDeleteWhatWeDoActionState = {
  error: "",
  itemId: "",
  title: "",
};

function DeleteWhatWeDoModal({
  hub,
  item,
  deleteWhatWeDoAction,
  onClose,
  returnContext = null,
  hasUnsavedParentChanges = false,
}) {
  const [state, formAction] = useActionState(deleteWhatWeDoAction, initialDeleteWhatWeDoActionState);

  return (
    <Modal
      title="Delete What we do item"
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <form action={formAction}>
            <input type="hidden" name="hubId" value={hub.id} />
            <input type="hidden" name="hubSlug" value={hub.slug} />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="title" value={item.title} />
            {returnContext?.returnTo ? <input type="hidden" name="returnTo" value={returnContext.returnTo} /> : null}
            {returnContext?.returnSection ? <input type="hidden" name="returnSection" value={returnContext.returnSection} /> : null}
            <Button type="submit" variant="secondary">
              Delete item
            </Button>
          </form>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p className={styles.modalText}>
          Delete <strong>{item.title}</strong>? This removes the item from your homepage content and cannot be undone.
        </p>
        {hasUnsavedParentChanges ? (
          <p className={styles.modalText}>
            Your unsaved homepage changes will also be lost when this item is deleted.
          </p>
        ) : null}
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      </div>
    </Modal>
  );
}

function buildReturnQuery(returnContext) {
  if (!returnContext?.returnTo) {
    return "";
  }

  const params = new URLSearchParams();
  params.set("returnTo", returnContext.returnTo);

  if (returnContext.returnSection) {
    params.set("returnSection", returnContext.returnSection);
  }

  return `?${params.toString()}`;
}

export default function WhatWeDoAdminList({
  hub,
  items,
  deleteWhatWeDoAction,
  showHeader = true,
  showStats = true,
  createLabel = "Create item",
  returnContext = null,
}) {
  const summary = summarizeWhatWeDoItems(items);
  const router = useRouter();
  const { isDirty } = useAdminFormRuntime();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const returnQuery = buildReturnQuery(returnContext);

  function handleNavigate(href, label = "Leave form") {
    if (isDirty && returnContext?.returnTo) {
      setPendingNavigation({ href, label });
      return;
    }

    router.push(href);
  }

  return (
    <>
      <div className={styles.root} data-onboarding="what-we-do-list">
        {showHeader ? (
          <PageHeader
            eyebrow="What we do"
            title={!items.length ? "Create the first item" : "Manage items"}
            description={
              !items.length
                ? "Create homepage offering content to describe what your community offers. We recommend creating 3 to 6 items for a clean layout."
                : "Review homepage offering content, we recommend keeping it to 6 items max to avoid cluttering the home page."
            }
            actions={<Button href={`/${hub.slug}/admin/what-we-do/create${returnQuery}`}>{createLabel}</Button>}
          />
        ) : null}

        {showStats ? (
          <div className={styles.stats}>
            <StatCard label="Total" value={String(summary.total)} detail="Structured What we do records." />
            <StatCard label="Published" value={String(summary.published)} detail="Visible on public section surfaces." />
            <StatCard label="Drafts" value={String(summary.drafts)} detail="Still being prepared for publication." />
          </div>
        ) : null}

        {items.length ? (
          <div className={styles.list}>
            {items.map((item) => (
              <Surface key={item.id} className={styles.card} padding="md">
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                      <p className={styles.description}>{item.description}</p>
                    </div>
                  </div>
                  <div className={styles.cardControls}>
                    <div className={styles.badges}>
                      <Badge tone={getWhatWeDoStatusTone(item.status)}>{getWhatWeDoStatusLabel(item.status)}</Badge>
                    </div>
                    <CompactMenu
                      items={[
                        {
                          label: "Edit",
                          value: "edit",
                          onSelect: () => handleNavigate(`/${hub.slug}/admin/what-we-do/${item.id}${returnQuery}`, "Edit item"),
                        },
                        {
                          label: "Delete",
                          value: "delete",
                          onSelect: () => setPendingDelete(item),
                        },
                      ]}
                      triggerAriaLabel={`Manage ${item.title}`}
                      triggerTooltip="Item actions"
                      triggerVariant="ghost"
                      triggerSize="sm"
                      align="end"
                    >
                      <Icon name="more_vert" size="sm" decorative />
                    </CompactMenu>
                  </div>
                </div>
                <p className={styles.cardMeta}>Sort order {item.sortOrder}</p>
              </Surface>
            ))}
          </div>
        ) : null}
      </div>

      {pendingDelete ? (
        <DeleteWhatWeDoModal
          hub={hub}
          item={pendingDelete}
          deleteWhatWeDoAction={deleteWhatWeDoAction}
          returnContext={returnContext}
          hasUnsavedParentChanges={Boolean(isDirty && returnContext?.returnTo)}
          onClose={() => setPendingDelete(null)}
        />
      ) : null}

      {pendingNavigation ? (
        <Modal
          title="Leave homepage editing?"
          onClose={() => setPendingNavigation(null)}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setPendingNavigation(null)}>
                Keep editing
              </Button>
              <Button type="button" onClick={() => router.push(pendingNavigation.href)}>
                {pendingNavigation.label}
              </Button>
            </>
          }
        >
          <p className={styles.modalText}>
            Your unsaved homepage changes will be lost if you leave to manage this What we do item.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
