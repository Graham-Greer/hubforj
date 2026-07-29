"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/icon/Icon";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import SectionCard from "@/components/sections/primitives/section-card/SectionCard";
import SectionCardBody from "@/components/sections/primitives/section-card-body/SectionCardBody";
import SectionCardMedia from "@/components/sections/primitives/section-card-media/SectionCardMedia";
import SectionItemsGrid from "@/components/sections/primitives/section-items-grid/SectionItemsGrid";
import SectionSearchFilters from "@/components/sections/primitives/section-search-filters/SectionSearchFilters";
import {
  ALL_COURSES_FILTER,
  buildPublicCoursesContextText,
  filterPublicCourses,
  formatPublicCourseListingDateTime,
  formatPublicCoursePriceLabel,
  formatPublicCourseSpacesLeft,
  getPublicCourseDeliveryLabel,
  getPublicCourseIdentity,
  getPublicCourseSummary,
  getPublicCourseTypeOptions,
} from "@/lib/domain/public-courses";
import { getFallbackRegionalMarket } from "@/lib/domain/regional-markets";
import styles from "./CoursesListingSection.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function CourseMedia({ course, featured = false }) {
  const hasMedia = Boolean(course.imageAsset?.publicUrl);
  const mediaClassName = [styles.mediaWrap, featured ? styles.mediaWrapFeatured : ""].filter(Boolean).join(" ");

  if (hasMedia) {
    return (
      <SectionCardMedia bleed="flush" className={mediaClassName}>
        <Image
          src={course.imageAsset.publicUrl}
          alt={course.imageAlt || course.imageAsset.alt || course.title}
          fill
          sizes="(max-width: 48rem) 100vw, 24rem"
          className={styles.media}
          unoptimized
        />
      </SectionCardMedia>
    );
  }

  return (
    <SectionCardMedia bleed="flush" className={[styles.mediaWrap, styles.mediaPlaceholder, featured ? styles.mediaWrapFeatured : ""].filter(Boolean).join(" ")}>
      <span className={styles.mediaPlaceholderText}>{course.courseType || "Course"}</span>
    </SectionCardMedia>
  );
}

