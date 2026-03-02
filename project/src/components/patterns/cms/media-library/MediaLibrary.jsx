"use client";

import { useMemo, useState } from "react";
import Tabs from "../../../ui/tabs/Tabs";
import FileUpload from "../../../ui/file-upload/FileUpload";
import Input from "../../../ui/form/input/Input";
import Select from "../../../ui/form/select/Select";
import Button from "../../../ui/button/Button";
import ConfirmModal from "../../../ui/confirm-modal/ConfirmModal";
import styles from "./MediaLibrary.module.css";

const DEFAULT_FOLDER_ID = "all-assets";

function toFileSize(value) {
  const size = Number(value || 0);
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toDateLabel(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function queueRow(file) {
  return {
    id: `${file.name}-${Math.random().toString(36).slice(2, 8)}`,
    filename: file.name,
    sizeBytes: Number(file.size || 0),
    contentType: String(file.type || ""),
    status: "queued",
    error: "",
  };
}

export default function MediaLibrary({
  media = [],
  folders = [],
  onSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onUpdateMedia,
  onDeleteMedia,
  onUpload,
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [activeFolderId, setActiveFolderId] = useState(DEFAULT_FOLDER_ID);
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [detailDrafts, setDetailDrafts] = useState({});

  const [createFolderName, setCreateFolderName] = useState("");
  const [renameFolderId, setRenameFolderId] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");

  const [queue, setQueue] = useState([]);
  const [message, setMessage] = useState("");
  const [usageErrorRefs, setUsageErrorRefs] = useState([]);

  const [pendingDeleteFolderId, setPendingDeleteFolderId] = useState("");
  const [pendingDeleteMediaId, setPendingDeleteMediaId] = useState("");

  const folderOptions = useMemo(() => [
    { value: DEFAULT_FOLDER_ID, label: "All assets" },
    ...folders
      .filter((folder) => folder.id !== DEFAULT_FOLDER_ID)
      .map((folder) => ({ value: folder.id, label: folder.name })),
  ], [folders]);

  const folderById = useMemo(
    () => new Map(folderOptions.map((folder) => [folder.value, folder.label])),
    [folderOptions]
  );

  const filtered = useMemo(() => {
    const rows = media.filter((item) => item.status !== "deleted");

    return rows.filter((item) => {
      const folderName = folderById.get(item.folderId || DEFAULT_FOLDER_ID) || "";
      const search = `${item.filename || ""} ${item.alt || ""} ${folderName}`.toLowerCase();
      const matchesQuery = query ? search.includes(query.toLowerCase()) : true;
      const matchesFolder = activeFolderId === DEFAULT_FOLDER_ID ? true : item.folderId === activeFolderId;

      let matchesTab = true;
      if (["image", "video", "pdf"].includes(tab)) {
        matchesTab = item.type === tab;
      }
      if (tab === "missing-alt") {
        matchesTab = !String(item.alt || "").trim();
      }

      return matchesQuery && matchesFolder && matchesTab;
    }).sort((a, b) => {
      if (tab !== "recent") return 0;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }, [media, folderById, query, activeFolderId, tab]);

  const resolvedSelectedMediaId = useMemo(() => {
    if (selectedMediaId && filtered.some((item) => item.id === selectedMediaId)) {
      return selectedMediaId;
    }
    return filtered[0]?.id || "";
  }, [selectedMediaId, filtered]);

  const selectedMedia = useMemo(
    () => media.find((item) => item.id === resolvedSelectedMediaId) || null,
    [media, resolvedSelectedMediaId]
  );

  const selectedMediaDraft = useMemo(
    () => detailDrafts[resolvedSelectedMediaId] || null,
    [detailDrafts, resolvedSelectedMediaId]
  );

  const detailsAlt = selectedMediaDraft?.alt ?? (selectedMedia?.alt || "");
  const detailsFolderId = selectedMediaDraft?.folderId ?? (selectedMedia?.folderId || DEFAULT_FOLDER_ID);

  const folderCounts = useMemo(() => {
    const counts = new Map();
    counts.set(DEFAULT_FOLDER_ID, media.filter((item) => item.status !== "deleted").length);

    for (const item of media) {
      if (item.status === "deleted") continue;
      const key = item.folderId || DEFAULT_FOLDER_ID;
      counts.set(key, Number(counts.get(key) || 0) + 1);
    }

    return counts;
  }, [media]);

  async function handleCreateFolder() {
    setMessage("");
    const result = await onCreateFolder?.(createFolderName);
    if (!result?.ok) {
      setMessage(result?.message || "Unable to create folder.");
      return;
    }

    setCreateFolderName("");
  }

  async function handleRenameFolder() {
    setMessage("");
    const result = await onRenameFolder?.(renameFolderId, renameFolderName);
    if (!result?.ok) {
      setMessage(result?.message || "Unable to rename folder.");
      return;
    }

    setRenameFolderId("");
    setRenameFolderName("");
  }

  async function handleDeleteFolder() {
    if (!pendingDeleteFolderId) return;
    setMessage("");
    const result = await onDeleteFolder?.(pendingDeleteFolderId);
    if (!result?.ok) {
      setPendingDeleteFolderId("");
      setMessage(result?.message || "Unable to delete folder.");
      return;
    }

    if (activeFolderId === pendingDeleteFolderId) {
      setActiveFolderId(DEFAULT_FOLDER_ID);
    }
    setPendingDeleteFolderId("");
  }

  async function handleSaveMediaDetails() {
    if (!selectedMedia || !resolvedSelectedMediaId) return;
    setMessage("");

    const result = await onUpdateMedia?.({
      mediaId: selectedMedia.id,
      alt: detailsAlt,
      folderId: detailsFolderId,
    });

    if (!result?.ok) {
      setMessage(result?.message || "Unable to save media details.");
      return;
    }

    setUsageErrorRefs([]);
    setDetailDrafts((prev) => {
      const next = { ...prev };
      delete next[resolvedSelectedMediaId];
      return next;
    });
  }

  async function handleDeleteMedia() {
    if (!pendingDeleteMediaId) return;
    setMessage("");
    setUsageErrorRefs([]);

    const result = await onDeleteMedia?.(pendingDeleteMediaId);
    if (!result?.ok) {
      setPendingDeleteMediaId("");
      setMessage(result?.message || "Unable to delete media.");
      if (Array.isArray(result?.usageRefs)) {
        setUsageErrorRefs(result.usageRefs);
      }
      return;
    }

    setPendingDeleteMediaId("");
    if (pendingDeleteMediaId === resolvedSelectedMediaId) {
      setSelectedMediaId("");
    }
    setDetailDrafts((prev) => {
      const next = { ...prev };
      delete next[pendingDeleteMediaId];
      return next;
    });
    setUsageErrorRefs([]);
  }

  async function handleUpload(files) {
    if (!files?.length) return;

    const rows = files.map(queueRow);
    setQueue((prev) => [...rows, ...prev]);
    setQueue((prev) => prev.map((item) => (rows.some((row) => row.id === item.id) ? { ...item, status: "uploading" } : item)));

    if (!onUpload) {
      setQueue((prev) => prev.map((item) => (
        rows.some((row) => row.id === item.id) ? { ...item, status: "uploaded", error: "" } : item
      )));
      return;
    }

    const result = await onUpload({
      folderId: activeFolderId,
      files: files.map((file) => ({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      })),
    });

    if (!result?.ok) {
      setQueue((prev) => prev.map((item) => (
        rows.some((row) => row.id === item.id)
          ? { ...item, status: "failed", error: result?.message || "Upload failed." }
          : item
      )));
      setMessage(result?.message || "Upload failed.");
      return;
    }

    setQueue((prev) => prev.map((item) => (
      rows.some((row) => row.id === item.id)
        ? { ...item, status: "uploaded", error: "" }
        : item
    )));
  }

  function removeQueueItem(id) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  function setSelectedMediaDetailDraft(patch) {
    if (!selectedMedia || !resolvedSelectedMediaId) return;

    setDetailDrafts((prev) => {
      const existing = prev[resolvedSelectedMediaId] || {
        alt: selectedMedia.alt || "",
        folderId: selectedMedia.folderId || DEFAULT_FOLDER_ID,
      };

      return {
        ...prev,
        [resolvedSelectedMediaId]: {
          ...existing,
          ...patch,
        },
      };
    });
  }

  function handleSelectMediaCard(mediaId) {
    setSelectedMediaId(mediaId);
    setUsageErrorRefs([]);
  }

  return (
    <section className={styles.root}>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { label: "All", value: "all" },
          { label: "Images", value: "image" },
          { label: "Videos", value: "video" },
          { label: "PDFs", value: "pdf" },
          { label: "Missing alt", value: "missing-alt" },
          { label: "Recently added", value: "recent" },
        ]}
      />

      {message ? <p className={styles.message}>{message}</p> : null}

      <div className={styles.toolbar}>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media" />
        <Select value={activeFolderId} options={folderOptions} onChange={setActiveFolderId} placeholder="Filter by folder" />
      </div>

      <div className={styles.layout}>
        <aside className={styles.folders}>
          <h4>Folders</h4>
          <div className={styles.folderCreate}>
            <Input value={createFolderName} onChange={(event) => setCreateFolderName(event.target.value)} placeholder="New folder name" />
            <Button type="button" size="sm" onClick={handleCreateFolder}>Create</Button>
          </div>

          <ul className={styles.folderList}>
            {folderOptions.map((folder) => (
              <li key={folder.value} className={styles.folderRow}>
                {renameFolderId === folder.value ? (
                  <div className={styles.folderRename}>
                    <Input value={renameFolderName} onChange={(event) => setRenameFolderName(event.target.value)} />
                    <Button type="button" size="sm" onClick={handleRenameFolder}>Save</Button>
                    <Button type="button" size="sm" variant="tertiary" onClick={() => setRenameFolderId("")}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <button type="button" className={styles.folderButton} onClick={() => setActiveFolderId(folder.value)}>
                      <span>{folder.label}</span>
                      <span>{folderCounts.get(folder.value) || 0}</span>
                    </button>
                    {folder.value !== DEFAULT_FOLDER_ID ? (
                      <div className={styles.folderActions}>
                        <Button
                          type="button"
                          size="sm"
                          variant="tertiary"
                          onClick={() => {
                            setRenameFolderId(folder.value);
                            setRenameFolderName(folder.label);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="tertiary"
                          intent="danger"
                          onClick={() => setPendingDeleteFolderId(folder.value)}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <div className={styles.gridWrap}>
          <div className={styles.grid}>
            {filtered.map((item) => (
              <article key={item.id} className={styles.card}>
                <button type="button" className={styles.cardSelect} onClick={() => handleSelectMediaCard(item.id)}>
                  <strong>{item.filename}</strong>
                  <span>{item.type}</span>
                  <span>{toFileSize(item.sizeBytes)}</span>
                </button>
                <div className={styles.cardActions}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onSelect?.(item)}>Use media</Button>
                  <Button type="button" variant="tertiary" size="sm" intent="danger" onClick={() => setPendingDeleteMediaId(item.id)}>
                    Delete
                  </Button>
                </div>
              </article>
            ))}
            {!filtered.length ? <p className={styles.empty}>No assets match your filters.</p> : null}
          </div>

          <div className={styles.uploadSection}>
            <h4>Upload queue</h4>
            <FileUpload onUpload={handleUpload} />
            <ul className={styles.queueList}>
              {queue.map((item) => (
                <li key={item.id} className={styles.queueItem}>
                  <div>
                    <strong>{item.filename}</strong>
                    <span>{toFileSize(item.sizeBytes)}</span>
                  </div>
                  <div className={styles.queueMeta}>
                    <span>{item.status}</span>
                    {item.error ? <span>{item.error}</span> : null}
                    <Button type="button" size="sm" variant="tertiary" onClick={() => removeQueueItem(item.id)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
              {!queue.length ? <li className={styles.empty}>No files queued.</li> : null}
            </ul>
          </div>
        </div>

        <aside className={styles.details}>
          <h4>Asset details</h4>
          {selectedMedia ? (
            <div className={styles.detailsBody}>
              <p><strong>{selectedMedia.filename}</strong></p>
              <p>Type: {selectedMedia.type}</p>
              <p>Size: {toFileSize(selectedMedia.sizeBytes)}</p>
              <p>Date added: {toDateLabel(selectedMedia.createdAt)}</p>
              <p>Usage count: {selectedMedia.usageCount}</p>

              <Input
                value={detailsAlt}
                onChange={(event) => setSelectedMediaDetailDraft({ alt: event.target.value })}
                placeholder="Alt text"
              />
              <Select
                value={detailsFolderId}
                options={folderOptions}
                onChange={(value) => setSelectedMediaDetailDraft({ folderId: value })}
              />
              <Button type="button" variant="secondary" onClick={handleSaveMediaDetails}>Save details</Button>

              <div className={styles.usageList}>
                <strong>Usage references</strong>
                <ul>
                  {(selectedMedia.usageRefs || []).map((ref, index) => (
                    <li key={`${ref.label}-${index}`}>{ref.label || ref.kind || "Reference"}</li>
                  ))}
                  {!(selectedMedia.usageRefs || []).length ? <li>Not in use</li> : null}
                </ul>
              </div>

              {usageErrorRefs.length ? (
                <div className={styles.usageError}>
                  <strong>Cannot delete while in use:</strong>
                  <ul>
                    {usageErrorRefs.map((ref, index) => (
                      <li key={`${ref.label}-${index}`}>{ref.label || ref.kind || "Reference"}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className={styles.empty}>Select an asset to view details.</p>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={Boolean(pendingDeleteFolderId)}
        title="Delete folder"
        message="Assets in this folder will be moved to All assets. Continue?"
        confirmText="Delete folder"
        variant="danger"
        onConfirm={handleDeleteFolder}
        onCancel={() => setPendingDeleteFolderId("")}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteMediaId)}
        title="Delete media"
        message="This will delete the media asset if it has no usage references. Continue?"
        confirmText="Delete media"
        variant="danger"
        onConfirm={handleDeleteMedia}
        onCancel={() => setPendingDeleteMediaId("")}
      />
    </section>
  );
}
