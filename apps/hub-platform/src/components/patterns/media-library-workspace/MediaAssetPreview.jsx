"use client";

import Image from "next/image";
import Icon from "@/components/ui/icon/Icon";
import { getAssetIconName } from "./media-library-helpers";
import styles from "./MediaLibraryWorkspace.module.css";

export default function MediaAssetPreview({ asset }) {
  if (asset.type === "image" && asset.publicUrl) {
    return (
      <Image
        src={asset.publicUrl}
        alt=""
        className={styles.assetImage}
        fill
        sizes="(max-width: 72rem) 100vw, 11rem"
        unoptimized
      />
    );
  }

  return (
    <div className={styles.assetFallback}>
      <Icon name={getAssetIconName(asset)} size="lg" tone="muted" decorative />
    </div>
  );
}
