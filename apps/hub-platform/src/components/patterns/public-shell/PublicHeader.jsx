"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import HeaderContainer from "@/components/primitives/header-container/HeaderContainer";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import NavToggleButton from "@/components/ui/nav-toggle-button/NavToggleButton";
import SocialIcon from "@/components/ui/social-icon/SocialIcon";
import PublicAuthButton from "./PublicAuthButton";
import PublicMobileNav from "./PublicMobileNav";
import PublicShellNav from "./PublicShellNav";
import PublicUtilityMenu from "./PublicUtilityMenu";
import styles from "./PublicHeader.module.css";

export default function PublicHeader({ hubSlug, headerModel }) {
  const mobilePanelId = useId();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);
  const siteName = headerModel?.brand?.siteName || hubSlug;
  const homeHref = headerModel?.brand?.homeHref || `/${hubSlug}`;
  const logoAsset = headerModel?.brand?.logoAsset || null;
  const logoAlt = headerModel?.brand?.logoAlt || "";
  const hasLogo = Boolean(logoAsset?.publicUrl);
  const navItems = headerModel?.navigation?.items || [];
  const navAlign = headerModel?.navigation?.desktopAlign || "start";
  const utility = headerModel?.utility || { viewerState: "anonymous" };
  const headerCta = headerModel?.cta || null;
  const topBand = headerModel?.topBand || null;
  const variants = headerModel?.variants || {};
  const widthMode = variants.widthMode || "content";
  const density = variants.density || "comfortable";
  const stickyMode = variants.stickyMode || "soft";
  const drawerSurface = variants.mobileDrawerSurface || "integrated";
  const headerContainerWidth = widthMode === "full" ? "full" : variants.contentWidth || "default";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const collapseThreshold = topBand ? 64 : 12;
    const releaseThreshold = topBand ? 24 : 4;

    function handleScroll() {
      const scrollY = window.scrollY || 0;

      setIsScrolled((current) => {
        if (current) {
          return scrollY > releaseThreshold;
        }

        return scrollY > collapseThreshold;
      });
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [topBand]);

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeMobileNav();
      }
    }

    const desktopMediaQuery = window.matchMedia("(min-width: 64.001rem)");

    function handleDesktopChange(event) {
      if (event.matches) {
        closeMobileNav();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    desktopMediaQuery.addEventListener("change", handleDesktopChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      desktopMediaQuery.removeEventListener("change", handleDesktopChange);
    };
  }, [closeMobileNav, mobileNavOpen]);

  return (
    <>
      <header
        className={[
          styles.header,
          styles[`width_${widthMode}`],
          styles[`density_${density}`],
          styles[`sticky_${stickyMode}`],
          isScrolled ? styles.scrolled : "",
        ].filter(Boolean).join(" ")}
      >
        {topBand ? (
          <div className={styles.topBand}>
            <HeaderContainer width={headerContainerWidth} className={styles.topBandContent}>
              <div className={styles.topBandMeta}>
                {topBand.phone ? (
                  <a href={`tel:${topBand.phone.replace(/\s+/g, "")}`} className={styles.topBandMetaLink}>
                    <Icon name="call" size="sm" decorative className={styles.topBandMetaIcon} />
                    <span className={styles.topBandMetaText}>{topBand.phone}</span>
                  </a>
                ) : null}
                {topBand.email ? (
                  <a href={`mailto:${topBand.email}`} className={styles.topBandMetaLink}>
                    <Icon name="mail" size="sm" decorative className={styles.topBandMetaIcon} />
                    <span className={styles.topBandMetaText}>{topBand.email}</span>
                  </a>
                ) : null}
              </div>
              {topBand.socialLinks?.length ? (
                <div className={styles.topBandSocials}>
                  {topBand.socialLinks.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      className={styles.topBandSocialLink}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                    >
                      <SocialIcon network={item.key} className={styles.topBandSocialIcon} />
                    </a>
                  ))}
                </div>
              ) : null}
            </HeaderContainer>
          </div>
        ) : null}

        <HeaderContainer width={headerContainerWidth} className={styles.bar}>
            <Link href={homeHref} className={styles.brandCluster}>
              <div className={hasLogo ? styles.brandLogo : styles.brandMark}>
                {hasLogo ? (
                  <Image
                    src={logoAsset.publicUrl}
                    alt={logoAlt || logoAsset.alt || `${siteName || hubSlug} logo`}
                    className={styles.brandImage}
                    fill
                    sizes="(max-width: 640px) 10rem, 14rem"
                    unoptimized
                  />
                ) : (
                  "HB"
                )}
              </div>
              {!hasLogo ? (
                <div className={styles.brandCopy}>
                  <strong>{siteName || hubSlug}</strong>
                </div>
              ) : null}
            </Link>

            <div className={styles.desktopNav}>
              <PublicShellNav items={navItems} align={navAlign} />
            </div>

            <div className={styles.desktopActions}>
              {utility.viewerState === "anonymous" && utility.primaryAction?.href && headerCta?.key !== "join" ? (
                <PublicAuthButton hubSlug={hubSlug} route="join" variant="ghost">
                  {utility.primaryAction.label}
                </PublicAuthButton>
              ) : null}
              {utility.viewerState === "anonymous" && utility.secondaryAction?.href ? (
                <PublicAuthButton hubSlug={hubSlug} route="sign-in" variant="secondary">
                  {utility.secondaryAction.label}
                </PublicAuthButton>
              ) : null}
              {utility.viewerState !== "anonymous" ? <PublicUtilityMenu hubSlug={hubSlug} utility={utility} /> : null}
              {headerCta?.kind === "auth" ? (
                <PublicAuthButton
                  hubSlug={hubSlug}
                  route={headerCta.route}
                  variant="primary"
                  className={styles.headerCta}
                >
                  {headerCta.label}
                </PublicAuthButton>
              ) : null}
              {headerCta?.kind === "link" && headerCta.href ? (
                <Button href={headerCta.href} className={styles.headerCta}>
                  {headerCta.label}
                </Button>
              ) : null}
            </div>

            <div className={styles.mobileActions}>
              {headerCta?.kind === "auth" ? (
                <PublicAuthButton
                  hubSlug={hubSlug}
                  route={headerCta.route}
                  variant="primary"
                  size="sm"
                  className={styles.mobileHeaderCta}
                >
                  {headerCta.label}
                </PublicAuthButton>
              ) : null}
              {headerCta?.kind === "link" && headerCta.href ? (
                <Button href={headerCta.href} size="sm" className={[styles.headerCta, styles.mobileHeaderCta].join(" ")}>
                  {headerCta.label}
                </Button>
              ) : null}
              {utility.viewerState === "anonymous" && utility.secondaryAction?.href ? (
                <PublicAuthButton hubSlug={hubSlug} route="sign-in" variant="ghost" size="sm">
                  {utility.secondaryAction.label}
                </PublicAuthButton>
              ) : null}
              {utility.viewerState !== "anonymous" ? <PublicUtilityMenu hubSlug={hubSlug} utility={utility} /> : null}
              <NavToggleButton
                open={mobileNavOpen}
                onClick={() => setMobileNavOpen((current) => !current)}
                label={mobileNavOpen ? "Close main menu" : "Open main menu"}
                aria-controls={mobilePanelId}
              />
            </div>
        </HeaderContainer>
      </header>

      <PublicMobileNav
        id={mobilePanelId}
        hubSlug={hubSlug}
        navItems={navItems}
        utility={utility}
        cta={headerCta}
        drawerSurface={drawerSurface}
        open={mobileNavOpen}
        onClose={closeMobileNav}
      />
    </>
  );
}
