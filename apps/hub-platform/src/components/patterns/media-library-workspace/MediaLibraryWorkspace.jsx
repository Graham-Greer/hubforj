"use client";

import Surface from "@/components/primitives/surface/Surface";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import SearchField from "@/components/ui/search-field/SearchField";
import { useMediaLibraryWorkspace } from "@/hooks/use-media-library-workspace";
import { filterTabs } from "./media-library-helpers";
import MediaAssetDetailsPanel from "./MediaAssetDetailsPanel";
import MediaAssetGrid from "./MediaAssetGrid";
import MediaLibraryDialogs from "./MediaLibraryDialogs";
import MediaLibraryHeader from "./MediaLibraryHeader";
import styles from "./MediaLibraryWorkspace.module.css";

export default function MediaLibraryWorkspace(props) {
  const workspace = useMediaLibraryWorkspace(props);

  return (
    <div className={styles.root} data-onboarding="media-workspace">
      <MediaLibraryHeader
        isPicker={workspace.isPicker}
        embedded={props.embedded}
        pickerContext={props.pickerContext}
        onCreateFolder={() => workspace.setFolderModal({ mode: "create", folderId: "" })}
        onUploadAssets={() => workspace.setShowUploadModal(true)}
      />

      {workspace.workspaceError ? <FormMessage tone="danger">{workspace.workspaceError}</FormMessage> : null}
      {workspace.workspaceSuccess ? <FormMessage tone="success">{workspace.workspaceSuccess}</FormMessage> : null}

      <Surface className={styles.workspace} padding="lg">
        <div className={styles.searchRow}>
          <SearchField
            label="Search"
            name="media-search"
            value={workspace.search}
            onChange={(event) => workspace.setSearch(event.target.value)}
            placeholder="Search by filename, alt text, or folder"
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterTabs}>
            {filterTabs.map((tab) => (
              <Button
                key={tab.value}
                type="button"
                size="sm"
                variant="flat"
                aria-pressed={workspace.filterType === tab.value}
                className={[styles.tab, workspace.filterType === tab.value ? styles.tabActive : ""].filter(Boolean).join(" ")}
                onClick={() => workspace.setFilterType(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          {workspace.isPicker && props.pickerContext?.returnTo ? (
            <div className={styles.pickerActions}>
              <Button variant="ghost" href={props.pickerContext.returnTo}>
                Cancel and return
              </Button>
              <Button onClick={workspace.handleUseSelectedAsset} disabled={!workspace.selectedAsset}>
                Use media
              </Button>
            </div>
          ) : null}
        </div>

        <div className={styles.folderRow}>
          <Surface
            as="button"
            type="button"
            tone="muted"
            padding="md"
            className={[styles.folderCard, workspace.folderFilter === "all" ? styles.folderCardActive : ""].filter(Boolean).join(" ")}
            onClick={() => workspace.setFolderFilter("all")}
          >
            <strong>All assets</strong>
            <span>{workspace.assetRows.length} loaded</span>
          </Surface>
          <Surface
            as="button"
            type="button"
            tone="muted"
            padding="md"
            className={[styles.folderCard, workspace.folderFilter === "unfiled" ? styles.folderCardActive : ""].filter(Boolean).join(" ")}
            onClick={() => workspace.setFolderFilter("unfiled")}
          >
            <strong>Unfiled</strong>
            <span>{workspace.unfiledCount} loaded</span>
          </Surface>
          {workspace.folderRows.map((folder) => (
            <div key={folder.id} className={styles.folderWrap}>
              <Surface
                as="button"
                type="button"
                tone="muted"
                padding="md"
                className={[styles.folderCard, workspace.folderFilter === folder.id ? styles.folderCardActive : ""].filter(Boolean).join(" ")}
                onClick={() => workspace.setFolderFilter(folder.id)}
              >
                <strong>{folder.name}</strong>
                <span>{workspace.folderCounts.get(folder.id) || 0} loaded</span>
              </Surface>
              <div className={styles.folderActions}>
                <button
                  type="button"
                  className={styles.iconAction}
                  aria-label={`Rename ${folder.name}`}
                  onClick={() => workspace.setFolderModal({ mode: "edit", folderId: folder.id })}
                >
                  <Icon name="edit" size="sm" decorative />
                </button>
                <button
                  type="button"
                  className={styles.iconAction}
                  aria-label={`Delete ${folder.name}`}
                  onClick={() => workspace.setConfirmState({ kind: "folder", id: folder.id })}
                >
                  <Icon name="delete" size="sm" tone="danger" decorative />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.assetColumn}>
            <MediaAssetGrid
              filteredAssets={workspace.filteredAssets}
              selectedAssetId={workspace.selectedAsset?.id || ""}
              onSelectAsset={workspace.setSelectedAssetId}
            />
            {workspace.hasMoreAssets ? (
              <div className={styles.loadMoreRow}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={workspace.handleLoadMoreAssets}
                  disabled={workspace.isLoadingMoreAssets}
                >
                  {workspace.isLoadingMoreAssets ? "Loading assets" : "Load more assets"}
                </Button>
              </div>
            ) : null}
          </div>
          <MediaAssetDetailsPanel
            hub={props.hub}
            isPicker={workspace.isPicker}
            selectedAsset={workspace.selectedAsset}
            usageLoading={workspace.usageLoadingAssetId === workspace.selectedAsset?.id}
            usageError={workspace.usageErrorAssetId === workspace.selectedAsset?.id}
            folderRows={workspace.folderRows}
            detailValues={workspace.detailValues}
            setDetailValues={workspace.setDetailValues}
            onSaveDetails={workspace.handleSaveDetails}
            onUseSelectedAsset={workspace.handleUseSelectedAsset}
            onRequestDelete={() => workspace.selectedAsset && workspace.setConfirmState({ kind: "asset", id: workspace.selectedAsset.id })}
          />
        </div>
      </Surface>

      <MediaLibraryDialogs
        folderModal={workspace.folderModal}
        selectedFolder={workspace.selectedFolder}
        showUploadModal={workspace.showUploadModal}
        folderRows={workspace.folderRows}
        confirmFolder={workspace.confirmFolder}
        confirmAsset={workspace.confirmAsset}
        workspaceError={workspace.workspaceError}
        isPending={workspace.isPending}
        onCloseFolderModal={() => workspace.setFolderModal({ mode: "", folderId: "" })}
        onSubmitFolder={workspace.handleFolderSubmit}
        onCloseUploadModal={() => workspace.setShowUploadModal(false)}
        onUpload={workspace.handleUpload}
        onCloseConfirm={() => workspace.setConfirmState({ kind: "", id: "" })}
        onConfirmFolderDelete={workspace.handleConfirmFolderDelete}
        onConfirmAssetDelete={workspace.handleConfirmAssetDelete}
      />
    </div>
  );
}
