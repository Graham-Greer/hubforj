import Field from "../../../ui/form/field/Field";
import Input from "../../../ui/form/input/Input";
import Textarea from "../../../ui/form/textarea/Textarea";
import Select from "../../../ui/form/select/Select";
import Button from "../../../ui/button/Button";
import WysiwygEditor from "../../../ui/form/wysiwyg/WysiwygEditor";
import Accordion from "../../../ui/accordion/Accordion";
import RepeatableListEditor from "../repeatable-list-editor/RepeatableListEditor";
import PricingTierEditor from "../pricing-tier-editor/PricingTierEditor";
import { createDefaultAccordionItem } from "@/lib/data/pages/accordion-section";
import {
  CARD_ITEM_DESCRIPTION_MAX_LENGTH,
  createDefaultCardItem,
  evaluateCardItemReadiness,
} from "@/lib/cms/fragments/card-item-fragment";
import {
  createDefaultStatItem,
  formatStatItemTitle,
  getStatItemStatus,
  STATS_SECTION_ITEM_SUBTEXT_MAX_LENGTH,
} from "@/lib/cms/sections/stats-section";
import {
  createDefaultPersonItem,
  createDefaultPersonSocialLink,
  formatPersonItemTitle,
  getPersonItemStatus,
  TEAM_PERSON_BIO_MAX_LENGTH,
  TEAM_PERSON_SOCIAL_PLATFORMS,
} from "@/lib/cms/sections/team-section";
import {
  createDefaultQuoteItem,
  formatQuoteItemTitle,
  getQuoteItemStatus,
  TESTIMONIALS_QUOTE_MAX_LENGTH,
} from "@/lib/cms/sections/testimonials-section";
import {
  createDefaultPriceTier,
  formatPricingTierTitle,
  getPricingTierStatus,
  PRICING_MAX_TIERS,
  PRICING_TIER_DESCRIPTION_MAX_LENGTH,
  PRICING_TIER_INTERVAL_OPTIONS,
} from "@/lib/cms/sections/pricing-section";
import styles from "./BlockEditor.module.css";

function getFieldSourceValue(block, key) {
  if (key === "variant") return block?.variant;
  return block?.props?.[key];
}

function matchesCondition(block, condition) {
  if (!condition || typeof condition !== "object") return true;
  const key = String(condition.key || "").trim();
  if (!key) return true;

  const value = getFieldSourceValue(block, key);
  if ("equals" in condition) {
    return value === condition.equals;
  }
  if ("notEquals" in condition) {
    return value !== condition.notEquals;
  }
  if (Array.isArray(condition.in)) {
    return condition.in.includes(value);
  }
  return true;
}

function matchesAnyCondition(block, conditionOrConditions) {
  if (!conditionOrConditions) return true;
  if (Array.isArray(conditionOrConditions)) {
    if (!conditionOrConditions.length) return true;
    return conditionOrConditions.some((condition) => matchesCondition(block, condition));
  }
  return matchesCondition(block, conditionOrConditions);
}

function matchesOptionalCondition(block, conditionOrConditions) {
  if (!conditionOrConditions) return false;
  return matchesAnyCondition(block, conditionOrConditions);
}

function getGridItemTitle(item = {}, index = 0) {
  const title = String(item?.title || "").trim();
  return title || `Item ${index + 1}`;
}

