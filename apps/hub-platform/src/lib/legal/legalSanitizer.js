import {
  hasSectionRichTextContent,
  getSectionRichTextPlainText,
  normalizeSectionRichTextContent,
  parseSectionRichTextInput,
} from "@/lib/domain/section-rich-text";

export const LEGAL_RICH_TEXT_PROFILE = "legal";

export function sanitizeLegalRichTextContent(value) {
  return normalizeSectionRichTextContent(parseSectionRichTextInput(value, { profile: LEGAL_RICH_TEXT_PROFILE }), {
    profile: LEGAL_RICH_TEXT_PROFILE,
  });
}

export function hasLegalRichTextContent(value) {
  return hasSectionRichTextContent(sanitizeLegalRichTextContent(value), { profile: LEGAL_RICH_TEXT_PROFILE });
}

export function serializeLegalRichTextContent(value) {
  return JSON.stringify(sanitizeLegalRichTextContent(value));
}

export function isSameLegalRichTextContent(left, right) {
  return serializeLegalRichTextContent(left) === serializeLegalRichTextContent(right);
}

export function createLegalPlainTextSummary(value) {
  return getSectionRichTextPlainText(sanitizeLegalRichTextContent(value), { profile: LEGAL_RICH_TEXT_PROFILE });
}
