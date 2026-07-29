import {
  COURSE_DETAIL_VARIANT_KEYS,
  COURSES_LISTING_VARIANT_KEYS,
  CTA_VARIANT_KEYS,
  EVENT_DETAIL_VARIANT_KEYS,
  EVENTS_LISTING_VARIANT_KEYS,
  FOOTER_VARIANT_KEYS,
  GRID_VARIANT_KEYS,
  HEADER_DENSITY_KEYS,
  HEADER_MOBILE_DRAWER_SURFACE_KEYS,
  HEADER_NAV_ALIGN_KEYS,
  HEADER_PRIMARY_CTA_MODE_KEYS,
  HEADER_STICKY_MODE_KEYS,
  HEADER_TOP_BAND_KEYS,
  HEADER_VARIANT_KEYS,
  HEADER_WIDTH_MODE_KEYS,
  HERO_HEIGHT_KEYS,
  HERO_VARIANT_KEYS,
  INFO_MEDIA_POSITION_KEYS,
  INFO_VARIANT_KEYS,
  SECTION_CONTAINER_WIDTH_KEYS,
  SECTION_SURFACE_KEYS,
  STATIC_PAGE_VARIANT_KEYS,
  TEMPLATE_KEYS,
  TESTIMONIALS_VARIANT_KEYS,
} from "./template-types.js";

function assertObject(label, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertOneOf(label, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${label} must be one of: ${allowedValues.join(", ")}`);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.getOwnPropertyNames(value).forEach((key) => {
    deepFreeze(value[key]);
  });

  return Object.freeze(value);
}

export function defineTemplateDefinition(definition) {
  assertObject("template definition", definition);
  assertOneOf("template key", definition.key, TEMPLATE_KEYS);
  assertOneOf("template content width", definition.contentWidth, SECTION_CONTAINER_WIDTH_KEYS);

  assertObject("template header", definition.header);
  assertOneOf("header variant", definition.header.variant, HEADER_VARIANT_KEYS);
  assertOneOf("header width mode", definition.header.widthMode, HEADER_WIDTH_MODE_KEYS);
  assertOneOf("header nav alignment", definition.header.navAlign, HEADER_NAV_ALIGN_KEYS);
  assertOneOf("header density", definition.header.density, HEADER_DENSITY_KEYS);
  assertOneOf("header sticky mode", definition.header.stickyMode, HEADER_STICKY_MODE_KEYS);
  assertOneOf("header mobile drawer surface", definition.header.mobileDrawerSurface, HEADER_MOBILE_DRAWER_SURFACE_KEYS);
  assertOneOf("header top band", definition.header.topBand, HEADER_TOP_BAND_KEYS);
  assertOneOf("header primary CTA mode", definition.header.primaryCtaMode, HEADER_PRIMARY_CTA_MODE_KEYS);

  assertObject("template footer", definition.footer);
  assertOneOf("footer variant", definition.footer.variant, FOOTER_VARIANT_KEYS);

  assertObject("template landing page", definition.landingPage);
  assertObject("landing page hero", definition.landingPage.hero);
  assertOneOf("landing hero variant", definition.landingPage.hero.variant, HERO_VARIANT_KEYS);
  assertOneOf("landing hero height", definition.landingPage.hero.height, HERO_HEIGHT_KEYS);
  assertOneOf("landing hero container width", definition.landingPage.hero.containerWidth, SECTION_CONTAINER_WIDTH_KEYS);
  assertObject("landing page info", definition.landingPage.info);
  assertOneOf("landing info media position", definition.landingPage.info.mediaPosition, INFO_MEDIA_POSITION_KEYS);
  assertOneOf("landing info variant", definition.landingPage.info.variant, INFO_VARIANT_KEYS);
  assertObject("landing page what we do", definition.landingPage.whatWeDo);
  assertOneOf("landing what we do variant", definition.landingPage.whatWeDo.variant, GRID_VARIANT_KEYS);
  assertObject("landing page testimonials", definition.landingPage.testimonials);
  assertOneOf("landing testimonials variant", definition.landingPage.testimonials.variant, TESTIMONIALS_VARIANT_KEYS);
  assertObject("landing page CTA", definition.landingPage.cta);
  assertOneOf("landing CTA variant", definition.landingPage.cta.variant, CTA_VARIANT_KEYS);
  assertOneOf("landing CTA surface", definition.landingPage.cta.surface, SECTION_SURFACE_KEYS);

  assertObject("template events page", definition.eventsPage);
  assertObject("events page hero", definition.eventsPage.hero);
  assertOneOf("events hero variant", definition.eventsPage.hero.variant, HERO_VARIANT_KEYS);
  assertOneOf("events hero height", definition.eventsPage.hero.height, HERO_HEIGHT_KEYS);
  assertOneOf("events hero container width", definition.eventsPage.hero.containerWidth, SECTION_CONTAINER_WIDTH_KEYS);
  assertObject("events page listing", definition.eventsPage.listing);
  assertOneOf("events listing variant", definition.eventsPage.listing.variant, EVENTS_LISTING_VARIANT_KEYS);

  assertObject("template courses page", definition.coursesPage);
  assertObject("courses page hero", definition.coursesPage.hero);
  assertOneOf("courses hero variant", definition.coursesPage.hero.variant, HERO_VARIANT_KEYS);
  assertOneOf("courses hero height", definition.coursesPage.hero.height, HERO_HEIGHT_KEYS);
  assertOneOf("courses hero container width", definition.coursesPage.hero.containerWidth, SECTION_CONTAINER_WIDTH_KEYS);
  assertObject("courses page listing", definition.coursesPage.listing);
  assertOneOf("courses listing variant", definition.coursesPage.listing.variant, COURSES_LISTING_VARIANT_KEYS);

  assertObject("template testimonials page", definition.testimonialsPage);
  assertObject("testimonials page hero", definition.testimonialsPage.hero);
  assertOneOf("testimonials hero variant", definition.testimonialsPage.hero.variant, HERO_VARIANT_KEYS);
  assertOneOf("testimonials hero height", definition.testimonialsPage.hero.height, HERO_HEIGHT_KEYS);
  assertOneOf("testimonials hero container width", definition.testimonialsPage.hero.containerWidth, SECTION_CONTAINER_WIDTH_KEYS);
  assertObject("testimonials page listing", definition.testimonialsPage.listing);
  assertOneOf("testimonials listing variant", definition.testimonialsPage.listing.variant, TESTIMONIALS_VARIANT_KEYS);

  assertObject("template event detail page", definition.eventDetailPage);
  assertObject("event detail", definition.eventDetailPage.detail);
  assertOneOf("event detail variant", definition.eventDetailPage.detail.variant, EVENT_DETAIL_VARIANT_KEYS);

  assertObject("template course detail page", definition.courseDetailPage);
  assertObject("course detail", definition.courseDetailPage.detail);
  assertOneOf("course detail variant", definition.courseDetailPage.detail.variant, COURSE_DETAIL_VARIANT_KEYS);

  assertObject("template static page", definition.staticPage);
  assertOneOf("static page variant", definition.staticPage.variant, STATIC_PAGE_VARIANT_KEYS);

  return deepFreeze(definition);
}