function getGridItemStatus(item = {}, index = 0) {
  const missing = evaluateCardItemReadiness(item, index);
  if (missing.length) {
    return { label: `Fields required (${missing.length})`, tone: "danger" };
  }
  return { label: "Ready", tone: "success" };
}

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

  const normalizedGroupedSchema = groupedSchema
    .map((group) => ({
      ...group,
      fields: (group.fields || []).filter((field) => {
        if (Array.isArray(field.variants) && field.variants.length) {
          const matchesVariant = field.variants.includes(block.variant);
          if (!matchesVariant) return false;
        }
        return matchesAnyCondition(block, field.visibleWhen);
      }),
    }))
    .filter((group) => group.fields.length > 0);

  const defaultOpenGroup = normalizedGroupedSchema
    .filter((group) => group.defaultOpen)
    .map((group) => group.key)[0] || normalizedGroupedSchema[0]?.key || "";

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

    if (field.type === "card-items") {
      const items = Array.isArray(block.props?.[field.key]) ? block.props[field.key] : [];
      return (
        <RepeatableListEditor
          title={field.label}
          addLabel="Add item"
          items={items}
          onCreateItem={createDefaultCardItem}
          onChange={(nextItems) => updateProp(field.key, nextItems)}
          removeTitle="Remove card item?"
          removeMessage="This will remove the card item from the section."
          getItemTitle={getGridItemTitle}
          getItemStatus={getGridItemStatus}
          renderItemFields={({ item, index, onChange: onItemChange }) => {
            const media = item.media && typeof item.media === "object"
              ? item.media
              : { imageMediaId: "", alt: "" };
            const badge = item.badge && typeof item.badge === "object" ? item.badge : null;

            return (
              <>
                <Field id={`${block.id}-${field.key}-${index}-title`} label="Title" required>
                  <Input
                    id={`${block.id}-${field.key}-${index}-title`}
                    value={item.title || ""}
                    onChange={(event) => onItemChange({ ...item, title: event.target.value })}
                  />
                </Field>
                <Field
                  id={`${block.id}-${field.key}-${index}-description`}
                  label="Description"
                  hint="Optional supporting description."
                >
                  <Textarea
                    id={`${block.id}-${field.key}-${index}-description`}
                    value={item.description || ""}
                    maxLength={CARD_ITEM_DESCRIPTION_MAX_LENGTH}
                    onChange={(event) => onItemChange({ ...item, description: event.target.value })}
                  />
                  <p className={styles.counter}>
                    {String(item.description || "").length}/{CARD_ITEM_DESCRIPTION_MAX_LENGTH}
                  </p>
                </Field>

                <Field id={`${block.id}-${field.key}-${index}-imageMediaId`} label="Image media ID">
                  <div className={styles.mediaField}>
                    <Input
                      id={`${block.id}-${field.key}-${index}-imageMediaId`}
                      value={media.imageMediaId || ""}
                      onChange={(event) =>
                        onItemChange({
                          ...item,
                          media: { ...media, imageMediaId: event.target.value },
                        })}
                      placeholder="media_xxx"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        onOpenMediaLibrary?.({
                          blockId: block.id,
                          fieldKey: field.key,
                          fieldPath: `${field.key}.${index}.media.imageMediaId`,
                          multiple: false,
                        })}
                    >
                      Select media
                    </Button>
                  </div>
                </Field>

                {media.imageMediaId ? (
                  <Field id={`${block.id}-${field.key}-${index}-alt`} label="Alt text" required>
                    <Input
                      id={`${block.id}-${field.key}-${index}-alt`}
                      value={media.alt || ""}
                      onChange={(event) =>
                        onItemChange({
                          ...item,
                          media: { ...media, alt: event.target.value },
                        })}
                    />
                  </Field>
                ) : null}

                <div className={styles.ctaActions}>
                  {!badge ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          badge: { text: "", tone: "neutral" },
                        })}
                    >
                      Add badge
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          badge: null,
                        })}
                    >
                      Remove badge
                    </Button>
                  )}
                </div>

                {badge ? (
                  <>
                    <Field id={`${block.id}-${field.key}-${index}-badge-text`} label="Badge text" required>
                      <Input
                        id={`${block.id}-${field.key}-${index}-badge-text`}
                        value={badge.text || ""}
                        onChange={(event) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, text: event.target.value },
                          })}
                      />
                    </Field>
                    <Field id={`${block.id}-${field.key}-${index}-badge-tone`} label="Badge tone">
                      <Select
                        id={`${block.id}-${field.key}-${index}-badge-tone`}
                        value={badge.tone || "neutral"}
                        options={[
                          { value: "neutral", label: "Neutral" },
                          { value: "brand", label: "Brand" },
                          { value: "success", label: "Success" },
                          { value: "warning", label: "Warning" },
                          { value: "danger", label: "Danger" },
                        ]}
                        onChange={(nextTone) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, tone: nextTone },
                          })}
                      />
                    </Field>
                  </>
                ) : null}
              </>
            );
          }}
        />
      );
    }

    if (field.type === "stats-items") {
      const items = Array.isArray(block.props?.[field.key]) ? block.props[field.key] : [];
      return (
        <RepeatableListEditor
          title={field.label}
          addLabel="Add item"
          items={items}
          onCreateItem={createDefaultStatItem}
          onChange={(nextItems) => updateProp(field.key, nextItems)}
          removeTitle="Remove stat item?"
          removeMessage="This will remove the stat item from the section."
          getItemTitle={formatStatItemTitle}
          getItemStatus={getStatItemStatus}
          renderItemFields={({ item, index, onChange: onItemChange }) => {
            const icon = item.icon && typeof item.icon === "object" ? item.icon : null;
            const badge = item.badge && typeof item.badge === "object" ? item.badge : null;

            return (
              <>
                <Field id={`${block.id}-${field.key}-${index}-label`} label="Label" required>
                  <Input
                    id={`${block.id}-${field.key}-${index}-label`}
                    value={item.label || ""}
                    onChange={(event) => onItemChange({ ...item, label: event.target.value })}
                  />
                </Field>
                <Field
                  id={`${block.id}-${field.key}-${index}-value`}
                  label="Value"
                  required
                  hint="Examples: 2.4k, 96%, £2m."
                >
                  <Input
                    id={`${block.id}-${field.key}-${index}-value`}
                    value={item.value || ""}
                    onChange={(event) => onItemChange({ ...item, value: event.target.value })}
                  />
                </Field>
                <Field
                  id={`${block.id}-${field.key}-${index}-subtext`}
                  label="Subtext"
                  hint="Optional supporting context."
                >
                  <Textarea
                    id={`${block.id}-${field.key}-${index}-subtext`}
                    value={item.subtext || ""}
                    maxLength={STATS_SECTION_ITEM_SUBTEXT_MAX_LENGTH}
                    onChange={(event) => onItemChange({ ...item, subtext: event.target.value })}
                  />
                  <p className={styles.counter}>
                    {String(item.subtext || "").length}/{STATS_SECTION_ITEM_SUBTEXT_MAX_LENGTH}
                  </p>
                </Field>

                <div className={styles.ctaActions}>
                  {!icon ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          icon: { name: "", tone: "neutral" },
                        })}
                    >
                      Add icon
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          icon: null,
                        })}
                    >
                      Remove icon
                    </Button>
                  )}
                </div>

                {icon ? (
                  <>
                    <Field
                      id={`${block.id}-${field.key}-${index}-icon-name`}
                      label="Icon name"
                      required
                      hint="Material Symbols name, e.g. groups."
                    >
                      <Input
                        id={`${block.id}-${field.key}-${index}-icon-name`}
                        value={icon.name || ""}
                        onChange={(event) =>
                          onItemChange({
                            ...item,
                            icon: { ...icon, name: event.target.value },
                          })}
                      />
                    </Field>
                    <Field id={`${block.id}-${field.key}-${index}-icon-tone`} label="Icon tone">
                      <Select
                        id={`${block.id}-${field.key}-${index}-icon-tone`}
                        value={icon.tone || "neutral"}
                        options={[
                          { value: "neutral", label: "Neutral" },
                          { value: "brand", label: "Brand" },
                          { value: "success", label: "Success" },
                          { value: "warning", label: "Warning" },
                          { value: "danger", label: "Danger" },
                        ]}
                        onChange={(nextTone) =>
                          onItemChange({
                            ...item,
                            icon: { ...icon, tone: nextTone },
                          })}
                      />
                    </Field>
                  </>
                ) : null}

                <div className={styles.ctaActions}>
                  {!badge ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          badge: { text: "", tone: "neutral" },
                        })}
                    >
                      Add badge
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          badge: null,
                        })}
                    >
                      Remove badge
                    </Button>
                  )}
                </div>

                {badge ? (
                  <>
                    <Field id={`${block.id}-${field.key}-${index}-badge-text`} label="Badge text" required>
                      <Input
                        id={`${block.id}-${field.key}-${index}-badge-text`}
                        value={badge.text || ""}
                        onChange={(event) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, text: event.target.value },
                          })}
                      />
                    </Field>
                    <Field id={`${block.id}-${field.key}-${index}-badge-tone`} label="Badge tone">
                      <Select
                        id={`${block.id}-${field.key}-${index}-badge-tone`}
                        value={badge.tone || "neutral"}
                        options={[
                          { value: "neutral", label: "Neutral" },
                          { value: "brand", label: "Brand" },
                          { value: "success", label: "Success" },
                          { value: "warning", label: "Warning" },
                          { value: "danger", label: "Danger" },
                        ]}
                        onChange={(nextTone) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, tone: nextTone },
                          })}
                      />
                    </Field>
                  </>
                ) : null}
              </>
            );
          }}
        />
      );
    }

    if (field.type === "person-items") {
      const items = Array.isArray(block.props?.[field.key]) ? block.props[field.key] : [];
      return (
        <RepeatableListEditor
          title={field.label}
          addLabel="Add member"
          items={items}
          onCreateItem={createDefaultPersonItem}
          onChange={(nextItems) => updateProp(field.key, nextItems)}
          removeTitle="Remove team member?"
          removeMessage="This will remove the team member from the section."
          getItemTitle={formatPersonItemTitle}
          getItemStatus={getPersonItemStatus}
          renderItemFields={({ item, index, onChange: onItemChange }) => {
            const avatar = item.avatar && typeof item.avatar === "object"
              ? item.avatar
              : { imageMediaId: "", alt: "" };
            const badge = item.badge && typeof item.badge === "object" ? item.badge : null;
            const socialLinks = Array.isArray(item.socialLinks) ? item.socialLinks : [];

            const addSocialLink = () => {
              if (socialLinks.length >= 3) return;
              onItemChange({
                ...item,
                socialLinks: [...socialLinks, createDefaultPersonSocialLink()],
              });
            };

            const updateSocialLink = (linkIndex, patch) => {
              const nextLinks = socialLinks.map((socialLink, currentIndex) =>
                currentIndex === linkIndex ? { ...socialLink, ...patch } : socialLink
              );
              onItemChange({ ...item, socialLinks: nextLinks });
            };

            const removeSocialLink = (linkIndex) => {
              const nextLinks = socialLinks.filter((_, currentIndex) => currentIndex !== linkIndex);
              onItemChange({ ...item, socialLinks: nextLinks });
            };

            return (
              <>
                <Field id={`${block.id}-${field.key}-${index}-name`} label="Name" required>
                  <Input
                    id={`${block.id}-${field.key}-${index}-name`}
                    value={item.name || ""}
                    onChange={(event) => onItemChange({ ...item, name: event.target.value })}
                  />
                </Field>
                <Field id={`${block.id}-${field.key}-${index}-role`} label="Role">
                  <Input
                    id={`${block.id}-${field.key}-${index}-role`}
                    value={item.role || ""}
                    onChange={(event) => onItemChange({ ...item, role: event.target.value })}
                  />
                </Field>
                <Field
                  id={`${block.id}-${field.key}-${index}-bio`}
                  label="Bio"
                  hint="Optional supporting bio."
                >
                  <Textarea
                    id={`${block.id}-${field.key}-${index}-bio`}
                    value={item.bio || ""}
                    maxLength={TEAM_PERSON_BIO_MAX_LENGTH}
                    onChange={(event) => onItemChange({ ...item, bio: event.target.value })}
                  />
                  <p className={styles.counter}>
                    {String(item.bio || "").length}/{TEAM_PERSON_BIO_MAX_LENGTH}
                  </p>
                </Field>

                <Field id={`${block.id}-${field.key}-${index}-avatar-imageMediaId`} label="Avatar media ID">
                  <div className={styles.mediaField}>
                    <Input
                      id={`${block.id}-${field.key}-${index}-avatar-imageMediaId`}
                      value={avatar.imageMediaId || ""}
                      onChange={(event) =>
                        onItemChange({
                          ...item,
                          avatar: { ...avatar, imageMediaId: event.target.value },
                        })}
                      placeholder="media_xxx"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        onOpenMediaLibrary?.({
                          blockId: block.id,
                          fieldKey: field.key,
                          fieldPath: `${field.key}.${index}.avatar.imageMediaId`,
                          multiple: false,
                        })}
                    >
                      Select media
                    </Button>
                  </div>
                </Field>

                {avatar.imageMediaId ? (
                  <Field id={`${block.id}-${field.key}-${index}-avatar-alt`} label="Avatar alt text" required>
                    <Input
                      id={`${block.id}-${field.key}-${index}-avatar-alt`}
                      value={avatar.alt || ""}
                      onChange={(event) =>
                        onItemChange({
                          ...item,
                          avatar: { ...avatar, alt: event.target.value },
                        })}
                    />
                  </Field>
                ) : null}

                <div className={styles.ctaActions}>
                  {!badge ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          badge: { text: "", tone: "neutral" },
                        })}
                    >
                      Add badge
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      onClick={() => onItemChange({ ...item, badge: null })}
                    >
                      Remove badge
                    </Button>
                  )}
                </div>

                {badge ? (
                  <>
                    <Field id={`${block.id}-${field.key}-${index}-badge-text`} label="Badge text" required>
                      <Input
                        id={`${block.id}-${field.key}-${index}-badge-text`}
                        value={badge.text || ""}
                        onChange={(event) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, text: event.target.value },
                          })}
                      />
                    </Field>
                    <Field id={`${block.id}-${field.key}-${index}-badge-tone`} label="Badge tone">
                      <Select
                        id={`${block.id}-${field.key}-${index}-badge-tone`}
                        value={badge.tone || "neutral"}
                        options={[
                          { value: "neutral", label: "Neutral" },
                          { value: "brand", label: "Brand" },
                          { value: "success", label: "Success" },
                          { value: "warning", label: "Warning" },
                          { value: "danger", label: "Danger" },
                        ]}
                        onChange={(nextTone) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, tone: nextTone },
                          })}
                      />
                    </Field>
                  </>
                ) : null}

                <div className={styles.ctaActions}>
                  {!socialLinks.length ? (
                    <Button type="button" variant="secondary" size="sm" onClick={addSocialLink}>
                      Add social links
                    </Button>
                  ) : (
                    <>
                      <Button type="button" variant="secondary" size="sm" onClick={addSocialLink} disabled={socialLinks.length >= 3}>
                        Add social link
                      </Button>
                      <Button
                        type="button"
                        variant="tertiary"
                        size="sm"
                        onClick={() => onItemChange({ ...item, socialLinks: [] })}
                      >
                        Remove social links
                      </Button>
                    </>
                  )}
                </div>

                {socialLinks.length ? (
                  <div className={styles.nestedList}>
                    {socialLinks.map((socialLink, linkIndex) => (
                      <div key={socialLink.id || `${block.id}-${field.key}-${index}-social-${linkIndex}`} className={styles.nestedCard}>
                        <div className={styles.nestedHeader}>
                          <strong>{`Social link ${linkIndex + 1}`}</strong>
                          <Button
                            type="button"
                            size="sm"
                            variant="tertiary"
                            intent="danger"
                            icon="delete"
                            ariaLabel={`Remove social link ${linkIndex + 1}`}
                            onClick={() => removeSocialLink(linkIndex)}
                          />
                        </div>

                        <Field id={`${block.id}-${field.key}-${index}-social-${linkIndex}-platform`} label="Platform" required>
                          <Select
                            id={`${block.id}-${field.key}-${index}-social-${linkIndex}-platform`}
                            value={socialLink.platform || "x"}
                            options={TEAM_PERSON_SOCIAL_PLATFORMS.map((platform) => ({
                              value: platform,
                              label: platform,
                            }))}
                            onChange={(nextPlatform) => updateSocialLink(linkIndex, { platform: nextPlatform })}
                          />
                        </Field>
                        <Field
                          id={`${block.id}-${field.key}-${index}-social-${linkIndex}-href`}
                          label="Profile URL"
                          required
                          hint="Must start with https://"
                        >
                          <Input
                            id={`${block.id}-${field.key}-${index}-social-${linkIndex}-href`}
                            value={socialLink.href || ""}
                            onChange={(event) => updateSocialLink(linkIndex, { href: event.target.value })}
                            placeholder="https://"
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            );
          }}
        />
      );
    }

    if (field.type === "quote-items") {
      const items = Array.isArray(block.props?.[field.key]) ? block.props[field.key] : [];
      return (
        <RepeatableListEditor
          title={field.label}
          addLabel="Add testimonial"
          items={items}
          onCreateItem={createDefaultQuoteItem}
          onChange={(nextItems) => updateProp(field.key, nextItems)}
          removeTitle="Remove testimonial?"
          removeMessage="This will remove the testimonial from the section."
          getItemTitle={formatQuoteItemTitle}
          getItemStatus={getQuoteItemStatus}
          renderItemFields={({ item, index, onChange: onItemChange }) => {
            const avatar = item.avatar && typeof item.avatar === "object"
              ? item.avatar
              : { imageMediaId: "", alt: "" };
            const badge = item.badge && typeof item.badge === "object" ? item.badge : null;

            return (
              <>
                <Field
                  id={`${block.id}-${field.key}-${index}-quote`}
                  label="Quote"
                  required
                >
                  <Textarea
                    id={`${block.id}-${field.key}-${index}-quote`}
                    value={item.quote || ""}
                    maxLength={TESTIMONIALS_QUOTE_MAX_LENGTH}
                    onChange={(event) => onItemChange({ ...item, quote: event.target.value })}
                  />
                  <p className={styles.counter}>
                    {String(item.quote || "").length}/{TESTIMONIALS_QUOTE_MAX_LENGTH}
                  </p>
                </Field>
                <Field id={`${block.id}-${field.key}-${index}-authorName`} label="Author name">
                  <Input
                    id={`${block.id}-${field.key}-${index}-authorName`}
                    value={item.authorName || ""}
                    onChange={(event) => onItemChange({ ...item, authorName: event.target.value })}
                  />
                </Field>
                <Field id={`${block.id}-${field.key}-${index}-authorRole`} label="Author role">
                  <Input
                    id={`${block.id}-${field.key}-${index}-authorRole`}
                    value={item.authorRole || ""}
                    onChange={(event) => onItemChange({ ...item, authorRole: event.target.value })}
                  />
                </Field>
                <Field id={`${block.id}-${field.key}-${index}-authorOrg`} label="Author organization">
                  <Input
                    id={`${block.id}-${field.key}-${index}-authorOrg`}
                    value={item.authorOrg || ""}
                    onChange={(event) => onItemChange({ ...item, authorOrg: event.target.value })}
                  />
                </Field>

                <Field id={`${block.id}-${field.key}-${index}-avatar-imageMediaId`} label="Avatar media ID">
                  <div className={styles.mediaField}>
                    <Input
                      id={`${block.id}-${field.key}-${index}-avatar-imageMediaId`}
                      value={avatar.imageMediaId || ""}
                      onChange={(event) =>
                        onItemChange({
                          ...item,
                          avatar: { ...avatar, imageMediaId: event.target.value },
                        })}
                      placeholder="media_xxx"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        onOpenMediaLibrary?.({
                          blockId: block.id,
                          fieldKey: field.key,
                          fieldPath: `${field.key}.${index}.avatar.imageMediaId`,
                          multiple: false,
                        })}
                    >
                      Select media
                    </Button>
                  </div>
                </Field>

                {avatar.imageMediaId ? (
                  <Field id={`${block.id}-${field.key}-${index}-avatar-alt`} label="Avatar alt text" required>
                    <Input
                      id={`${block.id}-${field.key}-${index}-avatar-alt`}
                      value={avatar.alt || ""}
                      onChange={(event) =>
                        onItemChange({
                          ...item,
                          avatar: { ...avatar, alt: event.target.value },
                        })}
                    />
                  </Field>
                ) : null}

                <div className={styles.ctaActions}>
                  {!badge ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onItemChange({
                          ...item,
                          badge: { text: "", tone: "neutral" },
                        })}
                    >
                      Add badge
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      onClick={() => onItemChange({ ...item, badge: null })}
                    >
                      Remove badge
                    </Button>
                  )}
                </div>

                {badge ? (
                  <>
                    <Field id={`${block.id}-${field.key}-${index}-badge-text`} label="Badge text" required>
                      <Input
                        id={`${block.id}-${field.key}-${index}-badge-text`}
                        value={badge.text || ""}
                        onChange={(event) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, text: event.target.value },
                          })}
                      />
                    </Field>
                    <Field id={`${block.id}-${field.key}-${index}-badge-tone`} label="Badge tone">
                      <Select
                        id={`${block.id}-${field.key}-${index}-badge-tone`}
                        value={badge.tone || "neutral"}
                        options={[
                          { value: "neutral", label: "Neutral" },
                          { value: "brand", label: "Brand" },
                          { value: "success", label: "Success" },
                          { value: "warning", label: "Warning" },
                          { value: "danger", label: "Danger" },
                        ]}
                        onChange={(nextTone) =>
                          onItemChange({
                            ...item,
                            badge: { ...badge, tone: nextTone },
                          })}
                      />
                    </Field>
                  </>
                ) : null}
              </>
            );
          }}
        />
      );
    }

    if (field.type === "pricing-tier-items") {
      const items = Array.isArray(block.props?.[field.key]) ? block.props[field.key] : [];
      return (
        <PricingTierEditor
          items={items}
          onChange={(nextItems) => updateProp(field.key, nextItems)}
          onCreateItem={createDefaultPriceTier}
          getItemTitle={formatPricingTierTitle}
          getItemStatus={getPricingTierStatus}
          maxItems={PRICING_MAX_TIERS}
          descriptionMaxLength={PRICING_TIER_DESCRIPTION_MAX_LENGTH}
          intervalOptions={PRICING_TIER_INTERVAL_OPTIONS}
        />
      );
    }

    if (field.type === "variant-select") {
      return (
        <Field
          key={field.key}
          id={`${block.id}-${field.key}`}
          label={field.label}
          hint={field.hint}
          required={field.required}
        >
          <Select
            id={`${block.id}-${field.key}`}
            value={block.variant || ""}
            options={field.options || []}
            onChange={(nextVariant) => onChange?.({ ...block, variant: nextVariant })}
            placeholder="Choose variant"
          />
        </Field>
      );
    }

    if (field.type === "media-ref") {
      const media = block.props?.[field.key] && typeof block.props?.[field.key] === "object"
        ? block.props[field.key]
        : { mediaId: "", kind: "image", alt: "", posterMediaId: "", aspect: "auto" };
      const requireMedia = Array.isArray(field.requiredForVariants)
        ? field.requiredForVariants.includes(block.variant) || matchesOptionalCondition(block, field.requiredWhen)
        : matchesOptionalCondition(block, field.requiredWhen);

      const updateMedia = (patch) => {
        updateProp(field.key, { ...media, ...patch });
      };

      return (
        <div className={styles.mediaRefGroup}>
          <Field
            id={`${block.id}-${field.key}-mediaId`}
            label="Media ID"
            required={requireMedia}
          >
            <div className={styles.mediaField}>
              <Input
                id={`${block.id}-${field.key}-mediaId`}
                value={media.mediaId || ""}
                onChange={(event) => updateMedia({ mediaId: event.target.value })}
                placeholder="media_xxx"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  onOpenMediaLibrary?.({
                    blockId: block.id,
                    fieldKey: field.key,
                    fieldPath: `${field.key}.mediaId`,
                    multiple: false,
                  })}
              >
                Select media
              </Button>
            </div>
          </Field>

          <Field id={`${block.id}-${field.key}-kind`} label="Media type">
            <Select
              id={`${block.id}-${field.key}-kind`}
              value={media.kind || "image"}
              options={[
                { value: "image", label: "Image" },
                { value: "video", label: "Video" },
              ]}
              onChange={(nextKind) => updateMedia({ kind: nextKind })}
              placeholder="Choose type"
            />
          </Field>

          <Field id={`${block.id}-${field.key}-alt`} label="Alt text" required={Boolean(media.mediaId)}>
            <Input
              id={`${block.id}-${field.key}-alt`}
              value={media.alt || ""}
              onChange={(event) => updateMedia({ alt: event.target.value })}
              placeholder="Describe this media"
            />
          </Field>

          {media.kind === "video" ? (
            <Field
              id={`${block.id}-${field.key}-poster`}
              label="Poster media ID"
              hint="Recommended for video."
            >
              <div className={styles.mediaField}>
                <Input
                  id={`${block.id}-${field.key}-poster`}
                  value={media.posterMediaId || ""}
                  onChange={(event) => updateMedia({ posterMediaId: event.target.value })}
                  placeholder="media_xxx"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    onOpenMediaLibrary?.({
                      blockId: block.id,
                      fieldKey: field.key,
                      fieldPath: `${field.key}.posterMediaId`,
                      multiple: false,
                    })}
                >
                  Select poster
                </Button>
              </div>
            </Field>
          ) : null}

          <Field id={`${block.id}-${field.key}-aspect`} label="Aspect ratio">
            <Select
              id={`${block.id}-${field.key}-aspect`}
              value={media.aspect || "auto"}
              options={[
                { value: "auto", label: "Auto" },
                { value: "16:9", label: "16:9" },
                { value: "4:3", label: "4:3" },
                { value: "1:1", label: "1:1" },
              ]}
              onChange={(nextAspect) => updateMedia({ aspect: nextAspect })}
              placeholder="Choose aspect"
            />
          </Field>
        </div>
      );
    }

    const value = block.props?.[field.key] || "";

    return (
      <Field
        key={field.key}
        id={`${block.id}-${field.key}`}
        label={field.label}
        hint={field.hint}
        required={field.required}
      >
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
        type="single"
        defaultOpen={defaultOpenGroup}
        items={normalizedGroupedSchema.map((group) => ({
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
