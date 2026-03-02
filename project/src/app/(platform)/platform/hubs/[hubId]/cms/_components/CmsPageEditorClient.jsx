"use client";

import { useMemo, useState } from "react";
import PageSettingsForm from "@/components/patterns/cms/page-settings/PageSettingsForm";
import BlockPicker from "@/components/patterns/cms/block-picker/BlockPicker";
import BlockList from "@/components/patterns/cms/block-list/BlockList";
import BlockEditor from "@/components/patterns/cms/block-editor/BlockEditor";
import PublishBar from "@/components/patterns/cms/publish-bar/PublishBar";
import MediaLibrary from "@/components/patterns/cms/media-library/MediaLibrary";
import Button from "@/components/ui/button/Button";
import { buildDefaultBlock, getBlockEditorSchema } from "@/lib/data/pages/block-registry";
import styles from "./CmsPageEditorClient.module.css";

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

  function handlePickBlock(type) {
    const template = buildDefaultBlock(type);
    if (!template) return;

    const next = {
      ...template,
      id: nextBlockId(),
    };

    setBlocks((prev) => [...prev, next]);
    setSelectedBlockId(next.id);
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

  return (
    <div className={styles.root}>
      <form action={saveDraftAction} className={styles.form}>
        <input type="hidden" name="hubId" value={hub.id} />
        <input type="hidden" name="pageId" value={initialPage.id} />
        <input type="hidden" name="settings" value={JSON.stringify(settings)} />
        <input type="hidden" name="draftComposition" value={JSON.stringify(blocks)} />

        <PageSettingsForm value={settings} onChange={setSettings} onOpenMediaLibrary={setMediaTarget} />

        <section className={styles.builder}>
          <div className={styles.column}>
            <h3>Blocks</h3>
            <BlockPicker availableBlocks={availableBlocks} onPick={handlePickBlock} />
            <BlockList blocks={blocks} onMove={setBlocks} onRemove={handleBlockRemove} onSelect={setSelectedBlockId} />
          </div>
          <div className={styles.column}>
            <h3>Block settings</h3>
            <BlockEditor
              block={selectedBlock}
              schema={blockSchema}
              onChange={handleBlockChange}
              onOpenMediaLibrary={setMediaTarget}
            />
          </div>
        </section>

        <Button type="submit">Save draft</Button>
      </form>

      <section className={styles.publishWrap}>
        <PublishBar
          status={initialPage.status}
          onPublish={() => {
            const form = document.getElementById("publish-page-form");
            form?.requestSubmit();
          }}
        />
        <form id="publish-page-form" action={publishAction}>
          <input type="hidden" name="hubId" value={hub.id} />
          <input type="hidden" name="pageId" value={initialPage.id} />
        </form>
      </section>

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
