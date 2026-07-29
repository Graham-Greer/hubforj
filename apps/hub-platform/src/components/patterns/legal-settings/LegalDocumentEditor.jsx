"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import LegalSaveConfirmationModal from "@/components/patterns/legal-settings/LegalSaveConfirmationModal";
import SectionRichTextField from "@/components/patterns/section-rich-text-field/SectionRichTextField";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import Accordion from "@/components/ui/accordion/Accordion";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { LEGAL_RICH_TEXT_PROFILE, serializeLegalRichTextContent } from "@/lib/legal/legalSanitizer";
import { saveLegalDocumentAction } from "@/app/(admin)/[hubSlug]/admin/settings/legal/actions";
import styles from "./LegalSettingsWorkspace.module.css";

function formatDateTime(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "Not recorded yet";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <ul className={styles.bulletList}>
      {items.map((item) => (
        <li key={item.key || item.title || item}>{item.title || item}</li>
      ))}
    </ul>
  );
}

const fieldKeys = ["content"];

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, { content: "" }, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function LegalDocumentEditor({
  hubSlug,
  documentType,
  title,
  description,
  helper,
  documentState,
  legacySuggestedContent = [],
  fallbackText,
  canEdit,
  reviewItems = [],
  onSaved,
}) {
  const hasContent = documentState?.hasOwnerProvidedContent === true;
  const feedbackRef = useRef(null);
  const hasLegacySuggestedContent = useMemo(
    () => Array.isArray(legacySuggestedContent) && legacySuggestedContent.length > 0,
    [legacySuggestedContent]
  );
  const serializedContent = useMemo(
    () => serializeLegalRichTextContent(
      hasContent
        ? documentState?.content
        : hasLegacySuggestedContent
          ? legacySuggestedContent
          : documentState?.content
    ),
    [documentState?.content, hasContent, hasLegacySuggestedContent, legacySuggestedContent]
  );
  const initialState = useMemo(
    () => ({
      error: "",
      success: "",
      values: {
        content: serializedContent,
      },
      legalSettings: null,
    }),
    [serializedContent]
  );
  const [state, formAction] = useActionState(saveLegalDocumentAction, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const values = {
    content: serializedContent,
    ...(state?.values || {}),
  };
  const { formRef, isDirty, updateDirtyState, markSaved } = useDirtyFormState({
    initialSnapshot: createSavedValuesSnapshot({ content: serializedContent }),
    createFormSnapshot,
  });

  useEffect(() => {
    if (!state?.error || !feedbackRef.current) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error]);

  useEffect(() => {
    if (!state?.success || !state?.legalSettings) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsModalOpen(false);
      setHasAcknowledged(false);
      markSaved(createSavedValuesSnapshot(state.values));

      if (typeof onSaved === "function") {
        onSaved(state.legalSettings);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [markSaved, onSaved, state?.legalSettings, state?.success, state?.values]);

  function handleOpenModal() {
    if (!canEdit || !isDirty) {
      return;
    }

    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setHasAcknowledged(false);
  }

  const accordionItems = [
    {
      id: "preview",
      title: "Preview public page",
      content: hasContent ? (
        <SectionRichText content={documentState?.content} profile={LEGAL_RICH_TEXT_PROFILE} />
      ) : (
        <p className={styles.previewEmpty}>{fallbackText}</p>
      ),
    },
    {
      id: "details",
      title: "History",
      content: (
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Revision</p>
            <p className={styles.metaValue}>{String(documentState?.revision || 0)}</p>
          </div>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Last updated</p>
            <p className={styles.metaValue}>{formatDateTime(documentState?.updatedAt)}</p>
          </div>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Updated by</p>
            <p className={styles.metaValue}>{documentState?.updatedByUserName || "Not recorded yet"}</p>
          </div>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Last acceptance</p>
            <p className={styles.metaValue}>{formatDateTime(documentState?.acceptedResponsibilityAt)}</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AdminFormSection title={title} description={description}>
      <div className={styles.documentMeta}>
        <Surface tone="muted" padding="md" className={styles.documentCard}>
          <div className={styles.documentHeader}>
            <div className={styles.statusBadges}>
              <Badge tone={hasContent ? "success" : "warning"}>
                {hasContent ? "Live content" : "Fallback active"}
              </Badge>
              {reviewItems.length ? <Badge tone="warning">Review required</Badge> : null}
            </div>
          </div>

          {reviewItems.length ? (
            <div className={styles.roleNotice}>
              <p className={styles.metaLabel}>Update this page for</p>
              {renderList(reviewItems)}
            </div>
          ) : null}

          {!hasContent && hasLegacySuggestedContent ? (
            <div className={styles.roleNotice}>
              <p className={styles.metaLabel}>Legacy content found</p>
              <p className={styles.inlineMeta}>
                Previous content has been preloaded for review. It will not go live until you save it here.
              </p>
            </div>
          ) : null}

          <div className={styles.roleNotice}>
            <p className={styles.inlineMeta}>
              {canEdit
                ? "Saving updates the live public page."
                : "Read only. Owner access is required to save."}
            </p>
          </div>

          {canEdit ? (
            <form
              ref={formRef}
              className={styles.documentForm}
              action={formAction}
              onInput={updateDirtyState}
              onChange={updateDirtyState}
            >
              <input type="hidden" name="hubSlug" value={hubSlug} />
              <input type="hidden" name="documentType" value={documentType} />
              <input type="hidden" name="acknowledgementAccepted" value={hasAcknowledged ? "true" : "false"} />

              <SectionRichTextField
                name="content"
                label={title}
                hint={helper}
                defaultValue={values.content}
                requiredIndicator
                profile={LEGAL_RICH_TEXT_PROFILE}
              />

              <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
                <Button type="button" onClick={handleOpenModal} disabled={!isDirty}>
                  Save legal page
                </Button>
              </AdminFormFooter>

              {isModalOpen ? (
                <LegalSaveConfirmationModal
                  title="What changed since the last accepted review"
                  documentLabel={documentType === "terms" ? "Terms of Service" : "Privacy Policy"}
                  reviewItems={reviewItems}
                  hasAcknowledged={hasAcknowledged}
                  onAcknowledgementChange={setHasAcknowledged}
                  onClose={handleCloseModal}
                  error={state?.error}
                />
              ) : null}
            </form>
          ) : null}
        </Surface>

        <Accordion items={accordionItems} allowMultiple />
      </div>
    </AdminFormSection>
  );
}
