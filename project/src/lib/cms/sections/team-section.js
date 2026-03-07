import { createSectionHeaderFragment } from "../fragments/section-header-fragment.js";
import {
  evaluateCtaGroupReadiness,
  normalizeCtaGroup,
} from "../fragments/cta-group-fragment.js";
import { normalizeGridLayoutFragment } from "../fragments/grid-layout-fragment.js";
import {
  PERSON_ITEM_BIO_MAX_LENGTH,
  PERSON_SOCIAL_LINK_PLATFORMS,
  createDefaultPersonItem,
  createDefaultPersonSocialLink,
  evaluatePersonItemReadiness,
  extractPersonItemMediaRefs,
  normalizePersonItems,
} from "../fragments/person-item-fragment.js";
import { normalizeText } from "../fragments/shared.js";

const TEAM_DESCRIPTION_MAX_LENGTH = 240;

const headerFragment = createSectionHeaderFragment({
  titleRequired: false,
  descriptionMaxLength: TEAM_DESCRIPTION_MAX_LENGTH,
});

function normalizeTeamLayoutFragment(value = {}) {
  const layout = normalizeGridLayoutFragment(value);
  return {
    columns: layout.columns,
    align: layout.align,
    density: layout.density,
  };
}

export function normalizeTeamSectionProps(props) {
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};
  const header = headerFragment.normalizeHeaderFields(value);
  const ctas = normalizeCtaGroup(value.ctas, {
    label: value.ctaText,
    href: value.ctaHref,
  });
  if (ctas.length > 2) {
    throw new Error("TeamSection.ctas supports up to two items.");
  }

  return {
    ...header,
    ...normalizeTeamLayoutFragment(value),
    ctas,
    items: normalizePersonItems(value.items),
  };
}

export function evaluateTeamSectionReadiness(rawProps) {
  const props = normalizeTeamSectionProps(rawProps);
  const draftMissing = [];

  if (!props.items.length) {
    draftMissing.push("Add at least one team member.");
  }

  props.items.forEach((item, index) => {
    draftMissing.push(...evaluatePersonItemReadiness(item, index));
  });

  const publishMissing = [...draftMissing, ...evaluateCtaGroupReadiness(props.ctas)];

  return {
    readyForDraft: draftMissing.length === 0,
    readyForPublish: publishMissing.length === 0,
    missingRequiredFields: publishMissing,
    missingCount: publishMissing.length,
  };
}

export function extractTeamSectionMediaRefs(rawProps) {
  const props = normalizeTeamSectionProps(rawProps);
  return props.items.flatMap((item) => extractPersonItemMediaRefs(item));
}

export const TEAM_SECTION_SCHEMA = [
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
        label: "Team members",
        type: "person-items",
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

export const TEAM_SECTION_DEFAULT_PROPS = {
  eyebrow: "",
  title: "",
  description: "",
  columns: "3",
  align: "left",
  density: "comfortable",
  ctas: [],
  items: [createDefaultPersonItem()],
};

export const TEAM_SECTION_PREVIEW_PROPS_BY_VARIANT = {
  default: {
    eyebrow: "People",
    title: "Meet the team",
    description: "The people behind our programmes and member experience.",
    columns: "3",
    align: "left",
    density: "comfortable",
    ctas: [],
    items: [
      {
        id: "person_preview_1",
        name: "Jordan Lee",
        role: "Program Director",
        bio: "Leads strategy and partnerships across all hubs.",
        avatar: {
          imageMediaId: "media_preview_team_1",
          alt: "Jordan Lee portrait",
        },
        badge: { text: "Lead", tone: "brand" },
        socialLinks: [
          { id: "social_1", platform: "linkedin", href: "https://linkedin.com/in/jordan" },
        ],
      },
      {
        id: "person_preview_2",
        name: "Avery Kim",
        role: "Operations Lead",
        bio: "Coordinates events and volunteer operations.",
        avatar: {
          imageMediaId: "media_preview_team_2",
          alt: "Avery Kim portrait",
        },
        badge: null,
        socialLinks: [],
      },
      {
        id: "person_preview_3",
        name: "Morgan Diaz",
        role: "Member Success",
        bio: "Supports onboarding and member retention programmes.",
        avatar: {
          imageMediaId: "",
          alt: "",
        },
        badge: null,
        socialLinks: [
          { id: "social_3", platform: "x", href: "https://x.com/morgandiaz" },
        ],
      },
    ],
  },
};

export const TEAM_SECTION_DESCRIPTION_MAX_LENGTH = TEAM_DESCRIPTION_MAX_LENGTH;
export const TEAM_PERSON_BIO_MAX_LENGTH = PERSON_ITEM_BIO_MAX_LENGTH;
export const TEAM_PERSON_SOCIAL_PLATFORMS = PERSON_SOCIAL_LINK_PLATFORMS;

export function formatPersonItemTitle(item = {}, index = 0) {
  const name = normalizeText(item.name);
  const role = normalizeText(item.role);

  if (name && role) return `${name} - ${role}`;
  if (name) return name;
  return `Member ${index + 1}`;
}

export function getPersonItemStatus(item = {}, index = 0) {
  const missing = evaluatePersonItemReadiness(item, index);
  if (missing.length) {
    return { label: `Fields required (${missing.length})`, tone: "danger" };
  }
  return { label: "Ready", tone: "success" };
}

export { createDefaultPersonItem, createDefaultPersonSocialLink };
