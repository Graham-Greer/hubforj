import { defineTemplateDefinition } from "../template-contract.js";

export const editorialTemplateDefinition = defineTemplateDefinition({
  key: "editorial",
  contentWidth: "default",
  header: {
    variant: "standard",
    widthMode: "content",
    navAlign: "center",
    density: "comfortable",
    stickyMode: "soft",
    mobileDrawerSurface: "integrated",
    topBand: "none",
    primaryCtaMode: "single",
  },
  footer: {
    variant: "standard",
  },
  landingPage: {
    hero: {
      variant: "split",
      height: "content",
      containerWidth: "default",
    },
    info: {
      mediaPosition: "start",
      variant: "story",
    },
    whatWeDo: {
      variant: "step",
    },
    testimonials: {
      variant: "spotlight-plus-rail",
    },
    cta: {
      variant: "editorial",
      surface: "subtle",
    },
  },
  eventsPage: {
    hero: {
      variant: "narrative",
      height: "content",
      containerWidth: "default",
    },
    listing: {
      variant: "editorial",
    },
  },
  coursesPage: {
    hero: {
      variant: "narrative",
      height: "content",
      containerWidth: "default",
    },
    listing: {
      variant: "editorial",
    },
  },
  testimonialsPage: {
    hero: {
      variant: "narrative",
      height: "content",
      containerWidth: "default",
    },
    listing: {
      variant: "spotlight-plus-rail",
    },
  },
  eventDetailPage: {
    detail: {
      variant: "editorial",
    },
  },
  courseDetailPage: {
    detail: {
      variant: "editorial",
    },
  },
  staticPage: {
    variant: "standard",
  },
});
