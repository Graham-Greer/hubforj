"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ActionLinkField from "../ActionLinkField";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import PageHeroFieldGroup from "../PageHeroFieldGroup";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import FormSectionTabs from "@/components/patterns/form-section-tabs/FormSectionTabs";
import SectionRichTextField from "@/components/patterns/section-rich-text-field/SectionRichTextField";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import Textarea from "@/components/ui/textarea/Textarea";
import { initialHomepageSettingsState } from "../form-state";
import { updateHomepageSettingsAction } from "../actions";
import { publicInternalActionOptions } from "@/lib/domain/public-action-links";
import { parseSectionRichTextInput } from "@/lib/domain/section-rich-text";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import styles from "../settings.module.css";

const fieldKeys = Object.keys(initialHomepageSettingsState.values);
const homepageSections = [
  {
    id: "hero",
    label: "Hero",
    description: "Headline, supporting copy, and primary actions.",
  },
  {
    id: "about",
    label: "About us",
    description: "Introductory media, body copy, and optional action.",
  },
  {
    id: "what-we-do",
    label: "What we do",
    description: "Section heading and supporting description.",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Social-proof heading and intro copy.",
  },
  {
    id: "cta",
    label: "Call to action",
    description: "Closing conversion message and actions.",
  },
];

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(
    fieldKeys,
    initialHomepageSettingsState.values,
    values,
    (base) => ({
      ...base,
      infoBody: JSON.stringify(parseSectionRichTextInput(base?.infoBody)),
    })
  );
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function HomepageSettingsForm({ hub, initialValues, mediaAssets = [], mediaFolders = [] }) {
  const router = useRouter();
  const [activeSectionId, setActiveSectionId] = useState(homepageSections[0].id);
  const initialState = {
    ...initialHomepageSettingsState,
    values: {
      ...initialHomepageSettingsState.values,
      ...initialValues,
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateHomepageSettingsAction, initialState);
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
    if (!feedbackRef.current) {
      return;
    }

    if (!state?.error && !state?.success) {
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

    router.push(`/${hub.slug}/admin/settings/pages`);
    router.refresh();
  }, [hub.slug, router, state?.success]);

  const submitIdleLabel = state?.success && !isDirty ? "Content saved" : "Save content";

  return (
    <form ref={formRef} className={styles.form} action={formAction} onInput={updateDirtyState} onChange={updateDirtyState}>
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <FormSectionTabs
        tabs={homepageSections}
        activeTabId={activeSectionId}
        onTabChange={setActiveSectionId}
        showDescriptions={false}
        onboardingKey="homepage-section-tabs"
      />

      <section
        id="form-section-panel-hero"
        role="tabpanel"
        aria-labelledby="form-section-tab-hero"
        hidden={activeSectionId !== "hero"}
        data-onboarding="homepage-hero-panel"
        className={[styles.panel, activeSectionId !== "hero" ? styles.panelHidden : ""].filter(Boolean).join(" ")}
      >
        <AdminFormSection title="Hero">
          <PageHeroFieldGroup
            hub={hub}
            values={values}
            mediaAssets={mediaAssets}
            mediaFolders={mediaFolders}
            gridClassName={styles.grid}
            onMediaAssetChange={scheduleDirtyStateUpdate}
            onMediaAltChange={scheduleDirtyStateUpdate}
            titleRequiredIndicator
            mediaRequiredIndicator
            mediaLabel="Hero media"
            eyebrowLabel="Hero eyebrow"
            titleLabel="Hero title"
            descriptionLabel="Hero description"
            uploadLabel="Upload hero media"
            titleHint="Main homepage message shown first to visitors."
            eyebrowHint="Optional short label above the hero title."
            descriptionHint="Optional supporting sentence or two beneath the hero title."
            mediaHint="Select media via upload or using existing media."
            mediaEmptyTitle="Select media"
          />
          <div className={styles.actionGroup} data-onboarding="homepage-hero-actions">
            <ActionLinkField
              key={`hero-primary-${values.heroPrimaryActionLabel}-${values.heroPrimaryActionDestination}`}
              title="Primary action"
              prefix="heroPrimaryAction"
              values={values}
              internalOptions={publicInternalActionOptions}
            />
            <ActionLinkField
              key={`hero-secondary-${values.heroSecondaryActionLabel}-${values.heroSecondaryActionDestination}`}
              title="Secondary action"
              prefix="heroSecondaryAction"
              values={values}
              internalOptions={publicInternalActionOptions}
            />
          </div>
        </AdminFormSection>
      </section>

      <section
        id="form-section-panel-about"
        role="tabpanel"
        aria-labelledby="form-section-tab-about"
        hidden={activeSectionId !== "about"}
        className={[styles.panel, activeSectionId !== "about" ? styles.panelHidden : ""].filter(Boolean).join(" ")}
      >
        <AdminFormSection title="About us">
          <PageHeroFieldGroup
            hub={hub}
            values={values}
            mediaAssets={mediaAssets}
            mediaFolders={mediaFolders}
            gridClassName={styles.grid}
            onMediaAssetChange={scheduleDirtyStateUpdate}
            onMediaAltChange={scheduleDirtyStateUpdate}
            prefix="info"
            title="About section"
            titleRequiredIndicator
            mediaRequiredIndicator
            mediaLabel="About section media"
            eyebrowLabel="Section eyebrow"
            titleLabel="Section title"
            descriptionLabel="Section description"
            uploadLabel="Upload section media"
            mediaHint="Select media via upload or using existing media."
            mediaEmptyTitle="Select media"
            eyebrowHint="Optional short label above the section heading."
            titleHint="Required to replace the default About section content."
            descriptionHint="Optional summary that introduces the fuller body content."
          />
          <SectionRichTextField
            name="infoBody"
            label="Section body"
            hint="Required to replace the default About section. Use paragraphs and bullet lists only."
            requiredIndicator
            defaultValue={values.infoBody}
          />
          <div className={styles.actionGroup}>
            <ActionLinkField
              key={`info-action-${values.infoActionLabel}-${values.infoActionDestination}`}
              title="Optional action"
              prefix="infoAction"
              values={values}
              internalOptions={publicInternalActionOptions}
            />
          </div>
        </AdminFormSection>
      </section>

      <section
        id="form-section-panel-what-we-do"
        role="tabpanel"
        aria-labelledby="form-section-tab-what-we-do"
        hidden={activeSectionId !== "what-we-do"}
        className={[styles.panel, activeSectionId !== "what-we-do" ? styles.panelHidden : ""].filter(Boolean).join(" ")}
      >
        <AdminFormSection title="What we do">
          <div className={styles.grid}>
            <Input
              name="whatWeDoEyebrow"
              label="Section eyebrow"
              hint="Optional short label above the What we do heading."
              defaultValue={values.whatWeDoEyebrow}
            />
            <Input
              name="whatWeDoTitle"
              label="Section title"
              hint="Required if you want to replace the default What we do heading."
              requiredIndicator
              defaultValue={values.whatWeDoTitle}
            />
          </div>
          <Textarea
            name="whatWeDoDescription"
            label="Section description"
            hint="Optional supporting copy that introduces this structured grid section."
            defaultValue={values.whatWeDoDescription}
          />
        </AdminFormSection>
      </section>

      <section
        id="form-section-panel-testimonials"
        role="tabpanel"
        aria-labelledby="form-section-tab-testimonials"
        hidden={activeSectionId !== "testimonials"}
        className={[styles.panel, activeSectionId !== "testimonials" ? styles.panelHidden : ""].filter(Boolean).join(" ")}
      >
        <AdminFormSection title="Testimonials">
          <div className={styles.grid}>
            <Input
              name="testimonialsEyebrow"
              label="Section eyebrow"
              hint="Optional short label above the testimonials heading."
              defaultValue={values.testimonialsEyebrow}
            />
            <Input
              name="testimonialsTitle"
              label="Section title"
              hint="Required if you want to replace the default testimonials heading."
              requiredIndicator
              defaultValue={values.testimonialsTitle}
            />
          </div>
          <Textarea
            name="testimonialsDescription"
            label="Section description"
            hint="Optional supporting copy that introduces the testimonials section."
            defaultValue={values.testimonialsDescription}
          />
        </AdminFormSection>
      </section>

      <section
        id="form-section-panel-cta"
        role="tabpanel"
        aria-labelledby="form-section-tab-cta"
        hidden={activeSectionId !== "cta"}
        className={[styles.panel, activeSectionId !== "cta" ? styles.panelHidden : ""].filter(Boolean).join(" ")}
      >
        <AdminFormSection title="Call To Action">
          <div className={styles.grid}>
            <Input
              name="ctaEyebrow"
              label="CTA eyebrow"
              hint="Optional short label above the call to action."
              defaultValue={values.ctaEyebrow}
            />
            <Input
              name="ctaTitle"
              label="CTA title"
              hint="Main message for the action-focused section near the end of the page."
              requiredIndicator
              defaultValue={values.ctaTitle}
            />
          </div>
          <Textarea
            name="ctaDescription"
            label="CTA description"
            hint="Optional supporting copy that helps visitors understand the next step."
            defaultValue={values.ctaDescription}
          />
          <div className={styles.actionGroup}>
            <ActionLinkField
              key={`cta-primary-${values.ctaPrimaryActionLabel}-${values.ctaPrimaryActionDestination}`}
              title="Primary action"
              prefix="ctaPrimaryAction"
              values={values}
              internalOptions={publicInternalActionOptions}
            />
            <ActionLinkField
              key={`cta-secondary-${values.ctaSecondaryActionLabel}-${values.ctaSecondaryActionDestination}`}
              title="Secondary action"
              prefix="ctaSecondaryAction"
              values={values}
              internalOptions={publicInternalActionOptions}
            />
          </div>
        </AdminFormSection>
      </section>

      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <AdminDiscardChangesButton href={`/${hub.slug}/admin/settings/pages`} />
        <SubmitButton idleLabel={submitIdleLabel} pendingLabel="Saving content" disabled={!isDirty} />
      </AdminFormFooter>
    </form>
  );
}
