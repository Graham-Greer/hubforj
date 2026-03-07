import { createSectionHeaderFragment } from "../fragments/section-header-fragment.js";
import { normalizeGridLayoutFragment } from "../fragments/grid-layout-fragment.js";
import {
  PRICE_TIER_DESCRIPTION_MAX_LENGTH,
  PRICE_TIER_INTERVALS,
  createDefaultPriceTier,
  createDefaultPriceTierFeature,
  evaluatePriceTierReadiness,
  normalizePriceTiers,
} from "../fragments/price-tier-fragment.js";
import { normalizeText } from "../fragments/shared.js";
import { reorderItemsByIds } from "../editor-interactions.js";

const PRICING_DESCRIPTION_MAX_LENGTH = 240;
const MIN_TIER_COUNT = 1;
const MAX_TIER_COUNT = 4;

const headerFragment = createSectionHeaderFragment({
  titleRequired: false,
  descriptionMaxLength: PRICING_DESCRIPTION_MAX_LENGTH,
});

function normalizePricingLayoutFragment(value = {}) {
  const layout = normalizeGridLayoutFragment(value);
  const columns = Number.parseInt(layout.columns, 10);
  const clamped = Number.isFinite(columns) ? Math.min(Math.max(columns, 1), 4) : 3;
  return {
    columns: String(clamped),
    align: layout.align,
    density: layout.density,
  };
}

export function normalizePricingSectionProps(props, variant = "tiers") {
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
  const header = headerFragment.normalizeHeaderFields(value);

  return {
    ...header,
    ...normalizePricingLayoutFragment(value),
    variant: "tiers",
    items: normalizePriceTiers(value.items),
  };
}

export function evaluatePricingSectionReadiness(rawProps, variant = "tiers") {
  const props = normalizePricingSectionProps(rawProps, variant);
  const draftMissing = [];
  const publishMissing = [];

  if (props.items.length < MIN_TIER_COUNT) {
    const issue = "Add at least one pricing tier.";
    draftMissing.push(issue);
    publishMissing.push(issue);
  }
  if (props.items.length > MAX_TIER_COUNT) {
    const issue = "Pricing supports up to four tiers.";
    draftMissing.push(issue);
    publishMissing.push(issue);
  }

  props.items.forEach((tier, index) => {
    const tierIssues = evaluatePriceTierReadiness(tier, index);
    draftMissing.push(...tierIssues);
    publishMissing.push(...tierIssues);

    if (!Array.isArray(tier.features) || !tier.features.length) {
      publishMissing.push(`Tier ${index + 1}: add at least one feature.`);
    }
  });

  return {
    readyForDraft: draftMissing.length === 0,
    readyForPublish: publishMissing.length === 0,
    missingRequiredFields: publishMissing,
    missingCount: publishMissing.length,
  };
}

export const PRICING_SECTION_SCHEMA = [
  {
    key: "core",
    type: "group",
    label: "Core",
    defaultOpen: true,
    fields: [
      ...headerFragment.editorFields.map((field) => ({
        ...field,
        ...(field.key === "description"
          ? {
            hint: "Maximum 240 characters.",
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
        label: "Pricing tiers",
        type: "pricing-tier-items",
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
        key: "columns",
        label: "Columns",
        type: "select",
        options: [
          { value: "1", label: "1" },
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

export const PRICING_SECTION_DEFAULT_PROPS = {
  eyebrow: "",
  title: "",
  description: "",
  columns: "3",
  align: "left",
  density: "comfortable",
  items: [createDefaultPriceTier()],
};

export const PRICING_SECTION_PREVIEW_PROPS_BY_VARIANT = {
  tiers: {
    eyebrow: "Membership plans",
    title: "Choose your plan",
    description: "Select a pricing tier that fits your team and delivery goals.",
    columns: "3",
    align: "left",
    density: "comfortable",
    items: [
      {
        id: "tier_preview_1",
        name: "Starter",
        description: "Best for pilots and new programmes.",
        isFree: false,
        price: { amountMinor: 1900, currency: "GBP" },
        interval: "month",
        features: [
          { id: "feature_1", text: "Up to 50 active members" },
          { id: "feature_2", text: "Core CMS sections" },
        ],
        highlight: false,
        badge: null,
        cta: { id: "cta_1", label: "Get started", href: "/join" },
      },
      {
        id: "tier_preview_2",
        name: "Growth",
        description: "For scaling teams with multiple programmes.",
        isFree: false,
        price: { amountMinor: 4900, currency: "GBP" },
        interval: "month",
        features: [
          { id: "feature_3", text: "Up to 300 active members" },
          { id: "feature_4", text: "Priority support" },
        ],
        highlight: true,
        badge: { text: "Best value", tone: "brand" },
        cta: { id: "cta_2", label: "Choose Growth", href: "/join" },
      },
      {
        id: "tier_preview_3",
        name: "Enterprise",
        description: "Custom rollout and governance support.",
        isFree: false,
        price: { amountMinor: 0, currency: "GBP" },
        interval: "once",
        features: [
          { id: "feature_5", text: "Custom onboarding" },
          { id: "feature_6", text: "Dedicated success lead" },
        ],
        highlight: false,
        badge: null,
        cta: { id: "cta_3", label: "Contact sales", href: "/contact" },
      },
    ],
  },
};

export const PRICING_SECTION_DESCRIPTION_MAX_LENGTH = PRICING_DESCRIPTION_MAX_LENGTH;
export const PRICING_TIER_DESCRIPTION_MAX_LENGTH = PRICE_TIER_DESCRIPTION_MAX_LENGTH;
export const PRICING_TIER_INTERVAL_OPTIONS = PRICE_TIER_INTERVALS;
export const PRICING_MAX_TIERS = MAX_TIER_COUNT;

export function formatPricingTierTitle(item = {}, index = 0) {
  const name = normalizeText(item.name);
  return name || `Tier ${index + 1}`;
}

export function getPricingTierStatus(item = {}, index = 0) {
  const missing = evaluatePriceTierReadiness(item, index);
  if (missing.length) {
    return { label: `Fields required (${missing.length})`, tone: "danger" };
  }
  return { label: "Ready", tone: "success" };
}

export function appendPricingTier(items = [], createItem = createDefaultPriceTier) {
  const buildTier = typeof createItem === "function" ? createItem : createDefaultPriceTier;
  if (!Array.isArray(items)) return [buildTier()];
  if (items.length >= MAX_TIER_COUNT) return items;
  return [...items, buildTier()];
}

export function removePricingTier(items = [], removeId, activeId = "") {
  const nextItems = Array.isArray(items) ? items.filter((item) => item.id !== removeId) : [];
  const resolvedActiveId = resolveActivePricingTierId(nextItems, activeId === removeId ? "" : activeId);
  return {
    items: nextItems,
    activeId: resolvedActiveId,
  };
}

export function resolveActivePricingTierId(items = [], activeId = "") {
  if (!Array.isArray(items) || !items.length) return "";
  if (activeId && items.some((item) => item.id === activeId)) return activeId;
  return items[0].id;
}

export function reorderPricingTiers(items = [], activeId, overId) {
  return reorderItemsByIds(items, activeId, overId);
}

export { createDefaultPriceTier, createDefaultPriceTierFeature };
