import Field from "../../../ui/form/field/Field";
import Input from "../../../ui/form/input/Input";
import Textarea from "../../../ui/form/textarea/Textarea";
import Select from "../../../ui/form/select/Select";
import Button from "../../../ui/button/Button";
import WysiwygEditor from "../../../ui/form/wysiwyg/WysiwygEditor";
import { getCmsBlockDefinition, normalizeVariant } from "@/lib/data/pages/block-registry";
import styles from "./BlockEditor.module.css";

export default function BlockEditor({ block, schema = [], onChange, onOpenMediaLibrary }) {
  if (!block) {
    return <p className={styles.empty}>Select a block to edit.</p>;
  }

  const updateProp = (key, nextValue) => {
    onChange?.({ ...block, props: { ...block.props, [key]: nextValue } });
  };
  const definition = getCmsBlockDefinition(block.type);
  const variantOptions = (definition?.variants || []).map((variant) => ({
    value: variant,
    label: variant,
  }));

  return (
    <div className={styles.root}>
      {variantOptions.length ? (
        <Field id={`${block.id}-variant`} label="Variant">
          <Select
            id={`${block.id}-variant`}
            value={block.variant || definition.defaultVariant}
            options={variantOptions}
            onChange={(value) => onChange?.({ ...block, variant: normalizeVariant(block.type, value) })}
          />
        </Field>
      ) : null}

      {schema.map((field) => (
        <Field key={field.key} id={`${block.id}-${field.key}`} label={field.label} hint={field.hint}>
          {field.type === "textarea" ? (
            <Textarea
              id={`${block.id}-${field.key}`}
              value={block.props?.[field.key] || ""}
              onChange={(event) => updateProp(field.key, event.target.value)}
            />
          ) : field.type === "select" ? (
            <Select
              id={`${block.id}-${field.key}`}
              value={block.props?.[field.key] || ""}
              options={field.options || []}
              onChange={(value) => updateProp(field.key, value)}
            />
          ) : field.type === "wysiwyg" ? (
            <WysiwygEditor value={block.props?.[field.key] || ""} onChange={(value) => updateProp(field.key, value)} />
          ) : field.type === "media" ? (
            <div className={styles.mediaField}>
              <Input
                id={`${block.id}-${field.key}`}
                value={block.props?.[field.key] || ""}
                onChange={(event) => updateProp(field.key, event.target.value)}
                placeholder="media_xxx"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenMediaLibrary?.({ blockId: block.id, fieldKey: field.key, multiple: false })}
              >
                Select media
              </Button>
            </div>
          ) : field.type === "media-list" ? (
            <div className={styles.mediaField}>
              <Input
                id={`${block.id}-${field.key}`}
                value={block.props?.[field.key] || ""}
                onChange={(event) => updateProp(field.key, event.target.value)}
                placeholder="media_a,media_b"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenMediaLibrary?.({ blockId: block.id, fieldKey: field.key, multiple: true })}
              >
                Select media
              </Button>
            </div>
          ) : (
            <Input
              id={`${block.id}-${field.key}`}
              value={block.props?.[field.key] || ""}
              onChange={(event) => updateProp(field.key, event.target.value)}
            />
          )}
        </Field>
      ))}
    </div>
  );
}
