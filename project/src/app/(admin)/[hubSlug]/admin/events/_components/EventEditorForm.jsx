"use client";

import { useMemo, useState } from "react";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import MediaLibrary from "@/components/patterns/cms/media-library/MediaLibrary";
import Button from "@/components/ui/button/Button";
import Field from "@/components/ui/form/field/Field";
import FormGrid from "@/components/ui/form/form-grid/FormGrid";
import Input from "@/components/ui/form/input/Input";
import RadioGroup from "@/components/ui/form/radio-group/RadioGroup";
import Select from "@/components/ui/form/select/Select";
import DateTimePicker from "@/components/ui/form/date-time-picker/DateTimePicker";
import WysiwygEditor from "@/components/ui/form/wysiwyg/WysiwygEditor";
import styles from "./EventEditorForm.module.css";

export default function EventEditorForm({
  formAction,
  submitLabel,
  defaultValues,
  media,
  showPublishSubmit = false,
  includeStatusField = false,
  hiddenFields = {},
}) {
  const [description, setDescription] = useState(defaultValues.description || "");
  const [startAt, setStartAt] = useState(defaultValues.startAtInput || "");
  const [endAt, setEndAt] = useState(defaultValues.endAtInput || "");
  const [pricingMode, setPricingMode] = useState(defaultValues.pricingMode || "free");
  const [registrationEligibility, setRegistrationEligibility] = useState(defaultValues.registrationEligibility || "members-only");
  const [visibility, setVisibility] = useState(defaultValues.visibility || "public");
  const [category, setCategory] = useState(defaultValues.category || "Workshop");
  const [imageMediaIds, setImageMediaIds] = useState(defaultValues.imageMediaIds || []);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const mediaById = useMemo(() => {
    return new Map(media.map((item) => [item.id, item]));
  }, [media]);

  const selectedMedia = useMemo(() => {
    return imageMediaIds.map((id) => mediaById.get(id) || { id, filename: id, type: "unknown", alt: "" });
  }, [imageMediaIds, mediaById]);

  const mediaIdsSerialized = JSON.stringify(imageMediaIds);

  return (
    <form action={formAction} className={styles.form}>
      <FormGrid columns={2}>
        <Field id="title" label="Title" required>
          <Input id="title" name="title" required defaultValue={defaultValues.title} />
        </Field>
        <Field id="slug" label="Slug" hint="Optional. Auto-generated from title if empty.">
          <Input id="slug" name="slug" defaultValue={defaultValues.slug} />
        </Field>
      </FormGrid>

      <Field id="description" label="Description" required hint="Allowed formatting: bold, italic, underline, bullets, numbering, links.">
        <WysiwygEditor value={description} onChange={setDescription} />
        <input type="hidden" name="description" value={description} />
      </Field>

      <FormGrid columns={2}>
        <Field id="startAt" label="Start date/time" required>
          <DateTimePicker value={startAt} onChange={setStartAt} clearable={false} />
          <input type="hidden" name="startAt" value={startAt} />
        </Field>
        <Field id="endAt" label="End date/time" required>
          <DateTimePicker value={endAt} onChange={setEndAt} clearable={false} />
          <input type="hidden" name="endAt" value={endAt} />
        </Field>
      </FormGrid>

      <FormGrid columns={2}>
        <Field id="location" label="Location" required>
          <Input id="location" name="location" required defaultValue={defaultValues.location} />
        </Field>
        <Field id="capacity" label="Capacity" required>
          <Input id="capacity" name="capacity" type="number" min="1" required defaultValue={String(defaultValues.capacity)} />
        </Field>
      </FormGrid>

      <FormGrid columns={2}>
        <Field id="category" label="Category" required>
          <Select
            id="category"
            name="category"
            required
            value={category}
            onChange={setCategory}
            options={["Workshop", "Meetup", "Course"]}
            placeholder="Select category"
          />
        </Field>
        <Field id="tags" label="Tags" hint="Comma-separated values.">
          <Input id="tags" name="tags" defaultValue={defaultValues.tagsInput} />
        </Field>
      </FormGrid>

      <Field id="pricingMode" label="Pricing mode" required>
        <RadioGroup
          name="pricingMode"
          value={pricingMode}
          onChange={setPricingMode}
          options={[
            { value: "free", label: "Free" },
            { value: "paid", label: "Paid" },
          ]}
        />
      </Field>

      {pricingMode === "paid" ? (
        <Field id="price" label="Price" required>
          <Input id="price" name="price" type="number" min="0" step="0.01" required defaultValue={defaultValues.priceInput} />
        </Field>
      ) : (
        <input type="hidden" name="price" value="" />
      )}

      <Field id="registrationEligibility" label="Registration eligibility" required>
        <RadioGroup
          name="registrationEligibility"
          value={registrationEligibility}
          onChange={setRegistrationEligibility}
          options={[
            { value: "members-only", label: "Members only" },
            { value: "guests-allowed", label: "Guests allowed" },
          ]}
        />
      </Field>

      <Field id="visibility" label="Visibility" required>
        <RadioGroup
          name="visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "public", label: "Public" },
            { value: "members-only", label: "Members only" },
          ]}
        />
      </Field>

      <section className={styles.mediaSection}>
        <div className={styles.mediaHeader}>
          <Heading as="h2" size="sm">Event media</Heading>
          <Button type="button" variant="secondary" onClick={() => setShowMediaLibrary((value) => !value)}>
            {showMediaLibrary ? "Hide media library" : "Select media"}
          </Button>
        </div>

        {selectedMedia.length ? (
          <ul className={styles.mediaList}>
            {selectedMedia.map((item) => (
              <li key={item.id} className={styles.mediaItem}>
                <div>
                  <Text size="sm" weight="medium">{item.filename}</Text>
                  <Text size="sm" tone="secondary">{item.type}{item.alt ? " - Alt set" : " - Missing alt"}</Text>
                </div>
                <Button
                  type="button"
                  variant="tertiary"
                  intent="danger"
                  onClick={() => setImageMediaIds((current) => current.filter((id) => id !== item.id))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Text tone="secondary">No media selected.</Text>
        )}

        {showMediaLibrary ? (
          <MediaLibrary
            media={media}
            onSelect={(item) => {
              setImageMediaIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
            }}
          />
        ) : null}

        <input type="hidden" name="imageMediaIds" value={mediaIdsSerialized} />
      </section>

      <div className={styles.actions}>
        {Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        {includeStatusField ? <input type="hidden" name="status" value={defaultValues.status} /> : null}
        <Button type="submit" name="intent" value="save" intent="brand">{submitLabel}</Button>
        {showPublishSubmit ? (
          <Button type="submit" name="intent" value="publish" variant="secondary">Publish now</Button>
        ) : null}
      </div>
    </form>
  );
}
