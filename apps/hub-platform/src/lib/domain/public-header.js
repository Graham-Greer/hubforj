import { getTemplateDefinition } from "../templates/template-registry.js";
import { buildPublicSocialItems } from "./public-social-links.js";
import { resolvePublicHeaderNav } from "./public-routes.js";
import { buildHubRuntimeHref } from "./hub-runtime-paths.js";

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

function resolveHeaderVariants(templateKey) {
  const templateDefinition = getTemplateDefinition(templateKey);
  const header = templateDefinition?.header || {};

  return {
    contentWidth: templateDefinition?.contentWidth || "default",
    variant: header.variant || "standard",
    widthMode: header.widthMode || "content",
    navAlign: header.navAlign || "start",
    density: header.density || "comfortable",
    stickyMode: header.stickyMode || "soft",
    mobileDrawerSurface: header.mobileDrawerSurface || "integrated",
    topBand: header.topBand || "none",
    primaryCta: header.primaryCtaMode || "single",
  };
}

function resolveHeaderTopBand(siteSettings, variants) {
  if (variants.topBand !== "info") {
    return null;
  }

  const phone = normalizeString(siteSettings?.contactPhone);
  const email = normalizeString(siteSettings?.contactEmail);
  const socialLinks = buildPublicSocialItems(siteSettings?.socialLinks || {});

  if (!phone && !email && socialLinks.length === 0) {
    return null;
  }

  return {
    kind: "info",
    phone,
    email,
    socialLinks,
  };
}

function resolveHeaderCtaModel({ hub, siteSettings, viewerState, variants, routeMode }) {
  if (variants.primaryCta !== "single") {
    return null;
  }

  const ctaKey = normalizeString(siteSettings?.header?.primaryCtaKey);
  const hubSlug = normalizeString(hub?.slug);

  if (ctaKey === "join") {
    if (viewerState.key !== "anonymous") {
      return null;
    }

    return {
      key: "join",
      label: "Become a member",
      kind: "auth",
      route: "join",
      href: buildHubRuntimeHref(hubSlug, "/join", routeMode),
    };
  }

  if (ctaKey === "contact") {
    return {
      key: "contact",
      label: "Contact us",
      kind: "link",
      href: `${buildHubRuntimeHref(hubSlug, "/", routeMode)}#footer-contact`,
    };
  }

  return null;
}

export function resolvePublicViewerState({ memberSession = null, adminSession = null } = {}) {
  if (adminSession?.user) {
    return {
      key: "admin",
      user: adminSession.user,
    };
  }

  if (memberSession?.user) {
    return {
      key: "member",
      user: memberSession.user,
    };
  }

  return {
    key: "anonymous",
    user: null,
  };
}

export function resolvePublicUtilityModel({ hub, viewerState, routeMode = "path" }) {
  const hubSlug = normalizeString(hub?.slug);

  if (viewerState.key === "member") {
    return {
      viewerState: "member",
      avatar: createAvatarModel(viewerState.user),
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

  if (viewerState.key === "admin") {
    return {
      viewerState: "admin",
      avatar: createAvatarModel(viewerState.user),
      menuItems: [
        { key: "admin", label: "Admin", href: buildHubRuntimeHref(hubSlug, "/admin", routeMode) },
      ],
      primaryAction: { label: "Admin", href: buildHubRuntimeHref(hubSlug, "/admin", routeMode) },
      signOutEnabled: true,
    };
  }

  return {
    viewerState: "anonymous",
    avatar: null,
    menuItems: [],
    primaryAction: { label: "Join", href: buildHubRuntimeHref(hubSlug, "/join", routeMode) },
    secondaryAction: { label: "Sign in", href: buildHubRuntimeHref(hubSlug, "/sign-in", routeMode) },
    signOutEnabled: false,
  };
}

export function resolvePublicHeaderModel({ hub, siteSettings, memberSession = null, adminSession = null, routeMode = "path" }) {
  const viewerState = resolvePublicViewerState({ memberSession, adminSession });
  const utility = resolvePublicUtilityModel({ hub, viewerState, routeMode });
  const templateKey = normalizeString(hub?.templateKey || hub?.template);
  const variants = resolveHeaderVariants(templateKey);
  const topBand = resolveHeaderTopBand(siteSettings, variants);
  const cta = resolveHeaderCtaModel({ hub, siteSettings, viewerState, variants, routeMode });

  return {
    brand: {
      siteName: normalizeString(siteSettings?.siteName) || normalizeString(hub?.name),
      logoAsset: siteSettings?.logoAsset || null,
      logoAlt: normalizeString(siteSettings?.logoAlt),
      homeHref: buildHubRuntimeHref(normalizeString(hub?.slug), "/", routeMode),
    },
    navigation: {
      items: resolvePublicHeaderNav(hub, siteSettings?.capabilities, routeMode),
      desktopAlign: variants.navAlign,
    },
    utility,
    cta,
    topBand,
    variants,
    template: {
      key: templateKey,
    },
  };
}
