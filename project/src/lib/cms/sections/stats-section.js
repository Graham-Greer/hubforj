import { createSectionHeaderFragment } from "../fragments/section-header-fragment.js";
import {
  evaluateCtaGroupReadiness,
  normalizeCtaGroup,
} from "../fragments/cta-group-fragment.js";
import { normalizeGridLayoutFragment } from "../fragments/grid-layout-fragment.js";
import {
  STATS_ITEM_SUBTEXT_MAX_LENGTH,
  createDefaultStatItem,
  evaluateStatItemReadiness,
  normalizeStatItems,
} from "../fragments/stats-item-fragment.js";
import { normalizeText } from "../fragments/shared.js";

const STATS_DESCRIPTION_MAX_LENGTH = 180;

const headerFragment = createSectionHeaderFragment({
  titleRequired: false,
  descriptionMaxLength: STATS_DESCRIPTION_MAX_LENGTH,
});

function normalizeStatsLayoutFragment(value = {}) {
  const layout = normalizeGridLayoutFragment(value);
  return {
    columns: layout.columns,
    align: layout.align,
    density: layout.density,
  };
}

export function normalizeStatsSectionProps(props) {
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
  const header = headerFragment.normalizeHeaderFields(value);
  const ctas = normalizeCtaGroup(value.ctas, {
    label: value.ctaText,
    href: value.ctaHref,
  });
  if (ctas.length > 2) {
    throw new Error("StatsSection.ctas supports up to two items.");
  }

  return {
    ...header,
    ...normalizeStatsLayoutFragment(value),
    ctas,
    items: normalizeStatItems(value.items),
  };
}

export function evaluateStatsSectionReadiness(rawProps) {
  const props = normalizeStatsSectionProps(rawProps);
  const draftMissing = [];

  if (!props.items.length) {
    draftMissing.push("Add at least one stat item.");
  }

  props.items.forEach((item, index) => {
    draftMissing.push(...evaluateStatItemReadiness(item, index));
  });

  const publishMissing = [...draftMissing, ...evaluateCtaGroupReadiness(props.ctas)];

  return {
    readyForDraft: draftMissing.length === 0,
    readyForPublish: publishMissing.length === 0,
    missingRequiredFields: publishMissing,
    missingCount: publishMissing.length,
  };
}

export const STATS_SECTION_SCHEMA = [
  {
    key: "core",
    type: "group",
    label: "Core",
    defaultOpen: true,
    fields: [
      {
        key: "variant",
        label: "Variant",
        type: "variant-select",
        required: true,
      },
      ...headerFragment.editorFields.map((field) => ({
        ...field,
        ...(field.key === "description"
          ? {
            hint: "Maximum 180 characters.",
          }
          : {}),
      })),
    ],
  },
  {
    key: "items",
    type: "group",
    label: "Items",
    defaultOpen: false,
    fields: [
      {
        key: "items",
        label: "Stat items",
        type: "stats-items",
      },
    ],
  },
  {
    key: "actions",
    type: "group",
    label: "Actions",
    defaultOpen: false,
    fields: [{ key: "ctas", label: "Calls to action", type: "ctas" }],
  },
  {
    key: "advanced",
    type: "group",
    label: "Advanced",
    defaultOpen: false,
    fields: [
      {
        key: "columns",
        label: "Columns",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
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

export const STATS_SECTION_DEFAULT_PROPS = {
  eyebrow: "",
  title: "",
  description: "",
  ctas: [],
  columns: "3",
  align: "left",
  density: "comfortable",
  items: [createDefaultStatItem()],
};

export const STATS_SECTION_PREVIEW_PROPS_BY_VARIANT = {
  cards: {
    eyebrow: "Impact",
    title: "The numbers behind our community",
    description: "Show key outcomes in concise stat cards.",
    columns: "3",
    align: "left",
    density: "comfortable",
    ctas: [],
    items: [
      {
        id: "stat_preview_1",
        label: "Active members",
        value: "2.4k",
        subtext: "Across all local hubs",
        icon: { name: "groups", tone: "brand" },
        badge: null,
      },
      {
        id: "stat_preview_2",
        label: "Annual events",
        value: "148",
        subtext: "Workshops, leagues, and showcases",
        icon: { name: "event", tone: "neutral" },
        badge: null,
      },
      {
        id: "stat_preview_3",
        label: "Retention rate",
        value: "96%",
        subtext: "Year-over-year",
        icon: { name: "trending_up", tone: "success" },
        badge: { text: "Strong", tone: "success" },
      },
    ],
  },
  split: {
    eyebrow: "By the numbers",
    title: "Trusted by members and partners",
    description: "Pair context on the left with proof points on the right.",
    columns: "2",
    align: "left",
    density: "comfortable",
    ctas: [{ label: "Read impact report", href: "/impact" }],
    items: [
      {
        id: "stat_preview_split_1",
        label: "Programs live",
        value: "18",
        subtext: "Running this season",
        icon: { name: "view_module", tone: "brand" },
        badge: null,
      },
      {
        id: "stat_preview_split_2",
        label: "Partner organisations",
        value: "42",
        subtext: "Across regional initiatives",
        icon: { name: "handshake", tone: "neutral" },
        badge: null,
      },
      {
        id: "stat_preview_split_3",
        label: "Cities served",
        value: "12",
        subtext: "With local chapter support",
        icon: { name: "location_city", tone: "neutral" },
        badge: null,
      },
      {
        id: "stat_preview_split_4",
        label: "Volunteer hours",
        value: "9.6k",
        subtext: "Last rolling 12 months",
        icon: { name: "favorite", tone: "danger" },
        badge: { text: "Growing", tone: "brand" },
      },
    ],
  },
};

export const STATS_SECTION_DESCRIPTION_MAX_LENGTH = STATS_DESCRIPTION_MAX_LENGTH;
export const STATS_SECTION_ITEM_SUBTEXT_MAX_LENGTH = STATS_ITEM_SUBTEXT_MAX_LENGTH;

export function formatStatItemTitle(item = {}, index = 0) {
  const value = normalizeText(item.value);
  const label = normalizeText(item.label);

  if (value && label) return `${value} - ${label}`;
  if (label) return label;
  if (value) return value;
  return `Item ${index + 1}`;
}

export function getStatItemStatus(item = {}, index = 0) {
  const missing = evaluateStatItemReadiness(item, index);
  if (missing.length) {
    return { label: `Fields required (${missing.length})`, tone: "danger" };
  }
  return { label: "Ready", tone: "success" };
}

export { createDefaultStatItem };
