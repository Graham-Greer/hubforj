import PublicSiteFooter from "@/components/patterns/public-site-footer/PublicSiteFooter";
import PublicCookiePreferencesProvider from "@/components/patterns/public-cookie-preferences/PublicCookiePreferencesProvider";
import PublicHeader from "./PublicHeader";
import styles from "./PublicShell.module.css";

export default function PublicShell({ hubSlug, headerModel, footerModel, siteSettings, children }) {
  return (
    <PublicCookiePreferencesProvider>
      <div className={styles.root}>
        <PublicHeader hubSlug={hubSlug} headerModel={headerModel} />
        <div className={styles.content}>{children}</div>
        <PublicSiteFooter hubSlug={hubSlug} siteSettings={siteSettings} footerModel={footerModel} />
      </div>
    </PublicCookiePreferencesProvider>
  );
}
