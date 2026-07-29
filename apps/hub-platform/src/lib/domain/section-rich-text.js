function normalizeString(value) {
  return String(value || "");
}

export const SECTION_RICH_TEXT_PROFILES = {
  basic: "basic",
  legal: "legal",
};

function resolveProfile(options = {}) {
  const requestedProfile =
    typeof options === "string"
      ? options
      : options && typeof options === "object"
        ? String(options.profile || "")
        : "";

  return requestedProfile === SECTION_RICH_TEXT_PROFILES.legal
    ? SECTION_RICH_TEXT_PROFILES.legal
    : SECTION_RICH_TEXT_PROFILES.basic;
}

function normalizeHref(value) {
  const href = normalizeString(value).trim();

  if (!href) {
    return "";
  }

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return href;
  }

  return "";
}

function normalizeInlineNode(node = {}, profile = SECTION_RICH_TEXT_PROFILES.basic) {
  const text = normalizeString(node.text);

  if (!text.trim()) {
    return null;
  }

  const normalized = {
    text,
    ...(node.bold ? { bold: true } : {}),
    ...(node.italic ? { italic: true } : {}),
  };

  if (profile === SECTION_RICH_TEXT_PROFILES.legal) {
    const href = normalizeHref(node.href);

    if (href) {
      normalized.href = href;
    }
  }

  return normalized;
}

function haveMatchingInlineFormatting(left = {}, right = {}) {
  return (
    Boolean(left.bold) === Boolean(right.bold) &&
    Boolean(left.italic) === Boolean(right.italic) &&
    normalizeHref(left.href) === normalizeHref(right.href)
  );
}

function mergeAdjacentInlineNodes(children = [], profile = SECTION_RICH_TEXT_PROFILES.basic) {
  return children.reduce((result, child) => {
    const normalizedChild = normalizeInlineNode(child, profile);

    if (!normalizedChild) {
      return result;
    }

    const previous = result[result.length - 1];
    if (previous && haveMatchingInlineFormatting(previous, normalizedChild)) {
      previous.text += normalizedChild.text;
      return result;
    }

    result.push(normalizedChild);
    return result;
  }, []);
}

function normalizeParagraphBlock(block = {}, profile = SECTION_RICH_TEXT_PROFILES.basic) {
  const children = mergeAdjacentInlineNodes(Array.isArray(block.children) ? block.children : [], profile);

  if (!children.length) {
    return null;
  }

  return {
    type: "paragraph",
    children,
  };
}

function normalizeHeadingBlock(block = {}, profile = SECTION_RICH_TEXT_PROFILES.legal) {
  const children = mergeAdjacentInlineNodes(Array.isArray(block.children) ? block.children : [], profile);
  const level = Number(block.level);

  if (!children.length || ![2, 3].includes(level)) {
    return null;
  }

  return {
    type: "heading",
    level,
    children,
  };
}

function normalizeListItems(items = [], profile = SECTION_RICH_TEXT_PROFILES.basic) {
  return Array.isArray(items)
    ? items
        .map((item) => {
          const children = mergeAdjacentInlineNodes(
            Array.isArray(item)
              ? item
              : Array.isArray(item?.children)
                ? item.children
                : [],
            profile
          );

          if (!children.length) {
            return null;
          }

          return { children };
        })
        .filter(Boolean)
    : [];
}

function normalizeUnorderedListBlock(block = {}, profile = SECTION_RICH_TEXT_PROFILES.basic) {
  const items = normalizeListItems(block.items, profile);

  if (!items.length) {
    return null;
  }

  return {
    type: "unordered-list",
    items,
  };
}

function normalizeOrderedListBlock(block = {}, profile = SECTION_RICH_TEXT_PROFILES.legal) {
  const items = normalizeListItems(block.items, profile);

  if (!items.length) {
    return null;
  }

  return {
    type: "ordered-list",
    items,
  };
}

export function normalizeSectionRichTextContent(content = [], options = {}) {
  const profile = resolveProfile(options);

  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .map((block) => {
      const type = normalizeString(block?.type).toLowerCase();

      if (type === "paragraph") {
        return normalizeParagraphBlock(block, profile);
      }

      if (type === "unordered-list") {
        return normalizeUnorderedListBlock(block, profile);
      }

      if (profile === SECTION_RICH_TEXT_PROFILES.legal && type === "ordered-list") {
        return normalizeOrderedListBlock(block, profile);
      }

      if (profile === SECTION_RICH_TEXT_PROFILES.legal && type === "heading") {
        return normalizeHeadingBlock(block, profile);
      }

      return null;
    })
    .filter(Boolean);
}

export function parseSectionRichTextInput(value, options = {}) {
  if (Array.isArray(value)) {
    return normalizeSectionRichTextContent(value, options);
  }

  const normalizedValue = normalizeString(value).trim();

  if (!normalizedValue) {
    return [];
  }

  try {
    return normalizeSectionRichTextContent(JSON.parse(normalizedValue), options);
  } catch {
    throw new Error("Rich text content could not be parsed.");
  }
}

export function hasSectionRichTextContent(content, options = {}) {
  return normalizeSectionRichTextContent(content, options).length > 0;
}

export function coerceSectionRichTextInput(value, options = {}) {
  if (Array.isArray(value)) {
    return normalizeSectionRichTextContent(value, options);
  }

  const normalizedValue = normalizeString(value).trim();

  if (!normalizedValue) {
    return [];
  }

  try {
    return normalizeSectionRichTextContent(JSON.parse(normalizedValue), options);
  } catch {
    return normalizeSectionRichTextContent(
      normalizedValue
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => ({
          type: "paragraph",
          children: [{ text: paragraph }],
        })),
      options
    );
  }
}

export function getSectionRichTextPlainText(content, options = {}) {
  const blocks = normalizeSectionRichTextContent(content, options);

  return blocks
    .map((block) => {
      if (block.type === "unordered-list" || block.type === "ordered-list") {
        return block.items
          .map((item) => item.children.map((child) => normalizeString(child.text)).join(""))
          .filter(Boolean)
          .join(" ");
      }

      return Array.isArray(block.children)
        ? block.children.map((child) => normalizeString(child.text)).join("")
        : "";
    })
    .filter(Boolean)
    .join(" ")
    .trim();
}
