import FooterContainer from "@/components/primitives/footer-container/FooterContainer";
import Link from "next/link";
import SocialIcon from "@/components/ui/social-icon/SocialIcon";
import PublicCookiePreferencesButton from "@/components/patterns/public-cookie-preferences/PublicCookiePreferencesButton";
import { formatPublicAddress, formatPublicHours } from "@/lib/domain/public-site";
import { buildPublicSocialItems } from "@/lib/domain/public-social-links";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import styles from "./PublicSiteFooter.module.css";

const usefulLinks = [
  { label: "Terms of service", path: "/terms" },
  { label: "Privacy policy", path: "/privacy" },
  { label: "Cookies", path: "/cookies" },
];

export default function PublicSiteFooter({ hubSlug, routeMode = "path", siteSettings, footerModel }) {
  const variant = footerModel?.variants?.variant || "standard";
  const contentWidth = footerModel?.contentWidth || "default";
  const addressLines = formatPublicAddress(siteSettings.address);
  const hoursRows = formatPublicHours(siteSettings.hours);
  const socialItems = buildPublicSocialItems(siteSettings.socialLinks || {});

  return (
    <footer className={styles.root} data-variant={variant}>
      <FooterContainer width={contentWidth}>
        <div className={styles.body}>
          <section id="footer-contact" className={styles.column} aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title" className={styles.title}>Contact</h2>
            <div className={styles.stack}>
              <p className={styles.siteName}>{siteSettings.siteName}</p>
              {siteSettings.contactPhone ? (
                <a className={styles.link} href={`tel:${siteSettings.contactPhone}`}>{siteSettings.contactPhone}</a>
              ) : null}
              <a className={styles.link} href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail}</a>
            </div>
            {socialItems.length ? (
              <div className={styles.socials}>
                {socialItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className={styles.socialLink}
                  >
                    <SocialIcon network={item.key} />
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <section className={styles.column} aria-labelledby="footer-address">
            <h2 id="footer-address" className={styles.title}>Address</h2>
            {addressLines.length ? (
              <address className={styles.address}>
                {addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            ) : (
              <p className={styles.placeholder}>Address details will be shared soon.</p>
            )}
          </section>

          <nav className={styles.column} aria-labelledby="footer-links">
            <h2 id="footer-links" className={styles.title}>Useful links</h2>
            <ul className={styles.list}>
              {usefulLinks.map((item) => (
                <li key={item.label}>
                  <Link className={styles.link} href={buildHubRuntimeHref(hubSlug, item.path, routeMode)} prefetch={false}>{item.label}</Link>
                </li>
              ))}
              <li>
                <PublicCookiePreferencesButton className={styles.linkButton} />
              </li>
            </ul>
          </nav>

          <section className={styles.column} aria-labelledby="footer-hours">
            <h2 id="footer-hours" className={styles.title}>Hours</h2>
            {hoursRows.length ? (
              <dl className={styles.hoursList}>
                {hoursRows.map((row) => (
                  <div key={row.label} className={styles.hoursRow}>
                    <dt className={styles.hoursLabel}>{row.label}</dt>
                    <dd className={styles.hoursValue}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className={styles.placeholder}>Hours will be shared soon.</p>
            )}
          </section>
        </div>
      </FooterContainer>

      <div className={styles.meta}>
        <FooterContainer width={contentWidth}>
          <p className={styles.metaCopy}>© {siteSettings.siteName}, All rights reserved.</p>
        </FooterContainer>
      </div>
    </footer>
  );
}
