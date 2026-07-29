"use client";

import Surface from "@/components/primitives/surface/Surface";
import Icon from "@/components/ui/icon/Icon";
import { formatMediaFileSize } from "@/lib/domain/media";
import MediaAssetPreview from "./MediaAssetPreview";
import styles from "./MediaLibraryWorkspace.module.css";

export default function MediaAssetGrid({
  filteredAssets,
  selectedAssetId,
  onSelectAsset,
}) {
  if (!filteredAssets.length) {
    return (
      <Surface className={styles.assetEmpty} tone="muted" padding="md">
        <Icon name="imagesmode" size="lg" tone="muted" decorative />
        <strong>No assets match this view</strong>
        <span>Try a different search term, tab, or folder filter.</span>
      </Surface>
    );
  }

  return (
      <div className={styles.assetGrid}>
        {filteredAssets.map((asset) => (
          <Surface
            key={asset.id}
            as="button"
            type="button"
            tone="muted"
            padding="md"
            className={[styles.assetCard, selectedAssetId === asset.id ? styles.assetCardSelected : ""].filter(Boolean).join(" ")}
            onClick={() => onSelectAsset(asset.id)}
          >
            <div className={styles.assetThumb}>
              <MediaAssetPreview asset={asset} />
            </div>
            <div className={styles.assetMeta}>
              <strong>{asset.displayName || asset.filename}</strong>
              <span>{formatMediaFileSize(asset.sizeBytes)}</span>
            </div>
          </Surface>
        ))}
      </div>
  );
}
