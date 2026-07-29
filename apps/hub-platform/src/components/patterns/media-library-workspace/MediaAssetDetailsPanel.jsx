"use client";

import Surface from "@/components/primitives/surface/Surface";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input/Input";
import Textarea from "@/components/ui/textarea/Textarea";
import MediaAssetPreview from "./MediaAssetPreview";
import { formatDate, getAssetKindLabel, getUsageHref } from "./media-library-helpers";
import styles from "./MediaLibraryWorkspace.module.css";

export default function MediaAssetDetailsPanel({
  hub,
  isPicker = false,
  selectedAsset,
  folderRows,
  detailValues,
  setDetailValues,
  onSaveDetails,
  onUseSelectedAsset,
  onRequestDelete,
}) {
  return (
    <Surface className={styles.detailsPanel} padding="md" data-onboarding="media-details-panel">
      {selectedAsset ? (
        <div className={styles.details}>
          <div className={styles.detailsHeader}>
            <div>
              <h2 className={styles.detailsTitle}>Media details</h2>
              <p className={styles.detailsType}>{getAssetKindLabel(selectedAsset)}</p>
            </div>
            {selectedAsset.publicUrl ? (
              <Button
                href={selectedAsset.publicUrl}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                size="sm"
                className={styles.openFileLink}
              >
                <Icon name="open_in_new" size="sm" decorative />
                Open file
              </Button>
            ) : null}
          </div>

          <Surface as="div" tone="muted" padding="none" className={styles.detailsPreview}>
            <MediaAssetPreview asset={selectedAsset} />
          </Surface>

          <div className={styles.readOnlyList}>
            <div><strong>Dimensions:</strong> {selectedAsset.width && selectedAsset.height ? `${selectedAsset.width} × ${selectedAsset.height}` : "Not available"}</div>
            <div><strong>Date added:</strong> {formatDate(selectedAsset.createdAt)}</div>
            <div><strong>Original filename:</strong> {selectedAsset.filename || "Not available"}</div>
          </div>

          <Input
            label="Display name"
            value={detailValues.displayName}
            onChange={(event) => setDetailValues((current) => ({ ...current, displayName: event.target.value }))}
            hint="Use a clearer label without changing the underlying file."
          />

          <AdminSelect
            label="Folder"
            value={detailValues.folderId}
            onChange={(event) => setDetailValues((current) => ({ ...current, folderId: event.target.value }))}
            options={[
              { value: "", label: "Unfiled" },
              ...folderRows.map((folder) => ({ value: folder.id, label: folder.name })),
            ]}
            hint="Move the asset between folders without changing its usage."
          />

          <Textarea
            label="Alt text"
            value={detailValues.alt}
            onChange={(event) => setDetailValues((current) => ({ ...current, alt: event.target.value }))}
            hint="Default alt text used when a usage-level override is not provided."
          />

          {isPicker ? (
            <Surface as="div" tone="muted" padding="none" className={styles.pickerPanel}>
              <div>
                <h3 className={styles.sectionTitle}>Use this media</h3>
                <p className={styles.pickerBody}>
                  Confirm the asset and alt text here, then return to the originating form with this selection applied.
                </p>
              </div>
              <Button onClick={onUseSelectedAsset}>Use this media</Button>
            </Surface>
          ) : null}

          <div className={styles.usageSection}>
            <h3 className={styles.sectionTitle}>Usage references</h3>
            {selectedAsset.usageRefs.length ? (
              <ul className={styles.usageList}>
                {selectedAsset.usageRefs.map((usage) => {
                  const href = getUsageHref(hub.slug, usage);
                  return (
                    <Surface
                      key={`${usage.entityType}-${usage.entityId}-${usage.field}`}
                      as="li"
                      tone="muted"
                      padding="md"
                      className={styles.usageItem}
                    >
                      <div>
                        <strong>{usage.label}</strong>
                        <span>{usage.field}</span>
                      </div>
                      {href ? <Button href={href} variant="ghost">Open</Button> : null}
                    </Surface>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.usageEmpty}>0 reference(s)</p>
            )}
          </div>

          <div className={styles.detailsActions}>
            <Button variant="secondary" onClick={onSaveDetails}>
              Save details
            </Button>
            <Button variant="ghost" onClick={onRequestDelete} disabled={selectedAsset.usageCount > 0}>
              Delete
            </Button>
          </div>
          {selectedAsset.usageCount > 0 ? (
            <p className={styles.deleteHint}>This asset is still in use and cannot be deleted until those usages are removed.</p>
          ) : null}
        </div>
      ) : (
        <div className={styles.detailsEmpty}>
          <Icon name="imagesmode" size="lg" tone="muted" decorative />
          <strong>Select an asset</strong>
          <span>Choose an asset from the grid to inspect metadata, folder placement, and usage references.</span>
        </div>
      )}
    </Surface>
  );
}
