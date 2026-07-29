import { defineTemplateDefinition } from "../template-contract.js";

export const civicTemplateDefinition = defineTemplateDefinition({
  key: "civic",
  contentWidth: "default",
  header: {
    variant: "standard",
    widthMode: "content",
    navAlign: "center",
    density: "comfortable",
    stickyMode: "soft",
    mobileDrawerSurface: "integrated",
    topBand: "info",
    primaryCtaMode: "single",
  },
  footer: {
    variant: "standard",
  },
  landingPage: {
    hero: {
      variant: "centered",
      height: "screen",
      containerWidth: "full",
    },
    info: {
      mediaPosition: "end",
      variant: "default",
    },
    whatWeDo: {
      variant: "default",
    },
    testimonials: {
      variant: "cards",
    },
    cta: {
      variant: "split",
      surface: "inverse",
    },
  },
  eventsPage: {
    hero: {
      variant: "centered",
      height: "content",
      containerWidth: "full",
    },
    listing: {
      variant: "default",
    },
  },
  coursesPage: {
    hero: {
      variant: "centered",
      height: "content",
      containerWidth: "full",
    },
    listing: {
      variant: "default",
    },
  },
  testimonialsPage: {
    hero: {
      variant: "centered",
      height: "content",
      containerWidth: "full",
    },
    listing: {
      variant: "cards",
    },
  },
  eventDetailPage: {
    detail: {
      variant: "default",
    },
  },
  courseDetailPage: {
    detail: {
      variant: "default",
    },
  },
  staticPage: {
    variant: "standard",
  },
});
