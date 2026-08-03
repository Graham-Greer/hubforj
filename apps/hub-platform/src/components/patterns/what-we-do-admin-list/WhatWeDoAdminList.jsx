"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
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

function DeleteWhatWeDoModal({ hub, item, deleteWhatWeDoAction, onClose }) {
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
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      </div>
    </Modal>
  );
}

export default function WhatWeDoAdminList({ hub, items, deleteWhatWeDoAction, showHeader = true }) {
  const summary = summarizeWhatWeDoItems(items);
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState(null);

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
            actions={<Button href={`/${hub.slug}/admin/what-we-do/create`}>Create item</Button>}
          />
        ) : null}

        <div className={styles.stats}>
          <StatCard label="Total" value={String(summary.total)} detail="Structured What we do records." />
          <StatCard label="Published" value={String(summary.published)} detail="Visible on public section surfaces." />
          <StatCard label="Drafts" value={String(summary.drafts)} detail="Still being prepared for publication." />
        </div>

        {items.length ? (
          <div className={styles.list}>
            {items.map((item) => (
              <Surface key={item.id} className={styles.card} padding="md">
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                      <p className={styles.cardMeta}>Sort order {item.sortOrder}</p>
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
                          onSelect: () => router.push(`/${hub.slug}/admin/what-we-do/${item.id}`),
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
                <p className={styles.description}>{item.description}</p>
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
          onClose={() => setPendingDelete(null)}
        />
      ) : null}
    </>
  );
}
