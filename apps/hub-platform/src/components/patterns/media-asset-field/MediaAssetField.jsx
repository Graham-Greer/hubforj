"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Button from "@/components/ui/button/Button";
import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import styles from "./MediaAssetField.module.css";

function formatSize(sizeBytes) {
  const value = Number(sizeBytes || 0);
  if (value <= 0) {
    return "";
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function inferAllowedTypes(accept) {
  const normalized = String(accept || "").toLowerCase();
  const allowed = new Set();

  if (!normalized || normalized.includes("*/*")) {
    allowed.add("image");
    allowed.add("video");
    return allowed;
  }

  if (normalized.includes("image/")) {
    allowed.add("image");
  }

  if (normalized.includes("video/")) {
    allowed.add("video");
  }

  return allowed;
}

export default function MediaAssetField({
  label,
  hint,
  hubId,
  hubSlug,
  libraryHref = "",
  assets = [],
  folders = [],
  assetId,
  assetAlt,
  assetFieldName,
  altFieldName,
  onAssetChange,
  onAltChange,
  controlled = false,
  requiredIndicator = false,
  accept = "image/*",
  uploadLabel = "Upload image",
  emptyTitle = "No image selected",
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const handledPickerKeyRef = useRef("");
  const [localAssets, setLocalAssets] = useState(assets);
  const [localFolders, setLocalFolders] = useState(folders);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [localAssetId, setLocalAssetId] = useState(assetId || "");
  const [localAssetAlt, setLocalAssetAlt] = useState(assetAlt || "");
  const [pickerOverride, setPickerOverride] = useState({ assetId: "", alt: "" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerFolderFilter, setPickerFolderFilter] = useState("all");
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSelectedAssetId, setPickerSelectedAssetId] = useState("");
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const isControlled = controlled && typeof onAssetChange === "function" && typeof onAltChange === "function";
  const allowedTypes = useMemo(() => inferAllowedTypes(accept), [accept]);

  useEffect(() => {
    setLocalAssets(assets);
  }, [assets]);

  useEffect(() => {
    setLocalFolders(folders);
  }, [folders]);

  const pickedField = searchParams.get("pickedField") || "";
  const pickedAltField = searchParams.get("pickedAltField") || "";
  const pickedAssetId = searchParams.get("pickedAssetId") || "";
  const pickedAssetAlt = searchParams.get("pickedAssetAlt") || "";
  const pickedAt = searchParams.get("pickedAt") || "";
  const isPickedForField = pickedField === assetFieldName && Boolean(pickedAssetId);
  const pickerSelectionKey = `${pickedField}:${pickedAltField}:${pickedAssetId}:${pickedAssetAlt}:${pickedAt}`;

  const selectedAssetId = isPickedForField
    ? pickedAssetId
    : (pickerOverride.assetId || (isControlled ? assetId : localAssetId));
  const selectedAssetAlt = isPickedForField && pickedAltField === altFieldName
    ? pickedAssetAlt
    : (pickerOverride.assetId ? pickerOverride.alt : (isControlled ? assetAlt : localAssetAlt));

  const availableAssets = useMemo(
    () =>
      localAssets.filter(
        (asset) => asset.status === "active" && (!allowedTypes.size || allowedTypes.has(asset.type))
      ),
    [allowedTypes, localAssets]
  );
  const selectedAsset = availableAssets.find((asset) => asset.id === selectedAssetId) || null;
  const canPickExistingMedia = Boolean(libraryHref);
  const pickerFolderOptions = useMemo(
    () => [
      { id: "all", label: "All", count: availableAssets.length },
      { id: "unfiled", label: "Unfiled", count: availableAssets.filter((asset) => !asset.folderId).length },
      ...localFolders.map((folder) => ({
        id: folder.id,
        label: folder.name,
        count: availableAssets.filter((asset) => asset.folderId === folder.id).length,
      })),
    ],
    [availableAssets, localFolders]
  );
  const pickerFilteredAssets = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();

    return availableAssets.filter((asset) => {
      if (pickerFolderFilter === "unfiled" && asset.folderId) {
        return false;
      }

      if (pickerFolderFilter !== "all" && pickerFolderFilter !== "unfiled" && asset.folderId !== pickerFolderFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const folderName = localFolders.find((folder) => folder.id === asset.folderId)?.name || "";
      return [
        asset.displayName,
        asset.filename,
        asset.alt,
        folderName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [availableAssets, localFolders, pickerFolderFilter, pickerSearch]);
  const pickerSelectedAsset = pickerFilteredAssets.find((asset) => asset.id === pickerSelectedAssetId) || null;

  useEffect(() => {
    if (!isPickedForField) {
      return;
    }

    if (handledPickerKeyRef.current === pickerSelectionKey) {
      return;
    }

    handledPickerKeyRef.current = pickerSelectionKey;
    setPickerOverride({
      assetId: pickedAssetId,
      alt: pickedAltField === altFieldName ? pickedAssetAlt : "",
    });

    if (isControlled) {
      onAssetChange(pickedAssetId);
      if (pickedAltField === altFieldName) {
        onAltChange(pickedAssetAlt);
      }
    } else {
      setLocalAssetId(pickedAssetId);
      if (pickedAltField === altFieldName) {
        setLocalAssetAlt(pickedAssetAlt);
      }
      if (typeof onAssetChange === "function") {
        onAssetChange(pickedAssetId);
      }
      if (pickedAltField === altFieldName && typeof onAltChange === "function") {
        onAltChange(pickedAssetAlt);
      }
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("pickedField");
    nextParams.delete("pickedAltField");
    nextParams.delete("pickedAssetId");
    nextParams.delete("pickedAssetAlt");
    nextParams.delete("pickedAt");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [
    altFieldName,
    isControlled,
    isPickedForField,
    onAltChange,
    onAssetChange,
    pathname,
    pickedAltField,
    pickedAssetAlt,
    pickedAssetId,
    pickerSelectionKey,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (!pickerOverride.assetId || !isControlled) {
      return;
    }

    if (assetId === pickerOverride.assetId && assetAlt === pickerOverride.alt) {
      setPickerOverride({ assetId: "", alt: "" });
    }
  }, [assetAlt, assetId, isControlled, pickerOverride]);

  function applyAssetChange(nextAssetId) {
    setPickerOverride((current) => (current.assetId ? { assetId: "", alt: "" } : current));

    if (isControlled) {
      onAssetChange(nextAssetId);
      return;
    }

    setLocalAssetId(nextAssetId);
    if (typeof onAssetChange === "function") {
      onAssetChange(nextAssetId);
    }
  }

  function applyAltChange(nextAlt) {
    setPickerOverride((current) => (current.assetId ? { ...current, alt: nextAlt } : current));

    if (isControlled) {
      onAltChange(nextAlt);
      return;
    }

    setLocalAssetAlt(nextAlt);
    if (typeof onAltChange === "function") {
      onAltChange(nextAlt);
    }
  }

  function openExistingMediaPicker() {
    setPickerSelectedAssetId(selectedAssetId || availableAssets[0]?.id || "");
    setPickerFolderFilter("all");
    setPickerSearch("");
    setShowPickerModal(true);
  }

  function applyPickedAsset() {
    if (!pickerSelectedAsset) {
      return;
    }

    applyAssetChange(pickerSelectedAsset.id);
    applyAltChange(pickerSelectedAsset.alt || "");
    setShowPickerModal(false);
  }

  async function handleUpload() {
    const file = selectedFiles[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("hubId", hubId);
    formData.set("folderId", uploadFolderId);
    formData.set("file", file);
    formData.set("alt", selectedAssetAlt || "");

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload image.");
      }

      const nextAsset = payload.asset;
      setLocalAssets((current) => [nextAsset, ...current.filter((asset) => asset.id !== nextAsset.id)]);
      applyAssetChange(nextAsset.id);
      applyAltChange(nextAsset.alt || selectedAssetAlt || "");
      setUploadFolderId(nextAsset.folderId || "");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowUploadModal(false);
    } catch (error) {
      setUploadError(String(error?.message || "Unable to upload image."));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className={styles.root} aria-label={label}>
      <input type="hidden" name={assetFieldName} value={selectedAssetId || ""} />
      <input type="hidden" name={altFieldName} value={selectedAssetAlt || ""} />

      <div className={styles.fieldGrid}>
        <div className={styles.assetColumn}>
          <div className={styles.header}>
            <div className={[fieldStyles.labelWrap, styles.labelWrap].join(" ")}>
              <span className={fieldStyles.label}>{label}</span>
              {requiredIndicator ? <span className={fieldStyles.requiredMark}>Required</span> : null}
            </div>
          </div>

          {uploadError ? <FormMessage tone="danger">{uploadError}</FormMessage> : null}

          {!selectedAsset ? (
            <div className={styles.selectorRow}>
              <button
                type="button"
                className={styles.selectField}
                onClick={() => setShowUploadModal(true)}
                disabled={isUploading}
              >
                <Icon name="imagesmode" size="md" decorative />
                <span className={styles.selectFieldText}>{emptyTitle || "Select media"}</span>
              </button>
              {canPickExistingMedia ? (
                <Button type="button" size="lg" variant="secondary" onClick={openExistingMediaPicker}>
                  Use existing media
                </Button>
              ) : null}
              {!canPickExistingMedia ? <span className={styles.choiceFallback}>{uploadLabel}</span> : null}
            </div>
          ) : (
            <div className={styles.assetSummary}>
              <div className={styles.previewFrame}>
                {selectedAsset.type === "video" ? (
                  <video
                    src={selectedAsset.publicUrl}
                    className={styles.previewVideo}
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={selectedAsset.publicUrl}
                    alt={selectedAssetAlt || selectedAsset.alt || selectedAsset.filename}
                    className={styles.previewImage}
                    fill
                    sizes="8rem"
                    unoptimized
                  />
                )}
              </div>
              <div className={styles.previewMeta}>
                <strong>{selectedAsset.filename}</strong>
                <span>{selectedAsset.type === "video" ? "Video asset" : "Image asset"}</span>
                <span>{formatSize(selectedAsset.sizeBytes)}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                iconOnly
                aria-label={`Remove ${label}`}
                title="Remove asset"
                onClick={() => {
                  applyAssetChange("");
                  applyAltChange("");
                }}
              >
                <Icon name="close" />
              </Button>
            </div>
          )}
          {!selectedAsset && hint ? <p className={fieldStyles.hint}>{hint}</p> : null}
        </div>

        <div className={styles.altColumn}>
          <Input
            label="Alt text"
            hint="Describe the media for screen readers and fallback contexts."
            value={selectedAssetAlt}
            onChange={(event) => applyAltChange(event.target.value)}
          />
        </div>
      </div>

      {showUploadModal ? (
        <Modal
          title="Upload from form"
          width="lg"
          onClose={() => setShowUploadModal(false)}
          actions={(
            <>
              <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Select files
              </Button>
              <Button type="button" onClick={handleUpload} disabled={isUploading || !selectedFiles.length}>
                {isUploading ? "Uploading" : "Upload"}
              </Button>
            </>
          )}
        >
          <div className={styles.modalBody}>
            <p className={styles.choiceModalCopy}>
              Upload here when you already have the file ready. Use the media library button if you want to reuse an existing asset instead.
            </p>
            <AdminSelect
              label="Destination folder"
              value={uploadFolderId}
              onChange={(event) => setUploadFolderId(event.target.value)}
              options={[
                { value: "", label: "Unfiled" },
                ...localFolders.map((folder) => ({ value: folder.id, label: folder.name })),
              ]}
              hint="Choose Unfiled to upload without a folder."
            />
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept={accept}
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            />
            <button type="button" className={styles.fileDropzone} onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" size="md" decorative />
              <span>Select files</span>
            </button>
            <div className={styles.selectedFiles}>
              {selectedFiles.length ? (
                selectedFiles.map((file) => (
                  <div key={`${file.name}-${file.size}`} className={styles.selectedFile}>
                    <strong>{file.name}</strong>
                    <span>{formatSize(file.size)}</span>
                  </div>
                ))
              ) : (
                <p className={styles.fileEmpty}>No assets selected yet.</p>
              )}
            </div>
          </div>
        </Modal>
      ) : null}

      {showPickerModal ? (
        <Modal
          title={`Choose ${label.toLowerCase()}`}
          width="xl"
          onClose={() => setShowPickerModal(false)}
          actions={(
            <>
              <Button type="button" variant="secondary" onClick={() => setShowPickerModal(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyPickedAsset} disabled={!pickerSelectedAsset}>
                Use media
              </Button>
            </>
          )}
        >
          <div className={styles.pickerBody}>
            <div className={styles.pickerSearchRow}>
              <Input
                label="Search media"
                value={pickerSearch}
                onChange={(event) => setPickerSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                placeholder="Search by filename, alt text, or folder"
              />
            </div>
            <div className={styles.pickerLayout}>
              <div className={styles.folderList} aria-label="Media folders">
                {pickerFolderOptions.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className={[
                      styles.folderButton,
                      pickerFolderFilter === folder.id ? styles.folderButtonActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setPickerFolderFilter(folder.id)}
                  >
                    <span>{folder.label}</span>
                    <span>{folder.count}</span>
                  </button>
                ))}
              </div>
              <div className={styles.assetPickerPanel}>
                {pickerFilteredAssets.length ? (
                  <div className={styles.assetPickerGrid}>
                    {pickerFilteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        className={[
                          styles.assetPickerCard,
                          pickerSelectedAssetId === asset.id ? styles.assetPickerCardActive : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => setPickerSelectedAssetId(asset.id)}
                      >
                        <span className={styles.assetPickerThumb}>
                          {asset.type === "video" ? (
                            <video
                              src={asset.publicUrl}
                              className={styles.previewVideo}
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <Image
                              src={asset.publicUrl}
                              alt={asset.alt || asset.filename}
                              className={styles.previewImage}
                              fill
                              sizes="10rem"
                              unoptimized
                            />
                          )}
                        </span>
                        <span className={styles.assetPickerMeta}>
                          <strong>{asset.displayName || asset.filename}</strong>
                          <span>{asset.type === "video" ? "Video" : "Image"} - {formatSize(asset.sizeBytes)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.assetPickerEmpty}>
                    <Icon name="imagesmode" size="lg" tone="muted" decorative />
                    <strong>No media found</strong>
                    <span>Try another folder or search term.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
