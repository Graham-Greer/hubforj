import PageHeader from "@/components/patterns/page-header/PageHeader";
import SettingsPanelCard from "@/components/patterns/settings-panel-card/SettingsPanelCard";
import {
  deriveCoursesPageSettingsPanelStatus,
  deriveEventsPageSettingsPanelStatus,
  deriveHomepageSettingsPanelStatus,
  deriveTestimonialsPageSettingsPanelStatus,
} from "@/lib/domain/site-settings";
import styles from "./PageSettingsOverview.module.css";

export default function PageSettingsOverview({ hub, siteSettings }) {
  const heroTitle = siteSettings.homePage?.hero?.title || "Homepage hero not configured";
  const testimonialsTitle =
    siteSettings.homePage?.testimonials?.title || "Testimonials section title not configured";
  const homepageStatus = deriveHomepageSettingsPanelStatus(siteSettings);
  const eventsStatus = deriveEventsPageSettingsPanelStatus(siteSettings);
  const coursesStatus = deriveCoursesPageSettingsPanelStatus(siteSettings);
  const testimonialsPageStatus = deriveTestimonialsPageSettingsPanelStatus(siteSettings);

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Pages"
        title="Edit your public pages"
        description="Update the main content your visitors see on the homepage, events page, courses page, and testimonials page."
      />

      <div className={styles.grid}>
        <SettingsPanelCard
          title="Homepage"
          body="Shape the first impression visitors get, including your hero content, supporting sections, and top-level calls to action."
          meta={`${heroTitle} • ${testimonialsTitle}`}
          href={`/${hub.slug}/admin/settings/pages/home`}
          actionLabel="Open panel"
          status={homepageStatus}
          onboardingKey="page-settings-home-card"
        />
        <SettingsPanelCard
          title="Events"
          body="Set the intro copy that welcomes visitors onto your public events page and helps them understand what is available."
          meta="No hero action fields planned for v1."
          href={`/${hub.slug}/admin/settings/pages/events`}
          actionLabel="Open panel"
          status={eventsStatus}
        />
        <SettingsPanelCard
          title="Courses"
          body="Set the opening copy for your public courses page so visitors can quickly understand the learning offer."
          meta="No hero action fields planned for v1."
          href={`/${hub.slug}/admin/settings/pages/courses`}
          actionLabel="Open panel"
          status={coursesStatus}
        />
        <SettingsPanelCard
          title="Testimonials"
          body="Set the opening copy for your public testimonials page so visitors can quickly understand the trust and social-proof story."
          meta="Hero and CTA can be managed here."
          href={`/${hub.slug}/admin/settings/pages/testimonials`}
          actionLabel="Open panel"
          status={testimonialsPageStatus}
          onboardingKey="page-settings-testimonials-card"
        />
      </div>
    </div>
  );
}
