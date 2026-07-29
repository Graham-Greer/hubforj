import { civicTemplateDefinition } from "./templates/civic.js";
import { editorialTemplateDefinition } from "./templates/editorial.js";
import { studioTemplateDefinition } from "./templates/studio.js";

export const DEFAULT_TEMPLATE_KEY = "civic";

export const templateRegistry = Object.freeze({
  civic: civicTemplateDefinition,
  editorial: editorialTemplateDefinition,
  studio: studioTemplateDefinition,
});

export const supportedTemplateKeys = Object.freeze(Object.keys(templateRegistry));

const templateLabels = Object.freeze({
  civic: "Civic",
  editorial: "Editorial",
  studio: "Studio",
});

export const supportedTemplateOptions = Object.freeze(
  supportedTemplateKeys.map((key) => ({
    value: key,
    label: templateLabels[key] || key,
  }))
);

export function normalizeTemplateKey(templateKey) {
  const normalizedKey = String(templateKey || "").trim();
  return supportedTemplateKeys.includes(normalizedKey) ? normalizedKey : DEFAULT_TEMPLATE_KEY;
}

export function getTemplateDefinition(templateKey) {
  return templateRegistry[normalizeTemplateKey(templateKey)];
}

export function getTemplateContentWidth(templateKey) {
  return getTemplateDefinition(templateKey).contentWidth || "default";
}

export function getTemplateHeaderConfig(templateKey) {
  return getTemplateDefinition(templateKey).header;
}

export function getTemplateFooterConfig(templateKey) {
  return getTemplateDefinition(templateKey).footer;
}

export function getTemplateLandingPageConfig(templateKey) {
  return getTemplateDefinition(templateKey).landingPage;
}

export function getTemplateEventsPageConfig(templateKey) {
  return getTemplateDefinition(templateKey).eventsPage;
}

export function getTemplateCoursesPageConfig(templateKey) {
  return getTemplateDefinition(templateKey).coursesPage;
}

export function getTemplateTestimonialsPageConfig(templateKey) {
  return getTemplateDefinition(templateKey).testimonialsPage;
}

export function getTemplateEventDetailPageConfig(templateKey) {
  return getTemplateDefinition(templateKey).eventDetailPage;
}

export function getTemplateCourseDetailPageConfig(templateKey) {
  return getTemplateDefinition(templateKey).courseDetailPage;
}

export function getTemplateStaticPageConfig(templateKey) {
  return getTemplateDefinition(templateKey).staticPage;
}
