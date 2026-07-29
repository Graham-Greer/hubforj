import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("template contract and definitions support richer editorial and studio public variants", () => {
  const templateTypesSource = readFileSync(
    new URL("../../src/lib/templates/template-types.js", import.meta.url),
    "utf8"
  );
  const editorialTemplateSource = readFileSync(
    new URL("../../src/lib/templates/templates/editorial.js", import.meta.url),
    "utf8"
  );
  const studioTemplateSource = readFileSync(
    new URL("../../src/lib/templates/templates/studio.js", import.meta.url),
    "utf8"
  );
  const civicTemplateSource = readFileSync(
    new URL("../../src/lib/templates/templates/civic.js", import.meta.url),
    "utf8"
  );

  assert.match(templateTypesSource, /HERO_VARIANT_KEYS = Object\.freeze\(\["centered", "narrative", "split", "panel"\]\)/);
  assert.match(templateTypesSource, /SECTION_CONTAINER_WIDTH_KEYS = Object\.freeze\(\["full", "wide", "default", "narrow"\]\)/);
  assert.match(templateTypesSource, /INFO_VARIANT_KEYS = Object\.freeze\(\["default", "story", "feature"\]\)/);
  assert.match(templateTypesSource, /EVENTS_LISTING_VARIANT_KEYS = Object\.freeze\(\["default", "editorial", "studio"\]\)/);
  assert.match(templateTypesSource, /COURSES_LISTING_VARIANT_KEYS = Object\.freeze\(\["default", "editorial", "studio"\]\)/);
  assert.match(templateTypesSource, /EVENT_DETAIL_VARIANT_KEYS = Object\.freeze\(\["default", "editorial", "studio"\]\)/);
  assert.match(templateTypesSource, /COURSE_DETAIL_VARIANT_KEYS = Object\.freeze\(\["default", "editorial", "studio"\]\)/);

  assert.match(editorialTemplateSource, /contentWidth: "default"/);
  assert.match(editorialTemplateSource, /hero:\s*{\s*variant: "split",\s*height: "content",\s*containerWidth: "default"/s);
  assert.match(editorialTemplateSource, /info:\s*{\s*mediaPosition: "start",\s*variant: "story"/s);
  assert.match(editorialTemplateSource, /whatWeDo:\s*{\s*variant: "step"/s);
  assert.match(editorialTemplateSource, /eventsPage:\s*{\s*hero:\s*{\s*variant: "narrative",\s*height: "content",\s*containerWidth: "default"/s);
  assert.match(editorialTemplateSource, /coursesPage:\s*{\s*hero:\s*{\s*variant: "narrative",\s*height: "content",\s*containerWidth: "default"/s);
  assert.match(editorialTemplateSource, /cta:\s*{\s*variant: "editorial"/s);
  assert.match(editorialTemplateSource, /listing:\s*{\s*variant: "editorial"/s);
  assert.match(editorialTemplateSource, /detail:\s*{\s*variant: "editorial"/s);

  assert.match(studioTemplateSource, /contentWidth: "wide"/);
  assert.match(studioTemplateSource, /hero:\s*{\s*variant: "panel",\s*height: "content",\s*containerWidth: "wide"/s);
  assert.match(studioTemplateSource, /info:\s*{\s*mediaPosition: "end",\s*variant: "feature"/s);
  assert.match(studioTemplateSource, /whatWeDo:\s*{\s*variant: "showcase"/s);
  assert.match(studioTemplateSource, /testimonials:\s*{\s*variant: "showcase"/s);
  assert.match(studioTemplateSource, /cta:\s*{\s*variant: "block"/s);
  assert.match(studioTemplateSource, /eventsPage:\s*{\s*hero:\s*{\s*variant: "panel",\s*height: "content",\s*containerWidth: "wide"[\s\S]*?listing:\s*{\s*variant: "studio"/s);
  assert.match(studioTemplateSource, /coursesPage:\s*{\s*hero:\s*{\s*variant: "panel",\s*height: "content",\s*containerWidth: "wide"[\s\S]*?listing:\s*{\s*variant: "studio"/s);
  assert.match(studioTemplateSource, /detail:\s*{\s*variant: "studio"/s);

  assert.match(civicTemplateSource, /contentWidth: "default"/);
  assert.match(civicTemplateSource, /hero:\s*{\s*variant: "centered",\s*height: "screen",\s*containerWidth: "full"/s);
  assert.match(civicTemplateSource, /info:\s*{\s*mediaPosition: "end",\s*variant: "default"/s);
  assert.doesNotMatch(civicTemplateSource, /variant: "editorial"/);
  assert.doesNotMatch(civicTemplateSource, /variant: "studio"/);
});

test("public section sources expose the new homepage, listing, and detail variants", () => {
  const landingPageSource = readFileSync(
    new URL("../../src/components/patterns/public-landing-page/PublicLandingPage.jsx", import.meta.url),
    "utf8"
  );
  const heroSectionSource = readFileSync(
    new URL("../../src/components/sections/hero-section/HeroSection.jsx", import.meta.url),
    "utf8"
  );
  const infoSectionSource = readFileSync(
    new URL("../../src/components/sections/info-section/InfoSection.jsx", import.meta.url),
    "utf8"
  );
  const gridSectionSource = readFileSync(
    new URL("../../src/components/sections/grid-section/GridSection.jsx", import.meta.url),
    "utf8"
  );
  const testimonialsSectionSource = readFileSync(
    new URL("../../src/components/sections/testimonials-section/TestimonialsSection.jsx", import.meta.url),
    "utf8"
  );
  const ctaSectionSource = readFileSync(
    new URL("../../src/components/sections/cta-section/CTASection.jsx", import.meta.url),
    "utf8"
  );
  const eventsListingSource = readFileSync(
    new URL("../../src/components/sections/events-listing-section/EventsListingSection.jsx", import.meta.url),
    "utf8"
  );
  const coursesListingSource = readFileSync(
    new URL("../../src/components/sections/courses-listing-section/CoursesListingSection.jsx", import.meta.url),
    "utf8"
  );
  const eventDetailSource = readFileSync(
    new URL("../../src/components/sections/event-details-section/EventDetailsSection.jsx", import.meta.url),
    "utf8"
  );
  const eventBookingFormSource = readFileSync(
    new URL("../../src/components/sections/event-details-section/EventBookingForm.jsx", import.meta.url),
    "utf8"
  );
  const courseDetailSource = readFileSync(
    new URL("../../src/components/sections/course-details-section/CourseDetailsSection.jsx", import.meta.url),
    "utf8"
  );
  const publicHeaderSource = readFileSync(
    new URL("../../src/components/patterns/public-shell/PublicHeader.jsx", import.meta.url),
    "utf8"
  );
  const publicFooterSource = readFileSync(
    new URL("../../src/components/patterns/public-site-footer/PublicSiteFooter.jsx", import.meta.url),
    "utf8"
  );

  assert.match(landingPageSource, /variant={sectionTemplate\.info\.variant}/);
  assert.match(landingPageSource, /containerWidth={sectionTemplate\.hero\.containerWidth}/);
  assert.match(landingPageSource, /const contentWidth = getTemplateContentWidth\(hub\.template\)/);
  assert.match(landingPageSource, /containerWidth={contentWidth}/);
  assert.match(heroSectionSource, /const isNarrative = variant === "narrative"/);
  assert.match(heroSectionSource, /const isPanel = variant === "panel"/);
  assert.match(heroSectionSource, /const resolvedContainerWidth = containerWidth \|\|/);
  assert.match(heroSectionSource, /SectionContainer width={resolvedContainerWidth}/);
  assert.match(heroSectionSource, /styles\.variantNarrative/);
  assert.match(heroSectionSource, /styles\.variantPanel/);
  assert.match(infoSectionSource, /story: styles\.variantStory/);
  assert.match(infoSectionSource, /feature: styles\.variantFeature/);
  assert.match(gridSectionSource, /variant === "showcase"/);
  assert.match(testimonialsSectionSource, /variant === "showcase"/);
  assert.match(ctaSectionSource, /editorial: styles\.variantEditorial/);
  assert.match(ctaSectionSource, /block: styles\.variantBlock/);
  assert.match(eventsListingSource, /resolvedVariant === "editorial"/);
  assert.match(eventsListingSource, /resolvedVariant === "studio"/);
  assert.match(eventsListingSource, /SectionContainer width={containerWidth}/);
  assert.match(coursesListingSource, /resolvedVariant === "editorial"/);
  assert.match(coursesListingSource, /resolvedVariant === "studio"/);
  assert.match(coursesListingSource, /SectionContainer width={containerWidth}/);
  assert.match(eventDetailSource, /resolvedVariant = \["editorial", "studio"\]\.includes\(variant\)/);
  assert.match(eventDetailSource, /EventBookingForm/);
  assert.match(eventBookingFormSource, /name="attendeeCount"/);
  assert.match(eventBookingFormSource, /name="includePrimaryBooker"/);
  assert.match(eventBookingFormSource, /attendeeFullName_/);
  assert.match(eventDetailSource, /SectionContainer width={containerWidth}/);
  assert.match(courseDetailSource, /resolvedVariant = \["editorial", "studio"\]\.includes\(variant\)/);
  assert.match(courseDetailSource, /SectionContainer width={containerWidth}/);
  assert.match(publicHeaderSource, /const headerContainerWidth = widthMode === "full" \? "full" : variants\.contentWidth \|\| "default"/);
  assert.match(publicHeaderSource, /headerCta\?\.kind === "auth"/);
  assert.match(publicHeaderSource, /className={styles\.mobileHeaderCta}/);
  assert.match(publicFooterSource, /const contentWidth = footerModel\?\.contentWidth \|\| "default"/);
});

test("hero and info responsive behavior is variant-owned rather than template-patched", () => {
  const heroStylesSource = readFileSync(
    new URL("../../src/components/sections/hero-section/HeroSection.module.css", import.meta.url),
    "utf8"
  );
  const infoStylesSource = readFileSync(
    new URL("../../src/components/sections/info-section/InfoSection.module.css", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(heroStylesSource, /data-template="editorial"/);
  assert.doesNotMatch(infoStylesSource, /data-template="editorial"/);
  assert.match(heroStylesSource, /\.variantNarrative \.inner/);
  assert.match(heroStylesSource, /\.variantSplit \.inner/);
  assert.match(infoStylesSource, /\.variantStory \.inner/);
  assert.match(infoStylesSource, /@media \(max-width: 64rem\)/);
});

test("grid testimonials and cta section behavior is variant-owned rather than editorial-template patched", () => {
  const gridStylesSource = readFileSync(
    new URL("../../src/components/sections/grid-section/GridSection.module.css", import.meta.url),
    "utf8"
  );
  const testimonialsStylesSource = readFileSync(
    new URL("../../src/components/sections/testimonials-section/TestimonialsSection.module.css", import.meta.url),
    "utf8"
  );
  const ctaStylesSource = readFileSync(
    new URL("../../src/components/sections/cta-section/CTASection.module.css", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(gridStylesSource, /data-template="editorial"/);
  assert.doesNotMatch(testimonialsStylesSource, /data-template="editorial"/);
  assert.doesNotMatch(ctaStylesSource, /data-template="editorial"/);
  assert.match(gridStylesSource, /\.variantStep \.cardStep/);
  assert.match(testimonialsStylesSource, /\.variantSpotlight \.spotlightLayout/);
  assert.match(ctaStylesSource, /\.variantEditorial \.inner/);
});

test("listing and detail section behavior is variant-owned without template-targeted structural patches", () => {
  const eventsListingStylesSource = readFileSync(
    new URL("../../src/components/sections/events-listing-section/EventsListingSection.module.css", import.meta.url),
    "utf8"
  );
  const coursesListingStylesSource = readFileSync(
    new URL("../../src/components/sections/courses-listing-section/CoursesListingSection.module.css", import.meta.url),
    "utf8"
  );
  const eventDetailStylesSource = readFileSync(
    new URL("../../src/components/sections/event-details-section/EventDetailsSection.module.css", import.meta.url),
    "utf8"
  );
  const courseDetailStylesSource = readFileSync(
    new URL("../../src/components/sections/course-details-section/CourseDetailsSection.module.css", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(eventsListingStylesSource, /data-template="editorial"|data-template="studio"/);
  assert.doesNotMatch(coursesListingStylesSource, /data-template="editorial"|data-template="studio"/);
  assert.doesNotMatch(eventDetailStylesSource, /data-template="editorial"|data-template="studio"/);
  assert.doesNotMatch(courseDetailStylesSource, /data-template="editorial"|data-template="studio"/);
  assert.match(eventsListingStylesSource, /\.editorialLayout/);
  assert.match(eventsListingStylesSource, /\.cardStudio\.cardFeatured/);
  assert.match(eventsListingStylesSource, /@media \(max-width: 64rem\)/);
  assert.match(coursesListingStylesSource, /\.editorialLayout/);
  assert.match(coursesListingStylesSource, /\.cardStudio\.cardFeatured/);
  assert.match(coursesListingStylesSource, /@media \(max-width: 64rem\)/);
  assert.match(eventDetailStylesSource, /\.variantEditorial \.articleLayout/);
  assert.match(eventDetailStylesSource, /@media \(max-width: 64rem\)/);
  assert.match(courseDetailStylesSource, /\.variantEditorial \.articleLayout/);
  assert.match(courseDetailStylesSource, /@media \(max-width: 64rem\)/);
});
