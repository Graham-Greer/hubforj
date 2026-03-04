import Field from "../../../ui/form/field/Field";
import Input from "../../../ui/form/input/Input";
import Textarea from "../../../ui/form/textarea/Textarea";
import Select from "../../../ui/form/select/Select";
import Button from "../../../ui/button/Button";
import WysiwygEditor from "../../../ui/form/wysiwyg/WysiwygEditor";
import Accordion from "../../../ui/accordion/Accordion";
import RepeatableListEditor from "../repeatable-list-editor/RepeatableListEditor";
import { createDefaultAccordionItem } from "@/lib/data/pages/accordion-section";
import styles from "./BlockEditor.module.css";

export default function BlockEditor({ block, schema = [], onChange, onOpenMediaLibrary }) {
  if (!block) {
    return <p className={styles.empty}>Select a block to edit.</p>;
  }

  const updateProp = (key, nextValue) => {
    onChange?.({ ...block, props: { ...block.props, [key]: nextValue } });
  };

  const groupedSchema = schema.some((field) => field.type === "group")
    ? schema
    : [
      {
        key: "default",
        type: "group",
        label: "Core",
        defaultOpen: true,
        fields: schema,
      },
    ];

  const defaultOpenGroups = groupedSchema.filter((group) => group.defaultOpen).map((group) => group.key);

  const renderField = (field) => {
    if (field.type === "ctas") {
      const ctas = Array.isArray(block.props?.[field.key]) ? block.props[field.key] : [];
      const canAddFirst = ctas.length === 0;
      const canAddSecond = ctas.length === 1;

      const addCta = () => {
        if (ctas.length >= 2) return;
        const next = [...ctas, { label: "", href: "" }];
        updateProp(field.key, next);
      };

      const updateCta = (index, patch) => {
        const next = ctas.map((cta, itemIndex) => (itemIndex === index ? { ...cta, ...patch } : cta));
        updateProp(field.key, next);
      };

      const removeCta = (index) => {
        const next = ctas.filter((_, itemIndex) => itemIndex !== index);
        updateProp(field.key, next);
      };

      return (
        <div className={styles.ctaGroup}>
          {ctas.map((cta, index) => (
            <div key={`cta-${index}`} className={styles.ctaCard}>
              <div className={styles.ctaHeader}>
                <strong>{index === 0 ? "Primary button" : "Secondary button"}</strong>
                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  intent="danger"
                  icon="delete"
                  ariaLabel={`Remove CTA ${index + 1}`}
                  onClick={() => removeCta(index)}
                />
              </div>

              <Field id={`${block.id}-${field.key}-${index}-label`} label="Label" required>
                <Input
                  id={`${block.id}-${field.key}-${index}-label`}
                  value={cta.label || ""}
                  onChange={(event) => updateCta(index, { label: event.target.value })}
                />
              </Field>

              <Field
                id={`${block.id}-${field.key}-${index}-href`}
                label="Link"
                required
                hint="Use /path for internal links or https:// for external links."
              >
                <Input
                  id={`${block.id}-${field.key}-${index}-href`}
                  value={cta.href || ""}
                  onChange={(event) => updateCta(index, { href: event.target.value })}
                />
              </Field>
            </div>
          ))}

          {canAddFirst || canAddSecond ? (
            <div className={styles.ctaActions}>
              {canAddFirst ? (
                <Button type="button" variant="secondary" size="sm" onClick={addCta}>
                  Add button
                </Button>
              ) : null}
              {canAddSecond ? (
                <Button type="button" variant="secondary" size="sm" onClick={addCta}>
                  Add button
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }

    if (field.type === "accordion-items") {
      const items = Array.isArray(block.props?.[field.key]) ? block.props[field.key] : [];
      return (
        <RepeatableListEditor
          title={field.label}
          addLabel="Add item"
          items={items}
          onCreateItem={createDefaultAccordionItem}
          onChange={(nextItems) => updateProp(field.key, nextItems)}
          removeTitle="Remove accordion item?"
          removeMessage="This will remove the item from the section."
          renderItemFields={({ item, index, onChange: onItemChange }) => (
            <>
              <Field id={`${block.id}-${field.key}-${index}-title`} label="Title" required>
                <Input
                  id={`${block.id}-${field.key}-${index}-title`}
                  value={item.title || ""}
                  onChange={(event) => onItemChange({ ...item, title: event.target.value })}
                />
              </Field>
              <Field id={`${block.id}-${field.key}-${index}-content`} label="Content" required>
                <WysiwygEditor
                  value={item.content || ""}
                  onChange={(value) => onItemChange({ ...item, content: value })}
                />
              </Field>
            </>
          )}
        />
      );
    }

    const value = block.props?.[field.key] || "";

    return (
      <Field key={field.key} id={`${block.id}-${field.key}`} label={field.label} hint={field.hint}>
        {field.type === "textarea" ? (
          <>
            <Textarea
              id={`${block.id}-${field.key}`}
              value={value}
              onChange={(event) => updateProp(field.key, event.target.value)}
              maxLength={field.maxLength}
            />
            {field.maxLength ? (
              <p className={styles.counter}>
                {String(value).length}/{field.maxLength}
              </p>
            ) : null}
          </>
        ) : field.type === "select" ? (
          <Select
            id={`${block.id}-${field.key}`}
            value={value}
            options={field.options || []}
            onChange={(next) => updateProp(field.key, next)}
          />
        ) : field.type === "wysiwyg" ? (
          <WysiwygEditor value={value} onChange={(next) => updateProp(field.key, next)} />
        ) : field.type === "media" ? (
          <div className={styles.mediaField}>
            <Input
              id={`${block.id}-${field.key}`}
              value={value}
              onChange={(event) => updateProp(field.key, event.target.value)}
              placeholder="media_xxx"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => onOpenMediaLibrary?.({ blockId: block.id, fieldKey: field.key, multiple: false })}
            >
              Select media
            </Button>
          </div>
        ) : field.type === "media-list" ? (
          <div className={styles.mediaField}>
            <Input
              id={`${block.id}-${field.key}`}
              value={value}
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
            value={value}
            onChange={(event) => updateProp(field.key, event.target.value)}
          />
        )}
      </Field>
    );
  };

  return (
    <div className={styles.root}>
      <Accordion
        type="multi"
        defaultOpen={defaultOpenGroups}
        items={groupedSchema.map((group) => ({
          value: group.key,
          label: group.label,
          content: (
            <div className={styles.groupFields}>
              {(group.fields || []).map((field) => (
                <div key={field.key} className={styles.fieldWrap}>
                  {renderField(field)}
                </div>
              ))}
            </div>
          ),
        }))}
      />
    </div>
  );
}
