"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import HeroSection from "@/components/sections/hero/HeroSection";
import RichTextSection from "@/components/sections/rich-text/RichTextSection";
import CTASection from "@/components/sections/cta/CTASection";
import FeatureGridSection from "@/components/sections/feature-grid/FeatureGridSection";
import AccordionSection from "@/components/sections/accordion/AccordionSection";
import EventListSection from "@/components/sections/event-list/EventListSection";
import ContactSection from "@/components/sections/contact/ContactSection";
import LogoMarqueeSection from "@/components/sections/logo-marquee/LogoMarqueeSection";
import PricingSection from "@/components/sections/pricing/PricingSection";
import StatsSection from "@/components/sections/stats/StatsSection";
import TeamSection from "@/components/sections/team/TeamSection";
import TestimonialsSection from "@/components/sections/testimonials/TestimonialsSection";
import LegalDocumentSection from "@/components/sections/legal/LegalDocumentSection";
import PageSettingsForm from "@/components/patterns/cms/page-settings/PageSettingsForm";
import BlockPicker from "@/components/patterns/cms/block-picker/BlockPicker";
import BlockList from "@/components/patterns/cms/block-list/BlockList";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Tabs from "@/components/ui/tabs/Tabs";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";
import {
  buildBlockForVariant,
  buildPreviewBlockForVariant,
  evaluateBlockReadiness,
  getBlockEditorSchema,
} from "@/lib/data/pages/block-registry";
import {
  createPendingTransition,
  executePendingTransition,
  shouldPromptSectionTransition,
} from "@/lib/cms/editor-interactions";
import styles from "./CmsPageEditorClient.module.css";

const BlockEditor = dynamic(
  () => import("@/components/patterns/cms/block-editor/BlockEditor"),
  {
    loading: () => <p className={styles.loadingState}>Loading section editor...</p>,
  }
);
const MediaLibrary = dynamic(
  () => import("@/components/patterns/cms/media-library/MediaLibrary"),
  {
    loading: () => <p className={styles.loadingState}>Loading media library...</p>,
  }
);

const SECTION_COMPONENTS = {
  HeroSection,
  RichTextSection,
  CTASection,
  FeatureGridSection,
  AccordionSection,
  EventListSection,
  ContactSection,
  LogoMarqueeSection,
  PricingSection,
  StatsSection,
  TeamSection,
  TestimonialsSection,
  LegalDocumentSection,
};

const PREVIEW_MEDIA = [
  { id: "media_preview_hero", publicUrl: "/globe.svg", alt: "Hero preview" },
  { id: "media_preview_feature", publicUrl: "/next.svg", alt: "Feature preview" },
  { id: "media_preview_cta", publicUrl: "/window.svg", alt: "CTA preview" },
  { id: "media_preview_logo_a", publicUrl: "/next.svg", alt: "Partner logo A" },
  { id: "media_preview_logo_b", publicUrl: "/vercel.svg", alt: "Partner logo B" },
  { id: "media_preview_logo_c", publicUrl: "/globe.svg", alt: "Partner logo C" },
  { id: "media_preview_logo_d", publicUrl: "/file.svg", alt: "Partner logo D" },
];

const PREVIEW_EVENTS = [
  {
    id: "evt_preview_1",
    title: "Spring Leadership Workshop",
    category: "Workshop",
    startAt: "2026-04-09T18:00:00.000Z",
  },
  {
    id: "evt_preview_2",
    title: "Member Meetup",
    category: "Meetup",
    startAt: "2026-04-14T00:00:00.000Z",
  },
  {
    id: "evt_preview_3",
    title: "Volunteer Training Course",
    category: "Course",
    startAt: "2026-04-22T16:00:00.000Z",
  },
];

const PREVIEW_MEDIA_BY_ID = new Map(PREVIEW_MEDIA.map((item) => [item.id, item]));

function nextBlockId() {
  return `blk_${Math.random().toString(36).slice(2, 8)}`;
}

