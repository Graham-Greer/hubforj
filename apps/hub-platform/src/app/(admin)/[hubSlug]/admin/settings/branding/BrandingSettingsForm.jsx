"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import MediaAssetField from "@/components/patterns/media-asset-field/MediaAssetField";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { brandingHeaderCtaOptions } from "@/lib/domain/site-settings";
import { supportedTemplateOptions } from "@/lib/templates/template-registry";
import { initialBrandingSettingsState } from "../form-state";
import { updateBrandingSettingsAction } from "../actions";
import styles from "../settings.module.css";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const fieldKeys = Object.keys(initialBrandingSettingsState.values);

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, initialBrandingSettingsState.values, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function BrandingSettingsForm({ hub, initialValues, mediaAssets, mediaFolders }) {
  const router = useRouter();
  const initialState = {
    ...initialBrandingSettingsState,
    values: {
      ...initialBrandingSettingsState.values,
      ...initialValues,
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateBrandingSettingsAction, initialState);
  const initialValuesRef = useRef(initialState.values);
  const feedbackRef = useRef(null);
  const values = {
    ...initialState.values,
    ...(state?.values || {}),
  };
  const {
    formRef,
    isDirty,
    updateDirtyState,
    scheduleDirtyStateUpdate,
    markSaved,
  } = useDirtyFormState({
    initialSnapshot: initialSavedSnapshot,
    createFormSnapshot,
  });

  useEffect(() => {
    if (!feedbackRef.current || (!state?.error && !state?.success)) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error, state?.success]);

  useEffect(() => {
    if (!state?.success || !state?.values) {
      return;
    }

    const nextSnapshot = createSavedValuesSnapshot({
      ...initialValuesRef.current,
      ...state.values,
    });
    initialValuesRef.current = nextSnapshot;
    markSaved(nextSnapshot);
  }, [markSaved, state?.success, state?.values]);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    router.push(`/${hub.slug}/admin/settings`);
  }, [hub.slug, router, state?.success]);

  const submitIdleLabel = state?.success && !isDirty ? "Site branding saved" : "Save site branding";

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={formAction}
      onInput={updateDirtyState}
      onChange={updateDirtyState}
      data-onboarding="branding-settings-form"
    >
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <AdminFormSection title="Logo">
        <MediaAssetField
          key={`${values.logoAssetId}:${values.logoAlt}`}
          label="Public logo"
          hint="Select media via upload or using existing media."
          hubId={hub.id}
          hubSlug={hub.slug}
          libraryHref={`/${hub.slug}/admin/media`}
          assets={mediaAssets}
          folders={mediaFolders}
          assetId={values.logoAssetId}
          assetAlt={values.logoAlt}
          assetFieldName="logoAssetId"
          altFieldName="logoAlt"
          onAssetChange={scheduleDirtyStateUpdate}
          onAltChange={scheduleDirtyStateUpdate}
          uploadLabel="Upload logo"
          emptyTitle="Select media"
          requiredIndicator
        />
      </AdminFormSection>
      <AdminFormSection title="Presentation" divider>
        <div className={styles.grid}>
          <AdminSelect
            name="themeKey"
            label="Public theme"
            hint="Controls the public site and member-facing surfaces. Admin workspace theme is fixed separately."
            options={themeOptions}
            defaultValue={values.themeKey}
            required
            requiredIndicator
          />
          <AdminSelect
            name="templateKey"
            label="Public template"
            hint="Controls the public site presentation family, not the hub-admin workspace shell."
            options={supportedTemplateOptions}
            defaultValue={values.templateKey}
            required
            requiredIndicator
          />
        </div>
      </AdminFormSection>
      <AdminFormSection title="Brand colors" divider>
        <div className={styles.grid}>
          <Input
            name="brandPrimaryColor"
            label="Primary brand color"
            defaultValue={values.brandPrimaryColor}
            hint="Dominant public accent color used for CTAs, active states, links, and emphasis. Use hex format, for example #CC0000."
            pattern="^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$"
            spellCheck={false}
            autoCapitalize="characters"
            required
            requiredIndicator
          />
          <Input
            name="brandSecondaryColor"
            label="Secondary brand color"
            defaultValue={values.brandSecondaryColor}
            hint="Used sparingly by templates for supporting brand moments and alternate accents. Use hex format, for example #CC0000."
            pattern="^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$"
            spellCheck={false}
            autoCapitalize="characters"
          />
        </div>
      </AdminFormSection>
      <AdminFormSection title="Header CTA" divider>
        <div className={styles.grid}>
          <AdminSelect
            name="headerCtaKey"
            label="Primary header CTA"
            hint="Choose one approved CTA for the right side of the public header. Routes stay system-mapped."
            options={brandingHeaderCtaOptions}
            defaultValue={values.headerCtaKey}
          />
        </div>
      </AdminFormSection>
      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <AdminDiscardChangesButton href={`/${hub.slug}/admin/settings`} />
        <SubmitButton
          idleLabel={submitIdleLabel}
          pendingLabel="Saving site branding"
          disabled={!isDirty}
          onboardingKey="branding-settings-save"
        />
      </AdminFormFooter>
    </form>
  );
}
