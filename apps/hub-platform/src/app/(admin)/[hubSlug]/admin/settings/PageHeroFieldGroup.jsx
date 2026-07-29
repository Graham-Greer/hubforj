"use client";

import MediaAssetField from "@/components/patterns/media-asset-field/MediaAssetField";
import Input from "@/components/ui/input/Input";
import Textarea from "@/components/ui/textarea/Textarea";

export default function PageHeroFieldGroup({
  hub,
  values,
  mediaAssets = [],
  mediaFolders = [],
  gridClassName = "",
  onMediaAssetChange,
  onMediaAltChange,
  prefix = "hero",
  title = "Hero",
  mediaLabel,
  mediaRequiredIndicator = false,
  eyebrowLabel,
  titleLabel,
  descriptionLabel,
  uploadLabel,
  titleRequiredIndicator = false,
  titleHint = "Main public-facing title for this page hero.",
  descriptionHint = "Optional supporting sentence or two beneath the hero title.",
  eyebrowHint = "Optional short label above the hero title.",
  mediaHint = "Select media via upload or using existing media.",
  mediaEmptyTitle = "Select media",
}) {
  return (
    <>
      <MediaAssetField
        key={`${values[`${prefix}MediaAssetId`]}:${values[`${prefix}MediaAlt`]}`}
        label={mediaLabel || `${title} media`}
        hint={mediaHint}
        hubId={hub.id}
        hubSlug={hub.slug}
        libraryHref={`/${hub.slug}/admin/media`}
        assets={mediaAssets}
        folders={mediaFolders}
        assetId={values[`${prefix}MediaAssetId`]}
        assetAlt={values[`${prefix}MediaAlt`]}
        assetFieldName={`${prefix}MediaAssetId`}
        altFieldName={`${prefix}MediaAlt`}
        onAssetChange={onMediaAssetChange}
        onAltChange={onMediaAltChange}
        requiredIndicator={mediaRequiredIndicator}
        accept="image/*,video/*"
        uploadLabel={uploadLabel || `Upload ${title.toLowerCase()} media`}
        emptyTitle={mediaEmptyTitle}
      />
      <div className={gridClassName}>
        <Input
          name={`${prefix}Eyebrow`}
          label={eyebrowLabel || `${title} eyebrow`}
          hint={eyebrowHint}
          defaultValue={values[`${prefix}Eyebrow`]}
        />
        <Input
          name={`${prefix}Title`}
          label={titleLabel || `${title} title`}
          hint={titleHint}
          requiredIndicator={titleRequiredIndicator}
          defaultValue={values[`${prefix}Title`]}
        />
      </div>
      <Textarea
        name={`${prefix}Description`}
        label={descriptionLabel || `${title} description`}
        hint={descriptionHint}
        defaultValue={values[`${prefix}Description`]}
      />
    </>
  );
}
