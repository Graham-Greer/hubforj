import { createSectionHeaderFragment } from "../fragments/section-header-fragment.js";
import { normalizeGridLayoutFragment } from "../fragments/grid-layout-fragment.js";
import {
  CARD_ITEM_DESCRIPTION_MAX_LENGTH,
  createDefaultCardItem,
  evaluateCardItemReadiness,
  extractCardItemMediaRefs,
  normalizeCardItems,
} from "../fragments/card-item-fragment.js";
import { normalizeText } from "../fragments/shared.js";

const GRID_DESCRIPTION_MAX_LENGTH = 240;

const headerFragment = createSectionHeaderFragment({
  titleRequired: false,
  descriptionMaxLength: GRID_DESCRIPTION_MAX_LENGTH,
});

export function normalizeGridSectionProps(props) {
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
  const header = headerFragment.normalizeHeaderFields(value);
  const layout = normalizeGridLayoutFragment(value);
  const items = normalizeCardItems(value.items);

  return {
    ...header,
    ...layout,
    items,
  };
}

export function evaluateGridSectionReadiness(rawProps) {
  const props = normalizeGridSectionProps(rawProps);
  const missing = [];

  if (!props.items.length) {
    missing.push("Add at least one card item.");
  }

  props.items.forEach((item, index) => {
    missing.push(...evaluateCardItemReadiness(item, index));
  });

  return {
    readyForDraft: missing.length === 0,
    readyForPublish: missing.length === 0,
    missingRequiredFields: missing,
    missingCount: missing.length,
  };
}

export function extractGridSectionMediaRefs(rawProps) {
  const props = normalizeGridSectionProps(rawProps);
  return props.items.flatMap((item) => extractCardItemMediaRefs(item));
}

export const GRID_SECTION_SCHEMA = [
  {
    key: "core",
    type: "group",
    label: "Core",
    defaultOpen: true,
    fields: headerFragment.editorFields.map((field) => ({
      ...field,
      ...(field.key === "description"
        ? {
          hint: "Maximum 240 characters.",
        }
        : {}),
    })),
  },
  {
    key: "items",
    type: "group",
    label: "Items",
    defaultOpen: false,
    fields: [
      {
        key: "items",
        label: "Grid items",
        type: "card-items",
      },
    ],
  },
  {
    key: "advanced",
    type: "group",
    label: "Advanced",
    defaultOpen: false,
    fields: [
      {
        key: "layout",
        label: "Layout",
        type: "select",
        options: [
          { value: "grid", label: "Grid" },
          { value: "lead", label: "Lead" },
        ],
      },
      {
        key: "columns",
        label: "Columns",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
        visibleWhen: { key: "layout", equals: "grid" },
      },
      {
        key: "align",
        label: "Align",
        type: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
        ],
      },
      {
        key: "density",
        label: "Density",
        type: "select",
        options: [
          { value: "comfortable", label: "Comfortable" },
          { value: "compact", label: "Compact" },
        ],
      },
    ],
  },
];

export const GRID_SECTION_DEFAULT_PROPS = {
  eyebrow: "",
  title: "",
  description: "",
  layout: "grid",
  columns: "3",
  align: "left",
  density: "comfortable",
  items: [createDefaultCardItem()],
};

export const GRID_SECTION_PREVIEW_PROPS_BY_VARIANT = {
  default: {
    eyebrow: "Highlights",
    title: "Everything your members need",
    description: "Show key benefits in a clean card layout.",
    layout: "grid",
    columns: "3",
    align: "left",
    density: "comfortable",
    items: [
      {
        id: "card_preview_1",
        title: "Member programs",
        description: "Weekly sessions and seasonal pathways to keep momentum.",
        media: {
          imageMediaId: "media_preview_feature",
          alt: "Members training together",
        },
        badge: {
          text: "Popular",
          tone: "brand",
        },
      },
      {
        id: "card_preview_2",
        title: "Event registration",
        description: "Simple signups with waitlist and attendance tracking.",
        media: {
          imageMediaId: "",
          alt: "",
        },
        badge: null,
      },
      {
        id: "card_preview_3",
        title: "Community insights",
        description: "Track engagement with clear admin workflows and reporting.",
        media: {
          imageMediaId: "",
          alt: "",
        },
        badge: null,
      },
    ],
  },
};

export const GRID_SECTION_DESCRIPTION_MAX_LENGTH = GRID_DESCRIPTION_MAX_LENGTH;
export const GRID_CARD_ITEM_DESCRIPTION_MAX_LENGTH = CARD_ITEM_DESCRIPTION_MAX_LENGTH;

export function getGridItemStatus(item = {}, index = 0) {
  const missing = evaluateCardItemReadiness(item, index);
  if (missing.length) {
    return { label: `Fields required (${missing.length})`, tone: "danger" };
  }
  return { label: "Ready", tone: "success" };
}

export function formatGridItemTitle(item = {}, index = 0) {
  const title = normalizeText(item.title);
  return title || `Item ${index + 1}`;
}

