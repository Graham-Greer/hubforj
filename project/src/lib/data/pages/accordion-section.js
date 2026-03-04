const DESCRIPTION_MAX_LENGTH = 240;

function fallbackItemId() {
  return `acc_${Math.random().toString(36).slice(2, 10)}`;
}

export function createAccordionItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `acc_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return fallbackItemId();
}

export function createDefaultAccordionItem() {
  return {
    id: createAccordionItemId(),
    title: "",
    content: "",
  };
}

function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeAccordionItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => (item && typeof item === "object" ? item : null))
    .filter(Boolean)
    .map((item, index) => ({
      id: normalizeText(item.id) || `acc_${index + 1}`,
      title: normalizeText(item.title),
      content: String(item.content || "").trim(),
    }));
}

export function normalizeAccordionSectionProps(props) {
  const value = props && typeof props === "object" && !Array.isArray(props) ? props : {};

  return {
    eyebrow: normalizeText(value.eyebrow),
    title: normalizeText(value.title),
    description: normalizeText(value.description).slice(0, DESCRIPTION_MAX_LENGTH),
    items: normalizeAccordionItems(value.items),
  };
}

export function evaluateAccordionReadiness(rawProps) {
  const props = normalizeAccordionSectionProps(rawProps);
  const missing = [];

  if (!props.items.length) {
    missing.push("Add at least one accordion item.");
  }

  props.items.forEach((item, index) => {
    if (!item.title) {
      missing.push(`Item ${index + 1}: title is required.`);
    }
    if (!item.content) {
      missing.push(`Item ${index + 1}: content is required.`);
    }
  });

  return {
    readyForDraft: missing.length === 0,
    readyForPublish: missing.length === 0,
    missingRequiredFields: missing,
    missingCount: missing.length,
  };
}

export const ACCORDION_SECTION_SCHEMA = [
  {
    key: "core",
    type: "group",
    label: "Core",
    defaultOpen: true,
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        maxLength: DESCRIPTION_MAX_LENGTH,
        hint: "Maximum 240 characters.",
      },
    ],
  },
  {
    key: "items",
    type: "group",
    label: "Items",
    defaultOpen: true,
    fields: [
      {
        key: "items",
        label: "Accordion items",
        type: "accordion-items",
        minItems: 1,
        newItemLabel: "Accordion item",
      },
    ],
  },
];

export const ACCORDION_SECTION_DEFAULT_PROPS = {
  eyebrow: "",
  title: "Frequently asked questions",
  description: "",
  items: [createDefaultAccordionItem()],
};

export const ACCORDION_SECTION_PREVIEW_PROPS = {
  eyebrow: "Need to know",
  title: "Membership and events FAQ",
  description: "Give members clear guidance before they register or join.",
  items: [
    {
      id: "acc_preview_1",
      title: "Who can join events?",
      content: "Anyone with an account can register, subject to event eligibility settings.",
    },
    {
      id: "acc_preview_2",
      title: "Do paid memberships renew automatically?",
      content: "Membership renewal timing follows the selected plan and hub billing settings.",
    },
  ],
};

export const ACCORDION_DESCRIPTION_MAX_LENGTH = DESCRIPTION_MAX_LENGTH;
