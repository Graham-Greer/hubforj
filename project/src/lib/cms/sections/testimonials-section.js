import { createSectionHeaderFragment } from "../fragments/section-header-fragment.js";
import { normalizeGridLayoutFragment } from "../fragments/grid-layout-fragment.js";
import {
  QUOTE_ITEM_MAX_LENGTH,
  createDefaultQuoteItem,
  evaluateQuoteItemReadiness,
  extractQuoteItemMediaRefs,
  normalizeQuoteItems,
} from "../fragments/quote-item-fragment.js";
import { normalizeText } from "../fragments/shared.js";

const TESTIMONIAL_DESCRIPTION_MAX_LENGTH = 240;

const headerFragment = createSectionHeaderFragment({
  titleRequired: false,
  descriptionMaxLength: TESTIMONIAL_DESCRIPTION_MAX_LENGTH,
});

function normalizeTestimonialsVariant(variant) {
  return normalizeText(variant) === "lead" ? "lead" : "grid";
}

function normalizeTestimonialsLayoutFragment(value = {}) {
  const layout = normalizeGridLayoutFragment(value);
  return {
    columns: layout.columns,
    align: layout.align,
    density: layout.density,
  };
}

export function normalizeTestimonialsSectionProps(props, variant = "grid") {
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
  const header = headerFragment.normalizeHeaderFields(value);

  return {
    ...header,
    ...normalizeTestimonialsLayoutFragment(value),
    variant: normalizeTestimonialsVariant(variant || value.variant),
    items: normalizeQuoteItems(value.items),
  };
}

export function evaluateTestimonialsSectionReadiness(rawProps, variant = "grid") {
  const props = normalizeTestimonialsSectionProps(rawProps, variant);
  const draftMissing = [];

  if (!props.items.length) {
    draftMissing.push("Add at least one testimonial item.");
  }

  props.items.forEach((item, index) => {
    draftMissing.push(...evaluateQuoteItemReadiness(item, index));
  });

  return {
    readyForDraft: draftMissing.length === 0,
    readyForPublish: draftMissing.length === 0,
    missingRequiredFields: draftMissing,
    missingCount: draftMissing.length,
  };
}

export function extractTestimonialsSectionMediaRefs(rawProps, variant = "grid") {
  const props = normalizeTestimonialsSectionProps(rawProps, variant);
  return props.items.flatMap((item) => extractQuoteItemMediaRefs(item));
}

export const TESTIMONIALS_SECTION_SCHEMA = [
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
        label: "Testimonials",
        type: "quote-items",
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

export const TESTIMONIALS_SECTION_DEFAULT_PROPS = {
  eyebrow: "",
  title: "",
  description: "",
  columns: "3",
  align: "left",
  density: "comfortable",
  items: [createDefaultQuoteItem()],
};

export const TESTIMONIALS_SECTION_PREVIEW_PROPS_BY_VARIANT = {
  grid: {
    eyebrow: "Testimonials",
    title: "What members say",
    description: "Proof points from community members and partners.",
    columns: "3",
    align: "left",
    density: "comfortable",
    items: [
      {
        id: "quote_preview_1",
        quote: "Program quality improved dramatically after joining this network.",
        authorName: "Casey Brown",
        authorRole: "Program Lead",
        authorOrg: "Northside Community Hub",
        avatar: {
          imageMediaId: "media_preview_testimonial_1",
          alt: "Portrait of Casey Brown",
        },
        badge: { text: "Verified", tone: "success" },
      },
      {
        id: "quote_preview_2",
        quote: "The member support team helped us onboard volunteers quickly.",
        authorName: "Morgan Lee",
        authorRole: "Operations Manager",
        authorOrg: "City Youth Collective",
        avatar: {
          imageMediaId: "",
          alt: "",
        },
        badge: null,
      },
      {
        id: "quote_preview_3",
        quote: "We now have a clear process for events, memberships, and reporting.",
        authorName: "Jordan Patel",
        authorRole: "Director",
        authorOrg: "Rise Community Trust",
        avatar: {
          imageMediaId: "",
          alt: "",
        },
        badge: null,
      },
    ],
  },
  lead: {
    eyebrow: "Member story",
    title: "Trusted by teams across the network",
    description: "Highlight one lead testimonial and supporting quotes.",
    columns: "2",
    align: "left",
    density: "comfortable",
    items: [
      {
        id: "quote_preview_lead_1",
        quote:
          "The CMS workflow helped our team ship updates without losing editorial quality.",
        authorName: "Avery Johnson",
        authorRole: "Communications Lead",
        authorOrg: "Bridgepoint Hub",
        avatar: {
          imageMediaId: "media_preview_testimonial_2",
          alt: "Portrait of Avery Johnson",
        },
        badge: { text: "Lead story", tone: "brand" },
      },
      {
        id: "quote_preview_lead_2",
        quote: "Our onboarding and membership renewals are now far easier to manage.",
        authorName: "Taylor Kim",
        authorRole: "Membership Coordinator",
        authorOrg: "Lakeside Hub",
        avatar: {
          imageMediaId: "",
          alt: "",
        },
        badge: null,
      },
      {
        id: "quote_preview_lead_3",
        quote: "We can keep pages current while maintaining approval controls.",
        authorName: "Riley Evans",
        authorRole: "Operations Director",
        authorOrg: "Harbor Foundation",
        avatar: {
          imageMediaId: "",
          alt: "",
        },
        badge: null,
      },
    ],
  },
};

export const TESTIMONIALS_SECTION_DESCRIPTION_MAX_LENGTH = TESTIMONIAL_DESCRIPTION_MAX_LENGTH;
export const TESTIMONIALS_QUOTE_MAX_LENGTH = QUOTE_ITEM_MAX_LENGTH;

export function formatQuoteItemTitle(item = {}, index = 0) {
  const authorName = normalizeText(item.authorName);
  const authorRole = normalizeText(item.authorRole);

  if (authorName && authorRole) return `${authorName} - ${authorRole}`;
  if (authorName) return authorName;
  return `Testimonial ${index + 1}`;
}

export function getQuoteItemStatus(item = {}, index = 0) {
  const missing = evaluateQuoteItemReadiness(item, index);
  if (missing.length) {
    return { label: `Fields required (${missing.length})`, tone: "danger" };
  }
  return { label: "Ready", tone: "success" };
}

export { createDefaultQuoteItem };
