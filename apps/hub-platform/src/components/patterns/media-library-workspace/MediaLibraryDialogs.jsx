"use client";

import { useEffect, useRef, useState } from "react";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import Surface from "@/components/primitives/surface/Surface";
import { formatMediaFileSize } from "@/lib/domain/media";
import styles from "./MediaLibraryWorkspace.module.css";

function FolderModal({ title, submitLabel, initialName = "", onClose, onSubmit, error, isPending }) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSubmit(name)} disabled={isPending}>
            {isPending ? "Saving folder" : submitLabel}
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        <Input
          label="Folder name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          hint="Use a clear name up to 50 characters."
        />
      </div>
    </Modal>
  );
}

function UploadModal({ folders, onClose, onUpload, error, isPending }) {
  const fileInputRef = useRef(null);
  const [folderId, setFolderId] = useState("");
  const [files, setFiles] = useState([]);

  return (
    <Modal
      title="Add new assets"
      onClose={onClose}
      width="lg"
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Select files
          </Button>
          <Button type="button" onClick={() => onUpload(folderId, files)} disabled={isPending || !files.length}>
            {isPending ? "Uploading assets" : "Upload"}
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        <AdminSelect
          label="Destination folder"
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          options={[
            { value: "", label: "Unfiled" },
            ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
          ]}
          hint="Choose Unfiled to upload without a folder."
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className={styles.hiddenInput}
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
        />
        <button type="button" className={styles.fileDropzone} onClick={() => fileInputRef.current?.click()}>
          <Icon name="upload" size="md" decorative />
          <span>Select files</span>
        </button>
        <div className={styles.selectedFiles}>
          {files.length ? (
            files.map((file) => (
              <Surface key={`${file.name}-${file.size}`} as="div" tone="muted" padding="none" className={styles.selectedFile}>
                <strong>{file.name}</strong>
                <span>{formatMediaFileSize(file.size)}</span>
              </Surface>
            ))
          ) : (
            <p className={styles.fileEmpty}>No assets selected yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ title, description, confirmLabel, onClose, onConfirm, isPending }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Working" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p className={styles.confirmText}>{description}</p>
      </div>
    </Modal>
  );
}

export default function MediaLibraryDialogs({
  folderModal,
  selectedFolder,
  showUploadModal,
  folderRows,
  confirmFolder,
  confirmAsset,
  workspaceError,
  isPending,
  onCloseFolderModal,
  onSubmitFolder,
  onCloseUploadModal,
  onUpload,
  onCloseConfirm,
  onConfirmFolderDelete,
  onConfirmAssetDelete,
}) {
  return (
    <>
      {folderModal.mode ? (
        <FolderModal
          title={folderModal.mode === "edit" ? "Rename folder" : "Add new folder"}
          submitLabel={folderModal.mode === "edit" ? "Save folder" : "Create folder"}
          initialName={selectedFolder?.name || ""}
          onClose={onCloseFolderModal}
          onSubmit={onSubmitFolder}
          error={workspaceError}
          isPending={isPending}
        />
      ) : null}

      {showUploadModal ? (
        <UploadModal
          folders={folderRows}
          onClose={onCloseUploadModal}
          onUpload={onUpload}
          error={workspaceError}
          isPending={isPending}
        />
      ) : null}

      {confirmFolder ? (
        <ConfirmModal
          title="Delete folder"
          description={`Delete ${confirmFolder.name}? Any assets in this folder will be moved to Unfiled.`}
          confirmLabel="Delete folder"
          onClose={onCloseConfirm}
          onConfirm={onConfirmFolderDelete}
          isPending={isPending}
        />
      ) : null}

      {confirmAsset ? (
        <ConfirmModal
          title="Delete asset"
          description={`Delete ${confirmAsset.displayName || confirmAsset.filename}? This cannot be undone.`}
          confirmLabel="Delete asset"
          onClose={onCloseConfirm}
          onConfirm={onConfirmAssetDelete}
          isPending={isPending}
        />
      ) : null}
    </>
  );
}
