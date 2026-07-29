"use client";

import { useMemo, useState } from "react";
import { resolveAdminOnboardingVideoAsset } from "@/lib/admin-onboarding/video-assets";
import styles from "./AdminOnboardingVideoFrame.module.css";

export default function AdminOnboardingVideoFrame({
  assetKey = "",
  theme = "light",
  title = "",
}) {
  const [hasError, setHasError] = useState(false);
  const src = useMemo(() => resolveAdminOnboardingVideoAsset(assetKey, theme), [assetKey, theme]);

  if (!assetKey || !src || hasError) {
    return (
      <div className={styles.fallback}>
        <p className={styles.fallbackTitle}>Video guide</p>
        <p className={styles.fallbackBody}>
          A short walkthrough for {title || "this step"} can be added here when the recorded asset is ready.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      <video
        className={styles.video}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        controls
        onError={() => setHasError(true)}
      />
    </div>
  );
}