export default function CmsPageEditorClient({
  hub,
  initialPage,
  initialErrorCode = "",
  availableBlocks,
  parentPageOptions = [],
  media,
  mediaFolders,
  saveDraftAction,
  publishAction,
  createMediaFolderAction,
  renameMediaFolderAction,
  deleteMediaFolderAction,
  updateMediaAssetAction,
  deleteMediaAssetAction,
}) {
  const [settings, setSettings] = useState({
    title: initialPage.title,
    slug: initialPage.slug,
    status: initialPage.status,
    seo: initialPage.seo || { title: "", description: "", imageMediaId: "" },
    parentPageId: initialPage.parentPageId || "",
    headerIdOverride: initialPage.headerIdOverride || "",
    footerIdOverride: initialPage.footerIdOverride || "",
  });
  const [blocks, setBlocks] = useState(initialPage.draftComposition || []);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [editingBlockId, setEditingBlockId] = useState("");
  const [editingBlockDraft, setEditingBlockDraft] = useState(null);
  const [builderTab, setBuilderTab] = useState("page-sections");
  const [selectedSectionType, setSelectedSectionType] = useState("");
  const [selectedSectionVariant, setSelectedSectionVariant] = useState("");
  const [mediaTarget, setMediaTarget] = useState(null);
  const [mediaItems, setMediaItems] = useState(media || []);
  const [folders, setFolders] = useState(mediaFolders || []);
  const [pendingTransition, setPendingTransition] = useState(null);
  const initialDraftSnapshot = useMemo(
    () => ({
      settings: JSON.stringify({
        title: initialPage.title,
        slug: initialPage.slug,
        status: initialPage.status,
        seo: initialPage.seo || { title: "", description: "", imageMediaId: "" },
        parentPageId: initialPage.parentPageId || "",
        headerIdOverride: initialPage.headerIdOverride || "",
        footerIdOverride: initialPage.footerIdOverride || "",
      }),
      blocks: JSON.stringify(initialPage.draftComposition || []),
    }),
    [initialPage]
  );
  const [sectionSaveState, setSectionSaveState] = useState("idle");

  const editingBlock = useMemo(() => blocks.find((block) => block.id === editingBlockId) || null, [blocks, editingBlockId]);

  const blockSchema = useMemo(() => (editingBlock ? getBlockEditorSchema(editingBlock.type) : []), [editingBlock]);

  const selectedSectionDefinition = useMemo(
    () => availableBlocks.find((block) => block.type === selectedSectionType) || null,
    [availableBlocks, selectedSectionType]
  );

  const previewBlock = useMemo(() => {
    if (!selectedSectionType) return null;
    return buildPreviewBlockForVariant(selectedSectionType, selectedSectionVariant);
  }, [selectedSectionType, selectedSectionVariant]);

  const PreviewSectionComponent = previewBlock ? SECTION_COMPONENTS[previewBlock.type] : null;
  const editingBlockReadiness = useMemo(
    () => (editingBlockDraft ? evaluateBlockReadiness(editingBlockDraft) : editingBlock ? evaluateBlockReadiness(editingBlock) : null),
    [editingBlock, editingBlockDraft]
  );
  const publishReadiness = useMemo(() => {
    const result = (blocks || []).map((block) => ({
      blockId: block.id,
      label: block.label || block.type,
      ...evaluateBlockReadiness(block),
    }));
    const blocking = result.find((entry) => !entry.readyForPublish);
    return {
      readyForPublish: !blocking,
      blocking,
    };
  }, [blocks]);
  const draftReadiness = useMemo(() => {
    const result = (blocks || []).map((block) => ({
      blockId: block.id,
      label: block.label || block.type,
      ...evaluateBlockReadiness(block),
    }));
    const blocking = result.find((entry) => !entry.readyForDraft);
    return {
      readyForDraft: !blocking,
      blocking,
    };
  }, [blocks]);
  const [publishError, setPublishError] = useState("");
  const allowNextPopRef = useRef(false);
  const hasUnsavedSectionChanges = useMemo(() => {
    if (!editingBlock || !editingBlockDraft) return false;
    return JSON.stringify(editingBlockDraft) !== JSON.stringify(editingBlock);
  }, [editingBlock, editingBlockDraft]);
  const hasUnsavedPageDraftChanges = useMemo(() => {
    const currentSettings = JSON.stringify(settings);
    const currentBlocks = JSON.stringify(blocks);
    return (
      currentSettings !== initialDraftSnapshot.settings ||
      currentBlocks !== initialDraftSnapshot.blocks
    );
  }, [settings, blocks, initialDraftSnapshot]);
  const hasAnyUnsavedChanges = hasUnsavedSectionChanges || hasUnsavedPageDraftChanges;

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!hasAnyUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasAnyUnsavedChanges]);

  useEffect(() => {
    if (!hasAnyUnsavedChanges) return undefined;

    const onDocumentClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if ((anchor.getAttribute("rel") || "").includes("external")) return;

      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);
      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash
      ) {
        return;
      }

      event.preventDefault();
      setPendingTransition((prev) =>
        prev ||
        createPendingTransition(
          () => window.location.assign(nextUrl.toString()),
          {
            title: "Discard unsaved updates?",
            message: "You have unsaved updates on this page. Save changes or discard before leaving.",
            confirmText: "Discard and leave",
          }
        )
      );
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [hasAnyUnsavedChanges]);

  useEffect(() => {
    if (!hasAnyUnsavedChanges) return undefined;

    const state = window.history.state || {};
    if (!state.__cmsDirtyGuard) {
      window.history.pushState({ ...state, __cmsDirtyGuard: true }, "", window.location.href);
    }

    const onPopState = () => {
      if (allowNextPopRef.current) {
        allowNextPopRef.current = false;
        return;
      }
      window.history.pushState({ ...(window.history.state || {}), __cmsDirtyGuard: true }, "", window.location.href);
      setPendingTransition((prev) =>
        prev ||
        createPendingTransition(
          () => {
            allowNextPopRef.current = true;
            window.history.back();
          },
          {
            title: "Discard unsaved updates?",
            message: "You have unsaved updates on this page. Save changes or discard before leaving.",
            confirmText: "Discard and leave",
          }
        )
      );
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [hasAnyUnsavedChanges]);

  function executeTransition(transition) {
    executePendingTransition(transition);
  }

  function queuePendingTransition(transition, {
    title = "Discard unsaved section updates?",
    message = "You have unsaved section updates. Save section or discard before continuing.",
    confirmText = "Discard and continue",
  } = {}) {
    setPendingTransition((prev) => prev || createPendingTransition(transition, { title, message, confirmText }));
  }

  function attemptSectionTransition(transition) {
    if (!shouldPromptSectionTransition(hasUnsavedSectionChanges)) {
      executeTransition(transition);
      return;
    }
    queuePendingTransition(transition);
  }

  function closeSectionEditor() {
    setEditingBlockDraft(null);
    setEditingBlockId("");
    setSectionSaveState("idle");
  }

  function handleCancelSectionEditing() {
    if (!editingBlock) return;
    if (!hasUnsavedSectionChanges) {
      closeSectionEditor();
      return;
    }
    queuePendingTransition(() => {
      closeSectionEditor();
    });
  }

  function handleSelectSectionType(type) {
    const next = availableBlocks.find((block) => block.type === type);
    if (!next) return;

    setSelectedSectionType(next.type);
    setSelectedSectionVariant(next.defaultVariant || next.variants?.[0] || "default");
  }

  function handleAddSectionToPage() {
    if (!selectedSectionType) return;

    const template = buildBlockForVariant(selectedSectionType, selectedSectionVariant);
    if (!template) return;

    const next = {
      ...template,
      id: nextBlockId(),
    };

    setBlocks((prev) => [...prev, next]);
    setSelectedBlockId(next.id);
    setBuilderTab("page-sections");
    setSelectedSectionType("");
    setSelectedSectionVariant("");
    setPublishError("");
    setEditingBlockId(next.id);
    setEditingBlockDraft(next);
  }

  function handleBlockDraftChange(updatedBlock) {
    setEditingBlockDraft(updatedBlock);
    setPublishError("");
  }

  function handleBlockRemove(blockId) {
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
    setSelectedBlockId((prev) => (prev === blockId ? "" : prev));
    if (editingBlockId === blockId) {
      setEditingBlockId("");
      setEditingBlockDraft(null);
    }
    setPublishError("");
  }

  function openSectionEditor(blockId) {
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return;
    setEditingBlockId(blockId);
    setSelectedBlockId(blockId);
    setEditingBlockDraft(block);
    setBuilderTab("page-sections");
  }

  async function handleSaveSection() {
    if (!editingBlockDraft) return;
    setSectionSaveState("saving");
    setBlocks((prev) => prev.map((block) => (block.id === editingBlockDraft.id ? editingBlockDraft : block)));
    const saved = editingBlockDraft;
    setEditingBlockDraft(saved);
    setEditingBlockId(saved.id);
    setSelectedBlockId(saved.id);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setSectionSaveState("saved");
    setTimeout(() => setSectionSaveState("idle"), 1200);
  }

  function handleDiscardSection() {
    closeSectionEditor();
  }

  function handleMediaSelect(item) {
    if (!mediaTarget) return;

    if (mediaTarget.scope === "seo") {
      setSettings((prev) => ({
        ...prev,
        seo: { ...prev.seo, imageMediaId: item.id },
      }));
      setMediaTarget(null);
      return;
    }

    setBlocks((prev) => prev.map((block) => {
      if (block.id !== mediaTarget.blockId) return block;

      if (mediaTarget.multiple) {
        const raw = String(block.props?.[mediaTarget.fieldKey] || "");
        const ids = raw.split(",").map((value) => value.trim()).filter(Boolean);
        if (!ids.includes(item.id)) ids.push(item.id);
        return {
          ...block,
          props: {
            ...block.props,
            [mediaTarget.fieldKey]: ids.join(","),
          },
        };
      }

      return {
        ...block,
        props: {
          ...block.props,
          [mediaTarget.fieldKey]: item.id,
        },
      };
    }));

    setMediaTarget(null);
  }

  async function handleCreateFolder(name) {
    const result = await createMediaFolderAction?.({
      hubId: hub.id,
      name,
    });
    if (!result?.ok) {
      return { ok: false, message: result?.message || "Unable to create folder." };
    }

    if (result.folder) setFolders((prev) => [result.folder, ...prev.filter((item) => item.id !== result.folder.id)]);
    return { ok: true };
  }

  async function handleRenameFolder(folderId, name) {
    const result = await renameMediaFolderAction?.({
      hubId: hub.id,
      folderId,
      name,
    });
    if (!result?.ok) {
      return { ok: false, message: result?.message || "Unable to rename folder." };
    }

    if (result.folder) {
      setFolders((prev) => prev.map((item) => (item.id === result.folder.id ? result.folder : item)));
    }
    return { ok: true };
  }

  async function handleDeleteFolder(folderId) {
    const result = await deleteMediaFolderAction?.({
      hubId: hub.id,
      folderId,
    });
    if (!result?.ok) {
      return { ok: false, message: result?.message || "Unable to delete folder." };
    }

    setFolders((prev) => prev.filter((item) => item.id !== folderId));
    setMediaItems((prev) =>
      prev.map((item) => (item.folderId === folderId ? { ...item, folderId: "all-assets" } : item))
    );

    return { ok: true };
  }

  async function handleUpdateMedia(input) {
    const result = await updateMediaAssetAction?.({
      hubId: hub.id,
      mediaId: input.mediaId,
      alt: input.alt,
      folderId: input.folderId,
    });
    if (!result?.ok) {
      return { ok: false, message: result?.message || "Unable to update media." };
    }

    if (result.media) {
      setMediaItems((prev) => prev.map((item) => (item.id === result.media.id ? result.media : item)));
    }
    return { ok: true };
  }

  async function handleDeleteMedia(mediaId) {
    const result = await deleteMediaAssetAction?.({
      hubId: hub.id,
      mediaId,
    });
    if (!result?.ok) {
      return {
        ok: false,
        message: result?.message || "Unable to delete media.",
        usageRefs: Array.isArray(result?.usageRefs) ? result.usageRefs : [],
      };
    }

    setMediaItems((prev) => prev.filter((item) => item.id !== mediaId));
    return { ok: true };
  }

  async function handleUploadMedia(input) {
    const formData = new FormData();
    formData.set("hubId", hub.id);
    formData.set("folderId", input.folderId || "all-assets");

    for (const file of input.files || []) {
      formData.append("files", file);
    }

    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return { ok: false, message: result?.message || "Unable to upload files." };
    }

    if (Array.isArray(result.items) && result.items.length) {
      setMediaItems((prev) => [...result.items, ...prev]);
    }

    return { ok: true };
  }

  const tabs = [
    {
      value: "page-sections",
      label: "Page Sections",
      content: (
        <div className={styles.tabContent}>
          <div className={styles.column}>
            <h3>Page Sections</h3>
            <BlockList
              blocks={blocks}
              onMove={(next) =>
                attemptSectionTransition(() => {
                  setBlocks(next);
                })}
              onRemove={(blockId) =>
                attemptSectionTransition(() => {
                  handleBlockRemove(blockId);
                })}
              onSelect={setSelectedBlockId}
              onEdit={(blockId) =>
                attemptSectionTransition(() => {
                  openSectionEditor(blockId);
                })}
              getReadiness={evaluateBlockReadiness}
            />
          </div>
        </div>
      ),
    },
    {
      value: "section-library",
      label: "Section Library",
      content: (
        <div className={styles.tabContent}>
          {!selectedSectionDefinition ? (
            <div className={styles.column}>
              <h3>Section Library</h3>
              <BlockPicker availableBlocks={availableBlocks} onPick={handleSelectSectionType} />
            </div>
          ) : (
            <div className={styles.column}>
              <div className={styles.libraryHeader}>
                <h3>Section variants - {selectedSectionDefinition.label}</h3>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => {
                    setSelectedSectionType("");
                    setSelectedSectionVariant("");
                  }}
                >
                  Choose another section
                </Button>
              </div>

              <div className={styles.variantCards}>
                {selectedSectionDefinition.variants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    className={[
                      styles.variantCard,
                      selectedSectionVariant === variant ? styles.variantCardActive : "",
                    ].join(" ")}
                    onClick={() => setSelectedSectionVariant(variant)}
                  >
                    <strong>{variant}</strong>
                    <span>{selectedSectionDefinition.variantDescriptions?.[variant] || "Variant preview"}</span>
                  </button>
                ))}
              </div>

              <section className={styles.previewWrap}>
                <h4>Preview</h4>
                {PreviewSectionComponent && previewBlock ? (
                  <div className={styles.previewCanvas}>
                    <PreviewSectionComponent
                      variant={previewBlock.variant}
                      mediaById={PREVIEW_MEDIA_BY_ID}
                      events={PREVIEW_EVENTS}
                      {...(previewBlock.props || {})}
                    />
                  </div>
                ) : (
                  <p className={styles.previewEmpty}>Choose a section variant to preview it.</p>
                )}
              </section>

              <div className={styles.libraryActions}>
                <Button type="button" onClick={handleAddSectionToPage}>Add section to page</Button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.root}>
      <form
        id="save-page-form"
        action={saveDraftAction}
        className={styles.form}
        onSubmit={(event) => {
          if (!draftReadiness.readyForDraft) {
            event.preventDefault();
            const first = draftReadiness.blocking;
            setPublishError(
              first
                ? `Save blocked: ${first.label}: ${first.missingRequiredFields?.[0] || "Fields required."}`
                : "Save blocked: some sections still require required fields."
            );
            return;
          }
          if (!hasUnsavedSectionChanges || pendingTransition) return;
          event.preventDefault();
          queuePendingTransition(() => {
            const form = document.getElementById("save-page-form");
            form?.requestSubmit();
          });
        }}
      >
        <input type="hidden" name="hubId" value={hub.id} />
        <input type="hidden" name="pageId" value={initialPage.id} />
        <input type="hidden" name="expectedUpdatedAt" value={initialPage.updatedAt || ""} />
        <input type="hidden" name="settings" value={JSON.stringify(settings)} />
        <input type="hidden" name="draftComposition" value={JSON.stringify(blocks)} />

        <aside className={styles.leftColumn}>
          <h3>Page settings</h3>
          <PageSettingsForm
            value={settings}
            onChange={setSettings}
            onOpenMediaLibrary={setMediaTarget}
            pageOptions={parentPageOptions}
            columns={1}
          />
          <div className={styles.actions}>
            <Button type="submit">Save page draft</Button>
            <Button
              type="button"
              intent="brand"
              onClick={() => {
                if (hasUnsavedPageDraftChanges) {
                  setPublishError("Save page draft before publishing.");
                  return;
                }
                if (!publishReadiness.readyForPublish) {
                  const first = publishReadiness.blocking;
                  setPublishError(
                    first
                      ? `${first.label}: ${first.missingRequiredFields[0] || "Fields required."}`
                      : "Some sections still require required fields before publishing."
                  );
                  return;
                }
                setPublishError("");
                attemptSectionTransition(() => {
                  const form = document.getElementById("publish-page-form");
                  form?.requestSubmit();
                });
              }}
            >
              Publish page
            </Button>
          </div>
          {initialErrorCode === "STALE_DRAFT" ? (
            <div className={styles.conflictNotice}>
              <p className={styles.conflictMessage}>
                Another session updated this page. Reload latest draft before saving or publishing again.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  window.location.assign(`/platform/hubs/${hub.id}/cms/${initialPage.id}`);
                }}
              >
                Reload latest draft
              </Button>
            </div>
          ) : null}
          {publishError ? <p className={styles.publishError}>{publishError}</p> : null}
        </aside>

        <section className={styles.mainColumn}>
          <Tabs
            tabs={tabs}
            value={builderTab}
            onChange={(nextTab) =>
              attemptSectionTransition(() => {
                setBuilderTab(nextTab);
                if (nextTab !== "page-sections") {
                  setEditingBlockId("");
                  setEditingBlockDraft(null);
                }
              })}
          />
          {builderTab === "page-sections" && editingBlock ? (
            <section className={styles.column}>
              <h3>
                Section settings - {editingBlock.label || editingBlock.type}
                <small className={styles.variantLabel}>({editingBlock.variant || "default"})</small>
              </h3>
              {editingBlockReadiness?.readyForDraft ? (
                <Badge className={styles.sectionReadiness} tone="success" size="sm">Ready</Badge>
              ) : (
                <Badge className={styles.sectionReadiness} tone="danger" size="sm">
                  Fields required ({editingBlockReadiness?.missingCount || 0})
                </Badge>
              )}
              <BlockEditor
                block={editingBlockDraft || editingBlock}
                schema={blockSchema}
                onChange={handleBlockDraftChange}
                onOpenMediaLibrary={setMediaTarget}
              />
              <div className={styles.sectionActions}>
                <Button
                  type="button"
                  onClick={handleSaveSection}
                  loading={sectionSaveState === "saving"}
                  disabled={sectionSaveState === "saving" || !hasUnsavedSectionChanges}
                >
                  {sectionSaveState === "saving" ? "Saving section..." : "Save section"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDiscardSection}
                  disabled={sectionSaveState === "saving" || !hasUnsavedSectionChanges}
                >
                  Discard section updates
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  className={styles.cancelButton}
                  onClick={handleCancelSectionEditing}
                  disabled={sectionSaveState === "saving"}
                >
                  Cancel editing
                </Button>
                {sectionSaveState === "saved" ? (
                  <Badge className={styles.statusBadge} tone="success" size="sm">Section saved</Badge>
                ) : null}
              </div>
            </section>
          ) : null}
        </section>
      </form>
      <form id="publish-page-form" action={publishAction}>
        <input type="hidden" name="hubId" value={hub.id} />
        <input type="hidden" name="pageId" value={initialPage.id} />
        <input type="hidden" name="expectedUpdatedAt" value={initialPage.updatedAt || ""} />
      </form>

      <div className={styles.links}>
        <Button href={`/platform/hubs/${hub.id}/cms/${initialPage.id}/preview`} variant="secondary">Preview draft</Button>
        <Button href={`/${hub.slug}/pages/${settings.slug}`} variant="secondary">Open live page</Button>
      </div>

      {mediaTarget ? (
        <section className={styles.mediaLibraryWrap}>
          <h3>Media library</h3>
          <MediaLibrary
            media={mediaItems}
            folders={folders}
            onSelect={handleMediaSelect}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onUpdateMedia={handleUpdateMedia}
            onDeleteMedia={handleDeleteMedia}
            onUpload={handleUploadMedia}
          />
          <Button type="button" variant="tertiary" onClick={() => setMediaTarget(null)}>Close media library</Button>
        </section>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingTransition)}
        title={pendingTransition?.title || "Discard unsaved updates?"}
        message={pendingTransition?.message || "You have unsaved updates. Save before continuing."}
        confirmText={pendingTransition?.confirmText || "Discard and continue"}
        cancelText="Keep editing"
        variant="danger"
        onCancel={() => setPendingTransition(null)}
        onConfirm={() => {
          const transition = pendingTransition;
          setPendingTransition(null);
          closeSectionEditor();
          executeTransition(transition);
        }}
      />
    </div>
  );
}
