import { hasLegalRichTextContent, sanitizeLegalRichTextContent } from "./legalSanitizer";

export const legalDocumentTypes = Object.freeze(["terms", "privacy"]);
export const legalAcceptanceVersion = "hub-legal-save-v1";

function normalizeString(value) {
  return String(value || "").trim();
}

export function assertLegalDocumentType(value) {
  const normalized = normalizeString(value).toLowerCase();

  if (!legalDocumentTypes.includes(normalized)) {
    throw new Error("A valid legal document type is required.");
  }

  return normalized;
}

export function assertLegalAcknowledgementAccepted(value) {
  if (value !== true) {
    throw new Error("Legal acknowledgement must be accepted before saving.");
  }

  return true;
}

export function assertLegalMutationAccess(access = {}, options = {}) {
  const allowSupportOverride = options.allowSupportOverride !== false;
  const actorRole = normalizeString(access?.actorRole).toLowerCase();
  const mode = normalizeString(access?.mode).toLowerCase();

  if (actorRole === "owner" && mode === "admin") {
    return true;
  }

  if (allowSupportOverride && actorRole === "superadmin" && mode === "support") {
    return true;
  }

  throw new Error("Only the hub owner can update legal pages.");
}

export function assertNonEmptyLegalContent(value) {
  const content = sanitizeLegalRichTextContent(value);

  if (!hasLegalRichTextContent(content)) {
    throw new Error("Legal page content is required.");
  }

  return content;
}

export function validateLegalSavePayload(payload = {}) {
  const documentType = assertLegalDocumentType(payload.documentType);
  const content = assertNonEmptyLegalContent(payload.content);
  const acknowledgementAccepted = assertLegalAcknowledgementAccepted(payload.acknowledgementAccepted === true);

  return {
    documentType,
    content,
    acknowledgementAccepted,
  };
}