function CourseMetaRow({ icon, value }) {
  return (
    <div className={styles.metaRow}>
      <Icon name={icon} size="sm" tone="muted" decorative />
      <span>{value}</span>
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

function CourseCard({ course, hubSlug, locale, featured = false, variant = "default" }) {
  const description = getPublicCourseSummary(course);
  const { typeLabel, levelLabel } = getPublicCourseIdentity(course);
  const listingDateTime = formatPublicCourseListingDateTime(course, locale);
  const cardClassName = [
    styles.card,
    featured ? styles.cardFeatured : styles.cardDefault,
    variant === "editorial" ? styles.cardEditorial : "",
    variant === "studio" ? styles.cardStudio : "",
  ].filter(Boolean).join(" ");

  return (
    <SectionCard
      as={Link}
      href={`/${hubSlug}/courses/${course.slug}`}
      padding="none"
      className={cardClassName}
    >
      <CourseMedia course={course} featured={featured} />

      <SectionCardBody className={styles.cardCopy}>
        <div className={styles.titleBlock}>
          {featured ? (
            <span className={styles.featuredBadge}>
              {variant === "editorial" ? "Lead programme" : variant === "studio" ? "Featured course" : "Featured"}
            </span>
          ) : null}
          <CourseIdentity typeLabel={typeLabel} levelLabel={levelLabel} />
          <h3 className={styles.cardTitle}>{course.title}</h3>
        </div>

        {description ? <p className={styles.cardDescription}>{description}</p> : null}

        <div className={styles.metaList}>
          <CourseMetaRow
            icon="event"
            value={listingDateTime}
          />
          <CourseMetaRow
            icon="location_on"
            value={getPublicCourseDeliveryLabel(course)}
          />
          <CourseMetaRow
            icon={course.pricingMode === "paid" ? "payments" : "sell"}
            value={formatPublicCoursePriceLabel(course, locale)}
          />
          <CourseMetaRow
            icon="groups"
            value={formatPublicCourseSpacesLeft(course, course.enrolledCount || 0)}
          />
        </div>
      </SectionCardBody>
    </SectionCard>
  );
}

function EmptyStateCard({ title, description }) {
  return (
    <SectionCard as="div" className={styles.emptyState}>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className={styles.emptyDescription}>{description}</p>
    </SectionCard>
  );
}

export default function CoursesListingSection({
  id,
  hubSlug,
  locale = fallbackRegionalMarket.defaultLocale,
  courses = [],
  variant = "default",
  containerWidth = "default",
  className = "",
}) {
  const resolvedVariant = ["editorial", "studio"].includes(variant) ? variant : "default";
  const [query, setQuery] = useState("");
  const [activeCourseType, setActiveCourseType] = useState(ALL_COURSES_FILTER);

  const filterOptions = useMemo(() => getPublicCourseTypeOptions(courses), [courses]);
  const visibleCourses = useMemo(
    () => filterPublicCourses(courses, { query, courseType: activeCourseType }),
    [activeCourseType, courses, query]
  );
  const activeCourseTypeLabel =
    filterOptions.find((option) => option.value === activeCourseType)?.label || "All";
  const contextText = buildPublicCoursesContextText({
    totalCount: courses.length,
    resultCount: visibleCourses.length,
    activeCourseTypeLabel,
    query,
  });
  const [featuredCourse, ...remainingCourses] = visibleCourses;

  if (!courses.length) {
    return (
      <SectionShell id={id} spacing="spacious" surface="transparent" className={className}>
        <SectionContainer width={containerWidth}>
          <EmptyStateCard
            title="There are currently no available courses."
            description="Check back soon for upcoming programmes, workshop series, and community learning opportunities."
          />
        </SectionContainer>
      </SectionShell>
    );
  }

  return (
    <SectionShell id={id} spacing="spacious" surface="transparent" className={className}>
      <SectionContainer width={containerWidth}>
        <div className={styles.inner} data-variant={resolvedVariant}>
          <SectionSearchFilters
            searchName="courses-search"
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search courses"
            searchLabel="Search courses"
            filterOptions={filterOptions}
            activeFilter={activeCourseType}
            onFilterChange={setActiveCourseType}
            filterTriggerLabel="Filter courses by type"
            filterMenuLabel="Course type filters"
            contextText={contextText}
          />

          {visibleCourses.length ? (
            resolvedVariant === "editorial" ? (
              <SectionItemsGrid maxColumns={3} singleItemLayout="compact" className={styles.grid}>
                {visibleCourses.map((course) => (
                  <CourseCard key={course.id} course={course} hubSlug={hubSlug} locale={locale} variant="editorial" />
                ))}
              </SectionItemsGrid>
            ) : resolvedVariant === "studio" ? (
              <div className={styles.studioLayout}>
                <CourseCard course={featuredCourse} hubSlug={hubSlug} locale={locale} featured variant="studio" />
                {remainingCourses.length ? (
                  <SectionItemsGrid maxColumns={2} singleItemLayout="compact" className={styles.studioGrid}>
                    {remainingCourses.map((course) => (
                      <CourseCard key={course.id} course={course} hubSlug={hubSlug} locale={locale} variant="studio" />
                    ))}
                  </SectionItemsGrid>
                ) : null}
              </div>
            ) : (
            <SectionItemsGrid maxColumns={3} singleItemLayout="compact" className={styles.grid}>
              {visibleCourses.map((course) => (
                <CourseCard key={course.id} course={course} hubSlug={hubSlug} locale={locale} />
              ))}
            </SectionItemsGrid>
            )
          ) : (
            <EmptyStateCard
              title="No courses match your current search or filter."
              description="Try another course type or search term to explore more learning options."
            />
          )}
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
