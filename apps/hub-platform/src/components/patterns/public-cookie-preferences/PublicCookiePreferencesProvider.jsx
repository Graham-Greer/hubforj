"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import {
  createDefaultPublicCookiePreferences,
  normalizePublicCookiePreferences,
  publicCookiePreferencesCookieName,
  publicCookiePreferencesVersion,
} from "@/lib/domain/public-cookie-preferences";
import styles from "./PublicCookiePreferencesProvider.module.css";

const PublicCookiePreferencesContext = createContext({
  preferences: createDefaultPublicCookiePreferences(),
  openPreferences: () => {},
});

function readPreferencesCookie() {
  if (typeof document === "undefined") {
    return createDefaultPublicCookiePreferences();
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${publicCookiePreferencesCookieName}=`));

  if (!match) {
    return createDefaultPublicCookiePreferences();
  }

  try {
    const rawValue = decodeURIComponent(match.split("=").slice(1).join("="));
    return normalizePublicCookiePreferences(JSON.parse(rawValue));
  } catch {
    return createDefaultPublicCookiePreferences();
  }
}

function writePreferencesCookie(preferences) {
  const next = normalizePublicCookiePreferences(preferences);
  const encoded = encodeURIComponent(JSON.stringify(next));
  document.cookie = `${publicCookiePreferencesCookieName}=${encoded}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  return next;
}

export function usePublicCookiePreferences() {
  return useContext(PublicCookiePreferencesContext);
}

export default function PublicCookiePreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(createDefaultPublicCookiePreferences());
  const [mounted, setMounted] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const nextPreferences = readPreferencesCookie();
      setPreferences(nextPreferences);
      setBannerVisible(!nextPreferences.acknowledged);
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const saveAcknowledgement = useCallback(() => {
    const next = writePreferencesCookie({
      version: publicCookiePreferencesVersion,
      acknowledged: true,
      categories: {
        necessary: true,
      },
      savedAt: new Date().toISOString(),
    });

    setPreferences(next);
    setBannerVisible(false);
    setPanelOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setPanelOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      openPreferences,
    }),
    [openPreferences, preferences]
  );

  return (
    <PublicCookiePreferencesContext.Provider value={value}>
      {children}

      {mounted && bannerVisible ? (
        <div className={styles.banner} role="dialog" aria-labelledby="public-cookie-banner-title" aria-describedby="public-cookie-banner-body">
          <div className={styles.bannerCopy}>
            <h2 id="public-cookie-banner-title" className={styles.bannerTitle}>Cookies on this site</h2>
            <p id="public-cookie-banner-body" className={styles.bannerBody}>
              We currently use essential cookies only. These help keep sign-in, account access, and cookie settings working properly. We do not currently use optional analytics or advertising cookies on this site.
            </p>
          </div>
          <div className={styles.bannerActions}>
            <Button type="button" variant="secondary" onClick={openPreferences}>
              Cookie preferences
            </Button>
            <Button type="button" onClick={saveAcknowledgement}>
              Got it
            </Button>
          </div>
        </div>
      ) : null}

      {mounted && panelOpen ? (
        <div className={styles.overlay} onClick={closePreferences}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-cookie-panel-title"
            aria-describedby="public-cookie-panel-body"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.panelHeader}>
              <h2 id="public-cookie-panel-title" className={styles.panelTitle}>Cookie settings</h2>
              <p id="public-cookie-panel-body" className={styles.panelDescription}>
                We currently use essential cookies only on this site.
              </p>
            </div>

            <div className={styles.preferenceCard}>
              <div className={styles.preferenceCopy}>
                <h3 className={styles.preferenceTitle}>Essential cookies</h3>
                <p className={styles.preferenceBody}>
                  These cookies support secure sign-in, authenticated account access, session continuity, and remembering your cookie choice.
                </p>
              </div>
              <span className={styles.preferenceState}>Always on</span>
            </div>

            <div className={styles.preferenceNotice}>
              We do not currently use optional analytics, advertising, or social-media tracking cookies on this site.
            </div>

            <p className={styles.panelMeta}>
              For more detail about how cookies are used, please review the cookies policy linked in the site footer.
            </p>

            <div className={styles.panelActions}>
              <Button type="button" variant="secondary" onClick={closePreferences}>
                Close
              </Button>
              <Button type="button" onClick={saveAcknowledgement}>
                Save and close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PublicCookiePreferencesContext.Provider>
  );
}
