"use client";

import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import styles from "./MediaLibraryWorkspace.module.css";

export default function MediaLibraryHeader({
  isPicker,
  embedded,
  pickerContext,
  onCreateFolder,
  onUploadAssets,
}) {
  const description = isPicker
    ? `Choose an asset for ${pickerContext?.label || "this field"} and return to the form.`
    : "Manage hub assets, organize them into folders, and reuse them safely across branding and content records.";

  const actions = (
    <>
      {isPicker && pickerContext?.returnTo ? (
        <Button variant="ghost" href={pickerContext.returnTo}>
          Cancel and return
        </Button>
      ) : null}
      <Button variant="secondary" onClick={onCreateFolder} data-onboarding="media-add-folder-button">
        Add new folder
      </Button>
      <Button onClick={onUploadAssets} data-onboarding="media-add-assets-button">Add new assets</Button>
    </>
  );

  if (embedded) {
    return (
      <div className={styles.embeddedHeader}>
        <div>
          <p className={styles.embeddedEyebrow}>{isPicker ? "Media picker" : "Media library"}</p>
          <h2 className={styles.embeddedTitle}>{isPicker ? "Select media" : "Media library"}</h2>
          <p className={styles.embeddedDescription}>{description}</p>
        </div>
        <div className={styles.embeddedActions}>{actions}</div>
      </div>
    );
  }

  return (
    <PageHeader
      eyebrow={isPicker ? "Media picker" : "Media"}
      title={isPicker ? "Select media" : "Media library"}
      description={description}
      actions={actions}
    />
  );
}
