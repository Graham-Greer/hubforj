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
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { PUBLIC_AUTH_SESSION_EVENT } from "./publicAuthSessionEvent";
import styles from "./PublicHeader.module.css";

function normalizeString(value) {
  return String(value || "").trim();
}

function createAvatarModel(user = null) {
  const name = normalizeString(user?.name);
  const fallbackLabel = name || normalizeString(user?.email) || "Signed-in user";
  const parts = fallbackLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = parts.length > 0
    ? parts.map((part) => part.charAt(0).toUpperCase()).join("")
    : fallbackLabel.slice(0, 2).toUpperCase();

  return {
    imageUrl: normalizeString(user?.avatarAsset?.publicUrl),
    initials: initials || "U",
    fallbackLabel,
  };
}

function buildSignedInUtility({ hubSlug, routeMode, viewer }) {
  const viewerState = viewer?.viewerState === "admin" ? "admin" : "member";

  if (viewerState === "admin") {
    return {
      viewerState: "admin",
      avatar: createAvatarModel(viewer?.user),
      menuItems: [
        { key: "admin", label: "Admin", href: buildHubRuntimeHref(hubSlug, "/admin", routeMode) },
      ],
      primaryAction: { label: "Admin", href: buildHubRuntimeHref(hubSlug, "/admin", routeMode) },
      signOutEnabled: true,
    };
  }

  return {
    viewerState: "member",
    avatar: createAvatarModel(viewer?.user),
    menuItems: [
      { key: "overview", label: "Overview", href: buildHubRuntimeHref(hubSlug, "/account", routeMode) },
      { key: "bookings", label: "My Bookings", href: buildHubRuntimeHref(hubSlug, "/account/bookings", routeMode) },
      { key: "membership", label: "Membership", href: buildHubRuntimeHref(hubSlug, "/account/membership", routeMode) },
      { key: "billing", label: "Billing", href: buildHubRuntimeHref(hubSlug, "/account/billing", routeMode) },
      { key: "profile", label: "Profile", href: buildHubRuntimeHref(hubSlug, "/account/profile", routeMode) },
    ],
    primaryAction: { label: "Overview", href: buildHubRuntimeHref(hubSlug, "/account", routeMode) },
    signOutEnabled: true,
  };
}

export default function PublicHeader({ hubSlug, routeMode = "path", headerModel }) {
  const mobilePanelId = useId();
  const [currentHeaderModel, setCurrentHeaderModel] = useState(headerModel);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);
  const siteName = currentHeaderModel?.brand?.siteName || hubSlug;
  const homeHref = currentHeaderModel?.brand?.homeHref || `/${hubSlug}`;
  const logoAsset = currentHeaderModel?.brand?.logoAsset || null;
  const logoAlt = currentHeaderModel?.brand?.logoAlt || "";
  const hasLogo = Boolean(logoAsset?.publicUrl);
  const navItems = currentHeaderModel?.navigation?.items || [];
  const navAlign = currentHeaderModel?.navigation?.desktopAlign || "start";
  const utility = currentHeaderModel?.utility || { viewerState: "anonymous" };
  const headerCta = currentHeaderModel?.cta || null;
  const topBand = currentHeaderModel?.topBand || null;
  const variants = currentHeaderModel?.variants || {};
  const widthMode = variants.widthMode || "content";
  const density = variants.density || "comfortable";
  const stickyMode = variants.stickyMode || "soft";
  const drawerSurface = variants.mobileDrawerSurface || "integrated";
  const headerContainerWidth = widthMode === "full" ? "full" : variants.contentWidth || "default";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setCurrentHeaderModel(headerModel);
  }, [headerModel]);

  useEffect(() => {
    function handleAuthSession(event) {
      const viewer = event?.detail?.viewer;

      if (!viewer?.viewerState) {
        return;
      }

      setCurrentHeaderModel((current) => ({
        ...current,
        utility: buildSignedInUtility({ hubSlug, routeMode, viewer }),
        cta: current?.cta?.kind === "auth" ? null : current?.cta || null,
      }));
    }

    window.addEventListener(PUBLIC_AUTH_SESSION_EVENT, handleAuthSession);

    return () => {
      window.removeEventListener(PUBLIC_AUTH_SESSION_EVENT, handleAuthSession);
    };
  }, [hubSlug, routeMode]);

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
            <Link href={homeHref} prefetch={false} className={styles.brandCluster}>
              <div className={hasLogo ? styles.brandLogo : styles.brandMark}>
                {hasLogo ? (
                  <Image
                    src={logoAsset.publicUrl}
                    alt={logoAlt || logoAsset.alt || `${siteName || hubSlug} logo`}
                    className={styles.brandImage}
                    fill
                    sizes="(max-width: 640px) 10rem, 14rem"
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
                <PublicAuthButton hubSlug={hubSlug} route="join" routeMode={routeMode} variant="ghost">
                  {utility.primaryAction.label}
                </PublicAuthButton>
              ) : null}
              {utility.viewerState === "anonymous" && utility.secondaryAction?.href ? (
                <PublicAuthButton hubSlug={hubSlug} route="sign-in" routeMode={routeMode} variant="secondary">
                  {utility.secondaryAction.label}
                </PublicAuthButton>
              ) : null}
              {utility.viewerState !== "anonymous" ? <PublicUtilityMenu hubSlug={hubSlug} routeMode={routeMode} utility={utility} /> : null}
              {headerCta?.kind === "auth" ? (
                <PublicAuthButton
                  hubSlug={hubSlug}
                  route={headerCta.route}
                  routeMode={routeMode}
                  variant="primary"
                  className={styles.headerCta}
                >
                  {headerCta.label}
                </PublicAuthButton>
              ) : null}
              {headerCta?.kind === "link" && headerCta.href ? (
                <Button href={headerCta.href} prefetch={false} className={styles.headerCta}>
                  {headerCta.label}
                </Button>
              ) : null}
            </div>

            <div className={styles.mobileActions}>
              {headerCta?.kind === "auth" ? (
                <PublicAuthButton
                  hubSlug={hubSlug}
                  route={headerCta.route}
                  routeMode={routeMode}
                  variant="primary"
                  size="sm"
                  className={styles.mobileHeaderCta}
                >
                  {headerCta.label}
                </PublicAuthButton>
              ) : null}
              {headerCta?.kind === "link" && headerCta.href ? (
                <Button href={headerCta.href} prefetch={false} size="sm" className={[styles.headerCta, styles.mobileHeaderCta].join(" ")}>
                  {headerCta.label}
                </Button>
              ) : null}
              {utility.viewerState === "anonymous" && utility.secondaryAction?.href ? (
                <PublicAuthButton hubSlug={hubSlug} route="sign-in" routeMode={routeMode} variant="ghost" size="sm">
                  {utility.secondaryAction.label}
                </PublicAuthButton>
              ) : null}
              {utility.viewerState !== "anonymous" ? <PublicUtilityMenu hubSlug={hubSlug} routeMode={routeMode} utility={utility} /> : null}
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
        routeMode={routeMode}
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
