import { defineTemplateDefinition } from "../template-contract.js";

export const studioTemplateDefinition = defineTemplateDefinition({
  key: "studio",
  contentWidth: "wide",
  header: {
    variant: "info-band",
    widthMode: "content",
    navAlign: "center",
    density: "comfortable",
    stickyMode: "elevated",
    mobileDrawerSurface: "panel",
    topBand: "info",
    primaryCtaMode: "single",
  },
  footer: {
    variant: "standard",
  },
  landingPage: {
    hero: {
      variant: "panel",
      height: "content",
      containerWidth: "wide",
    },
    info: {
      mediaPosition: "end",
      variant: "feature",
    },
    whatWeDo: {
      variant: "showcase",
    },
    testimonials: {
      variant: "showcase",
    },
    cta: {
      variant: "block",
      surface: "primary",
    },
  },
  eventsPage: {
    hero: {
      variant: "panel",
      height: "content",
      containerWidth: "wide",
    },
    listing: {
      variant: "studio",
    },
  },
  coursesPage: {
    hero: {
      variant: "panel",
      height: "content",
      containerWidth: "wide",
    },
    listing: {
      variant: "studio",
    },
  },
  testimonialsPage: {
    hero: {
      variant: "panel",
      height: "content",
      containerWidth: "wide",
    },
    listing: {
      variant: "showcase",
    },
  },
  eventDetailPage: {
    detail: {
      variant: "studio",
    },
  },
  courseDetailPage: {
    detail: {
      variant: "studio",
    },
  },
  staticPage: {
    variant: "standard",
  },
});
