import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMediaFolderAction,
  deleteMediaAssetAction,
  deleteMediaFolderAction,
  updateMediaAssetAction,
  updateMediaFolderAction,
} from "@/lib/actions/media";
import { getMediaFilterType } from "@/lib/domain/media";
import { normalizeString } from "@/components/patterns/media-library-workspace/media-library-helpers";

export function useMediaLibraryWorkspace({
  hub,
  assets,
  folders,
  initialAssetCursor = "",
  initialHasMoreAssets = false,
  mode = "manage",
  embedded = false,
  initialSelectedAssetId = "",
  onSelectAsset = null,
  pickerContext = null,
}) {
  const router = useRouter();
  const [assetRows, setAssetRows] = useState(assets);
  const [folderRows, setFolderRows] = useState(folders);
  const [assetCursor, setAssetCursor] = useState(initialAssetCursor);
  const [hasMoreAssets, setHasMoreAssets] = useState(initialHasMoreAssets);
  const [isLoadingMoreAssets, setIsLoadingMoreAssets] = useState(false);
  const [usageLoadingAssetId, setUsageLoadingAssetId] = useState("");
  const [usageErrorAssetId, setUsageErrorAssetId] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [selectedAssetId, setSelectedAssetId] = useState(initialSelectedAssetId || assets[0]?.id || "");
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceSuccess, setWorkspaceSuccess] = useState("");
  const [folderModal, setFolderModal] = useState({ mode: "", folderId: "" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [confirmState, setConfirmState] = useState({ kind: "", id: "" });
  const [detailValues, setDetailValues] = useState({
    assetId: initialSelectedAssetId || assets[0]?.id || "",
    displayName: assets.find((asset) => asset.id === initialSelectedAssetId)?.displayName || assets[0]?.displayName || "",
    alt: assets.find((asset) => asset.id === initialSelectedAssetId)?.alt || assets[0]?.alt || "",
    folderId: assets.find((asset) => asset.id === initialSelectedAssetId)?.folderId || assets[0]?.folderId || "",
  });
  const [isPending, startTransition] = useTransition();
  const usageRequestedAssetIdsRef = useRef(new Set());

  const isPicker = mode === "pick" || Boolean(pickerContext?.returnTo);

  const folderCounts = useMemo(() => {
    const counts = new Map();

    assetRows.forEach((asset) => {
      if (asset.folderId) {
        counts.set(asset.folderId, (counts.get(asset.folderId) || 0) + 1);
      }
    });

    return counts;
  }, [assetRows]);

  const filteredAssets = useMemo(() => {
    const query = normalizeString(search).toLowerCase();

    return assetRows.filter((asset) => {
      if (filterType !== "all" && getMediaFilterType(asset.type) !== filterType) {
        return false;
      }

      if (folderFilter === "unfiled" && asset.folderId) {
        return false;
      }

      if (folderFilter !== "all" && folderFilter !== "unfiled" && asset.folderId !== folderFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        asset.displayName,
        asset.filename,
        asset.alt,
        folderRows.find((folder) => folder.id === asset.folderId)?.name || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [assetRows, filterType, folderFilter, folderRows, search]);

  const selectedAsset = assetRows.find((asset) => asset.id === selectedAssetId) || filteredAssets[0] || null;
  const selectedFolder = folderModal.folderId ? folderRows.find((folder) => folder.id === folderModal.folderId) || null : null;
  const confirmFolder = confirmState.kind === "folder" ? folderRows.find((folder) => folder.id === confirmState.id) || null : null;
  const confirmAsset = confirmState.kind === "asset" ? assetRows.find((asset) => asset.id === confirmState.id) || null : null;
  const unfiledCount = assetRows.filter((asset) => !asset.folderId).length;

  useEffect(() => {
    if (!selectedAsset) {
      return;
    }

    setDetailValues({
      assetId: selectedAsset.id,
      displayName: selectedAsset.displayName || "",
      alt: selectedAsset.alt || "",
      folderId: selectedAsset.folderId || "",
    });
  }, [selectedAsset]);

  useEffect(() => {
    if (!selectedAssetId && filteredAssets[0]?.id) {
      setSelectedAssetId(filteredAssets[0].id);
    }
  }, [filteredAssets, selectedAssetId]);

  const selectedAssetUsageLoaded = Boolean(selectedAsset?.usageLoaded);

  useEffect(() => {
    const assetId = selectedAssetId;

    if (!assetId || selectedAssetUsageLoaded || usageRequestedAssetIdsRef.current.has(assetId)) {
      return undefined;
    }

    const controller = new AbortController();
    usageRequestedAssetIdsRef.current.add(assetId);
    setUsageLoadingAssetId(assetId);
    setUsageErrorAssetId("");

    fetch(`/api/admin/hubs/${encodeURIComponent(hub.slug)}/media/assets/${encodeURIComponent(assetId)}/usage`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load media usage.");
        }

        setAssetRows((current) =>
          current.map((asset) =>
            asset.id === assetId
              ? {
                  ...asset,
                  usageRefs: Array.isArray(payload.usageRefs) ? payload.usageRefs : [],
                  usageCount: Number.parseInt(String(payload.usageCount || 0), 10) || 0,
                  usageLoaded: payload.usageVerificationComplete !== false,
                }
              : asset
          )
        );

        if (payload.usageVerificationComplete === false) {
          setUsageErrorAssetId(assetId);
        }
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          usageRequestedAssetIdsRef.current.delete(assetId);
          return;
        }

        setUsageErrorAssetId(assetId);
      })
      .finally(() => {
        setUsageLoadingAssetId((current) => (current === assetId ? "" : current));
      });

    return () => {
      controller.abort();
    };
  }, [hub.slug, selectedAssetId, selectedAssetUsageLoaded]);

  async function runAction(task, successMessage) {
    setWorkspaceError("");
    setWorkspaceSuccess("");

    startTransition(async () => {
      try {
        await task();
        setWorkspaceSuccess(successMessage);
        if (!embedded) {
          router.refresh();
        }
      } catch (error) {
        setWorkspaceError(String(error?.message || "Unable to complete that action."));
      }
    });
  }

  function handleFolderSubmit(name) {
    if (folderModal.mode === "edit" && selectedFolder) {
      void runAction(
        async () => {
          const folder = await updateMediaFolderAction({ hubSlug: hub.slug, folderId: selectedFolder.id, name });
          setFolderRows((current) => current.map((item) => (item.id === folder.id ? { ...item, ...folder } : item)));
        },
        "Folder updated."
      );
      setFolderModal({ mode: "", folderId: "" });
      return;
    }

    void runAction(
      async () => {
        const folder = await createMediaFolderAction({ hubSlug: hub.slug, name });
        setFolderRows((current) => [...current, folder].sort((left, right) => left.name.localeCompare(right.name)));
      },
      "Folder created."
    );
    setFolderModal({ mode: "", folderId: "" });
  }

  function handleUpload(folderId, files) {
    setWorkspaceError("");
    setWorkspaceSuccess("");

    startTransition(async () => {
      try {
        for (const file of files) {
          const formData = new FormData();
          formData.set("hubId", hub.id);
          formData.set("folderId", folderId);
          formData.set("file", file);

          const response = await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });

          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error || "Unable to upload asset.");
          }

          setAssetRows((current) => [
            { ...payload.asset, usageRefs: [], usageCount: 0, usageLoaded: true },
            ...current.filter((asset) => asset.id !== payload.asset.id),
          ]);
        }

        setWorkspaceSuccess(files.length === 1 ? "Asset uploaded." : "Assets uploaded.");
        setShowUploadModal(false);
        if (!embedded) {
          router.refresh();
        }
      } catch (error) {
        setWorkspaceError(String(error?.message || "Unable to upload asset."));
      }
    });
  }

  async function handleLoadMoreAssets() {
    if (!hasMoreAssets || isLoadingMoreAssets) {
      return;
    }

    setWorkspaceError("");
    setIsLoadingMoreAssets(true);

    try {
      const query = new URLSearchParams();

      if (assetCursor) {
        query.set("cursor", assetCursor);
      }

      const response = await fetch(`/api/admin/hubs/${encodeURIComponent(hub.slug)}/media/assets?${query.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load more assets.");
      }

      const nextAssets = Array.isArray(payload.assets) ? payload.assets : [];
      setAssetRows((current) => {
        const seen = new Set(current.map((asset) => asset.id));
        return [...current, ...nextAssets.filter((asset) => !seen.has(asset.id))];
      });
      setAssetCursor(payload.nextCursor || "");
      setHasMoreAssets(Boolean(payload.hasMore));
    } catch (error) {
      setWorkspaceError(String(error?.message || "Unable to load more assets."));
    } finally {
      setIsLoadingMoreAssets(false);
    }
  }

  function buildPickerReturnHref() {
    if (!selectedAsset || !pickerContext?.returnTo || !pickerContext?.field) {
      return "";
    }

    const [path, query = ""] = pickerContext.returnTo.split("?");
    const params = new URLSearchParams(query);

    params.set("pickedField", pickerContext.field);
    params.set("pickedAssetId", selectedAsset.id);
    params.set("pickedAt", String(Date.now()));

    if (pickerContext.altField) {
      params.set("pickedAltField", pickerContext.altField);
      params.set("pickedAssetAlt", detailValues.alt || selectedAsset.alt || "");
    }

    const nextQuery = params.toString();
    return nextQuery ? `${path}?${nextQuery}` : path;
  }

  function handleUseSelectedAsset() {
    if (!selectedAsset) {
      return;
    }

    const resolvedAlt = detailValues.alt || selectedAsset.alt || "";

    if (typeof onSelectAsset === "function") {
      onSelectAsset(selectedAsset, resolvedAlt);
      return;
    }

    const nextHref = buildPickerReturnHref();
    if (nextHref) {
      router.push(nextHref);
    }
  }

  function handleSaveDetails() {
    if (!selectedAsset) {
      return;
    }

    void runAction(
      async () => {
        const asset = await updateMediaAssetAction({
          hubSlug: hub.slug,
          assetId: selectedAsset.id,
          displayName: detailValues.displayName,
          alt: detailValues.alt,
          folderId: detailValues.folderId,
        });
        setAssetRows((current) => current.map((item) => (item.id === asset.id ? { ...item, ...asset } : item)));
      },
      "Asset details updated."
    );
  }

  function handleConfirmFolderDelete() {
    if (!confirmFolder) {
      return;
    }

    void runAction(
      async () => {
        await deleteMediaFolderAction({ hubSlug: hub.slug, folderId: confirmFolder.id });
        setFolderRows((current) => current.filter((item) => item.id !== confirmFolder.id));
        setAssetRows((current) => current.map((asset) => (asset.folderId === confirmFolder.id ? { ...asset, folderId: "" } : asset)));
        if (folderFilter === confirmFolder.id) {
          setFolderFilter("all");
        }
        setConfirmState({ kind: "", id: "" });
      },
      "Folder deleted. Assets were moved to Unfiled."
    );
  }

  function handleConfirmAssetDelete() {
    if (!confirmAsset) {
      return;
    }

    void runAction(
      async () => {
        await deleteMediaAssetAction({ hubSlug: hub.slug, assetId: confirmAsset.id });
        setAssetRows((current) => current.filter((item) => item.id !== confirmAsset.id));
        setSelectedAssetId((current) => (current === confirmAsset.id ? "" : current));
        setConfirmState({ kind: "", id: "" });
      },
      "Asset deleted."
    );
  }

  return {
    assetRows,
    folderRows,
    search,
    filterType,
    folderFilter,
    selectedAssetId,
    workspaceError,
    workspaceSuccess,
    folderModal,
    showUploadModal,
    confirmState,
    detailValues,
    isPending,
    isPicker,
    hasMoreAssets,
    isLoadingMoreAssets,
    usageLoadingAssetId,
    usageErrorAssetId,
    folderCounts,
    filteredAssets,
    selectedAsset,
    selectedFolder,
    confirmFolder,
    confirmAsset,
    unfiledCount,
    setSearch,
    setFilterType,
    setFolderFilter,
    setSelectedAssetId,
    setFolderModal,
    setShowUploadModal,
    setConfirmState,
    setDetailValues,
    handleFolderSubmit,
    handleUpload,
    handleLoadMoreAssets,
    handleUseSelectedAsset,
    handleSaveDetails,
    handleConfirmFolderDelete,
    handleConfirmAssetDelete,
  };
}
