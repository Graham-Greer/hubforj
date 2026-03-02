"use client";

import { useMemo, useState } from "react";
import HeroSection from "@/components/sections/hero/HeroSection";
import RichTextSection from "@/components/sections/rich-text/RichTextSection";
import CTASection from "@/components/sections/cta/CTASection";
import FeatureGridSection from "@/components/sections/feature-grid/FeatureGridSection";
import FAQSection from "@/components/sections/faq/FAQSection";
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
import BlockEditor from "@/components/patterns/cms/block-editor/BlockEditor";
import MediaLibrary from "@/components/patterns/cms/media-library/MediaLibrary";
import Button from "@/components/ui/button/Button";
import Tabs from "@/components/ui/tabs/Tabs";
import {
  buildBlockForVariant,
  buildPreviewBlockForVariant,
  getBlockEditorSchema,
} from "@/lib/data/pages/block-registry";
import styles from "./CmsPageEditorClient.module.css";

const SECTION_COMPONENTS = {
  HeroSection,
  RichTextSection,
  CTASection,
  FeatureGridSection,
  FAQSection,
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
  availableBlocks,
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
    headerIdOverride: initialPage.headerIdOverride || "",
    footerIdOverride: initialPage.footerIdOverride || "",
  });
  const [blocks, setBlocks] = useState(initialPage.draftComposition || []);
  const [selectedBlockId, setSelectedBlockId] = useState(initialPage.draftComposition?.[0]?.id || "");
  const [builderTab, setBuilderTab] = useState("page-sections");
  const [selectedSectionType, setSelectedSectionType] = useState("");
  const [selectedSectionVariant, setSelectedSectionVariant] = useState("");
  const [mediaTarget, setMediaTarget] = useState(null);
  const [mediaItems, setMediaItems] = useState(media || []);
  const [folders, setFolders] = useState(mediaFolders || []);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  );

  const blockSchema = useMemo(
    () => (selectedBlock ? getBlockEditorSchema(selectedBlock.type) : []),
    [selectedBlock]
  );

  const selectedSectionDefinition = useMemo(
    () => availableBlocks.find((block) => block.type === selectedSectionType) || null,
    [availableBlocks, selectedSectionType]
  );

  const previewBlock = useMemo(() => {
    if (!selectedSectionType) return null;
    return buildPreviewBlockForVariant(selectedSectionType, selectedSectionVariant);
  }, [selectedSectionType, selectedSectionVariant]);

  const PreviewSectionComponent = previewBlock ? SECTION_COMPONENTS[previewBlock.type] : null;

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
  }

  function handleBlockChange(updatedBlock) {
    setBlocks((prev) => prev.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)));
  }

  function handleBlockRemove(blockId) {
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
    setSelectedBlockId((prev) => (prev === blockId ? "" : prev));
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
            <BlockList blocks={blocks} onMove={setBlocks} onRemove={handleBlockRemove} onSelect={setSelectedBlockId} />
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
      <form action={saveDraftAction} className={styles.form}>
        <input type="hidden" name="hubId" value={hub.id} />
        <input type="hidden" name="pageId" value={initialPage.id} />
        <input type="hidden" name="settings" value={JSON.stringify(settings)} />
        <input type="hidden" name="draftComposition" value={JSON.stringify(blocks)} />

        <aside className={styles.leftColumn}>
          <h3>Page settings</h3>
          <PageSettingsForm value={settings} onChange={setSettings} onOpenMediaLibrary={setMediaTarget} columns={1} />
          <div className={styles.actions}>
            <Button type="submit">Save draft</Button>
            <Button
              type="button"
              intent="brand"
              onClick={() => {
                const form = document.getElementById("publish-page-form");
                form?.requestSubmit();
              }}
            >
              Publish
            </Button>
          </div>
        </aside>

        <section className={styles.mainColumn}>
          <Tabs tabs={tabs} value={builderTab} onChange={setBuilderTab} />
          {builderTab === "page-sections" && selectedBlock ? (
            <section className={styles.column}>
              <h3>Section settings</h3>
              <BlockEditor
                block={selectedBlock}
                schema={blockSchema}
                onChange={handleBlockChange}
                onOpenMediaLibrary={setMediaTarget}
              />
            </section>
          ) : null}
        </section>
      </form>
      <form id="publish-page-form" action={publishAction}>
        <input type="hidden" name="hubId" value={hub.id} />
        <input type="hidden" name="pageId" value={initialPage.id} />
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
    </div>
  );
}
