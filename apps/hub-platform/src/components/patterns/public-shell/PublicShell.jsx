import PublicSiteFooter from "@/components/patterns/public-site-footer/PublicSiteFooter";
import PublicCookiePreferencesProvider from "@/components/patterns/public-cookie-preferences/PublicCookiePreferencesProvider";
import PublicHeader from "./PublicHeader";
import styles from "./PublicShell.module.css";

export default function PublicShell({ hubSlug, routeMode = "path", headerModel, footerModel, siteSettings, children }) {
  return (
    <PublicCookiePreferencesProvider>
      <div className={styles.root}>
        <PublicHeader hubSlug={hubSlug} routeMode={routeMode} headerModel={headerModel} />
        <div className={styles.content}>{children}</div>
        <PublicSiteFooter hubSlug={hubSlug} routeMode={routeMode} siteSettings={siteSettings} footerModel={footerModel} />
      </div>
    </PublicCookiePreferencesProvider>
  );
}
