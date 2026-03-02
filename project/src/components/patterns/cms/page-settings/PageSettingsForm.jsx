import Field from "../../../ui/form/field/Field";
import Input from "../../../ui/form/input/Input";
import Textarea from "../../../ui/form/textarea/Textarea";
import Select from "../../../ui/form/select/Select";
import FormGrid from "../../../ui/form/form-grid/FormGrid";
import Button from "../../../ui/button/Button";
import {
  listFooterSectionOptions,
  listHeaderSectionOptions,
} from "@/lib/data/pages/layout-config";

export default function PageSettingsForm({ value = {}, onChange, onOpenMediaLibrary, columns = 2 }) {
  const seo = value.seo || {};
  const headerOptions = listHeaderSectionOptions();
  const footerOptions = listFooterSectionOptions();

  return (
    <FormGrid columns={columns}>
      <Field id="title" label="Title" required>
        <Input id="title" value={value.title || ""} onChange={(event) => onChange?.({ ...value, title: event.target.value })} />
      </Field>
      <Field id="slug" label="Slug" required>
        <Input id="slug" value={value.slug || ""} onChange={(event) => onChange?.({ ...value, slug: event.target.value })} />
      </Field>
      <Field id="status" label="Status">
        <Select
          id="status"
          value={value.status || "draft"}
          options={[
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ]}
          disabled
        />
      </Field>
      <Field id="seoTitle" label="SEO title">
        <Input
          id="seoTitle"
          value={seo.title || ""}
          onChange={(event) => onChange?.({ ...value, seo: { ...seo, title: event.target.value } })}
        />
      </Field>
      <Field id="seoDescription" label="SEO description">
        <Textarea
          id="seoDescription"
          value={seo.description || ""}
          onChange={(event) => onChange?.({ ...value, seo: { ...seo, description: event.target.value } })}
          rows={3}
        />
      </Field>
      <Field id="seoImageMediaId" label="SEO image media ID">
        <div>
          <Input
            id="seoImageMediaId"
            value={seo.imageMediaId || ""}
            onChange={(event) => onChange?.({ ...value, seo: { ...seo, imageMediaId: event.target.value } })}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenMediaLibrary?.({ scope: "seo", fieldKey: "imageMediaId", multiple: false })}
          >
            Select media
          </Button>
        </div>
      </Field>
      <Field
        id="headerIdOverride"
        label="Header override"
        hint="Leave blank to inherit the hub global header."
      >
        <Select
          id="headerIdOverride"
          value={value.headerIdOverride || ""}
          options={headerOptions}
          onChange={(nextValue) => onChange?.({ ...value, headerIdOverride: nextValue })}
          placeholder="Use global header"
        />
      </Field>
      <Field
        id="footerIdOverride"
        label="Footer override"
        hint="Leave blank to inherit the hub global footer."
      >
        <Select
          id="footerIdOverride"
          value={value.footerIdOverride || ""}
          options={footerOptions}
          onChange={(nextValue) => onChange?.({ ...value, footerIdOverride: nextValue })}
          placeholder="Use global footer"
        />
      </Field>
    </FormGrid>
  );
}
