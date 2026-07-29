import SectionArticleLayout from "@/components/sections/primitives/section-article-layout/SectionArticleLayout";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionMedia from "@/components/sections/primitives/section-media/SectionMedia";
import SectionRichText from "@/components/sections/primitives/section-rich-text/SectionRichText";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import {
  buildPublicCourseEnrolmentCta,
  formatPublicCourseListingDateTime,
  formatPublicCoursePriceLabel,
  formatPublicCourseSpacesLeft,
  getPublicCourseAvailabilityState,
  getPublicCourseDeliveryLabel,
  getPublicCourseIdentity,
  getPublicCourseRegistrationWindowState,
  getPublicCourseSummary,
} from "@/lib/domain/public-courses";
import { formatCourseSessionCount } from "@/lib/domain/courses";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import styles from "./CourseDetailsSection.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function CourseMetaItem({ icon, value }) {
  return (
    <div className={styles.metaItem}>
      <Icon name={icon} size="sm" tone="muted" decorative />
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}

function CourseIdentity({ typeLabel, levelLabel }) {
  return (
    <div className={styles.identityCluster}>
      <span className={styles.identityPill}>{typeLabel}</span>
      {levelLabel ? <span className={styles.identityPillSecondary}>{levelLabel}</span> : null}
    </div>
  );
}

function EnrolmentCard({
  hubSlug,
  routeMode = "path",
  locale,
  course,
  enrolledCount,
  currentMemberSession,
  currentRegistration,
  detailAccessMode,
  enrolmentAction,
}) {
  const cta = buildPublicCourseEnrolmentCta({
    course,
    hubSlug,
    routeMode,
    enrolledCount,
    currentMemberSession,
    currentRegistration,
    detailAccessMode,
  });
  const priceLabel = formatPublicCoursePriceLabel(course, locale);
  const spacesLabel = formatPublicCourseSpacesLeft(course, enrolledCount);

  return (
    <SectionCard className={styles.enrolmentCard}>
      <div className={styles.enrolmentHeader}>
        <h2 className={styles.enrolmentTitle}>{cta.heading}</h2>
        {cta.supportingText ? <p className={styles.enrolmentText}>{cta.supportingText}</p> : null}
      </div>

      <div className={styles.enrolmentActionRow}>
        <div className={styles.enrolmentSummary}>
          <div className={styles.enrolmentSummaryItem}>
            <span className={styles.enrolmentSummaryValue}>{priceLabel}</span>
          </div>
          <div className={styles.enrolmentSummaryItem}>
            <span className={styles.enrolmentSummaryValue}>{spacesLabel}</span>
          </div>
        </div>

        {cta.disabled ? (
          <Button type="button" size="lg" className={styles.enrolmentButton} disabled>
            {cta.buttonLabel}
          </Button>
        ) : cta.requiresForm ? (
          <form action={enrolmentAction} className={styles.enrolmentForm}>
            <input type="hidden" name="hubSlug" value={hubSlug} />
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="courseSlug" value={course.slug} />
            <Button type="submit" size="lg" className={styles.enrolmentButton}>
              {cta.buttonLabel}
            </Button>
          </form>
        ) : (
          <Button
            href={cta.href}
            size="lg"
            className={styles.enrolmentButton}
            target={cta.external ? "_blank" : undefined}
            rel={cta.external ? "noreferrer" : undefined}
          >
            {cta.buttonLabel}
          </Button>
        )}
      </div>
    </SectionCard>
  );
}

function CourseMediaLead({ course }) {
  if (course.imageAsset?.publicUrl) {
    return (
      <SectionMedia
        media={{
          src: course.imageAsset.publicUrl,
          type: "image",
        }}
        alt={course.imageAlt || course.imageAsset.alt || course.title}
        ratio="16:9"
        radius="xl"
        chrome="default"
        elevation="lg"
        priority
        sizes="(max-width: 72rem) 100vw, 72rem"
        className={styles.mediaLead}
      />
    );
  }

  return (
    <div className={[styles.mediaLead, styles.mediaLeadPlaceholder].join(" ")}>
      <span className={styles.mediaLeadPlaceholderText}>{course.courseType || "Course"}</span>
    </div>
  );
}

export default function CourseDetailsSection({
  id,
  hubSlug,
  routeMode = "path",
  locale = fallbackRegionalMarket.defaultLocale,
  course,
  enrolledCount = 0,
  currentMemberSession = null,
  currentRegistration = null,
  detailAccessMode = "public",
  enrolmentAction,
  variant = "default",
  containerWidth = "default",
  className = "",
}) {
  const summary = getPublicCourseSummary(course);
  const { typeLabel, levelLabel } = getPublicCourseIdentity(course);
  const accessInstructionsPresent = Array.isArray(course?.accessInstructions) && course.accessInstructions.length > 0;
  const resolvedVariant = ["editorial", "studio"].includes(variant) ? variant : "default";
  const priceLabel = formatPublicCoursePriceLabel(course, locale);
  const spacesLabel = formatPublicCourseSpacesLeft(course, enrolledCount);

  return (
    <SectionShell
      id={id}
      spacing="compact"
      surface="transparent"
      className={className}
    >
      <SectionContainer width={containerWidth}>
        <div
          className={[
            styles.root,
            resolvedVariant === "editorial" ? styles.variantEditorial : "",
            resolvedVariant === "studio" ? styles.variantStudio : "",
          ].filter(Boolean).join(" ")}
          data-variant={resolvedVariant}
        >
          <CourseMediaLead course={course} />

          <SectionArticleLayout stickyAside className={styles.articleLayout}>
            <SectionArticleLayout.Main className={styles.main}>
              <div className={styles.headerBlock}>
                {resolvedVariant !== "default" ? (
                  <div className={styles.kickerRow}>
                    <span className={styles.kicker}>{priceLabel}</span>
                    <span className={styles.kickerSecondary}>{spacesLabel}</span>
                  </div>
                ) : null}
                <CourseIdentity typeLabel={typeLabel} levelLabel={levelLabel} />
                <h1 className={styles.title}>{course.title}</h1>
                {summary ? <p className={styles.summary}>{summary}</p> : null}
              </div>

              <div className={styles.metaGroup}>
                <CourseMetaItem
                  icon="event"
                  value={formatPublicCourseListingDateTime(course, locale)}
                />
                <CourseMetaItem
                  icon="location_on"
                  value={getPublicCourseDeliveryLabel(course)}
                />
                {course.timezone ? (
                  <CourseMetaItem
                    icon="schedule"
                    value={course.timezone}
                  />
                ) : null}
                {Number(course.sessionCount) > 0 ? (
                  <CourseMetaItem
                    icon="view_agenda"
                    value={formatCourseSessionCount(course.sessionCount)}
                  />
                ) : null}
              </div>

              <SectionRichText content={course.description} className={styles.description} />

              {accessInstructionsPresent ? (
                <div className={styles.instructionsBlock}>
                  <h2 className={styles.instructionsTitle}>What to know before attending</h2>
                  <SectionRichText content={course.accessInstructions} className={styles.instructionsText} />
                </div>
              ) : null}
            </SectionArticleLayout.Main>

            <SectionArticleLayout.Aside>
              <EnrolmentCard
                hubSlug={hubSlug}
                locale={locale}
                course={course}
                enrolledCount={enrolledCount}
                currentMemberSession={currentMemberSession}
                currentRegistration={currentRegistration}
              detailAccessMode={detailAccessMode}
              routeMode={routeMode}
              enrolmentAction={enrolmentAction}
            />
            </SectionArticleLayout.Aside>
          </SectionArticleLayout>
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
