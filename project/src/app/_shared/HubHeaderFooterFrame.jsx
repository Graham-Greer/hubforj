import HeaderSection from "@/components/sections/headers/HeaderSection";
import FooterSection from "@/components/sections/footers/FooterSection";
import { resolveHeaderFooterSelection } from "@/lib/data/pages/layout-config";

function joinPath(basePath, path) {
  const base = String(basePath || "").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${suffix}` : suffix;
}

function buildHeaderProps(basePath) {
  return {
    navItems: [
      { label: "Home", href: joinPath(basePath, "/") },
      { label: "Events", href: joinPath(basePath, "/events") },
      { label: "Pages", href: joinPath(basePath, "/pages") },
    ],
    cta: {
      label: "Join",
      href: joinPath(basePath, "/join"),
    },
  };
}

function buildFooterProps(basePath) {
  return {
    linkGroups: [
      {
        label: "Explore",
        links: [
          { label: "Events", href: joinPath(basePath, "/events") },
          { label: "Contact", href: joinPath(basePath, "/contact") },
        ],
      },
      {
        label: "Account",
        links: [
          { label: "Sign in", href: joinPath(basePath, "/sign-in") },
          { label: "Member portal", href: joinPath(basePath, "/account") },
        ],
      },
    ],
    contact: {
      email: "hello@communityhub.local",
    },
    cta: {
      title: "Become a member",
      body: "Unlock members-only events and resources.",
      label: "Join now",
      href: joinPath(basePath, "/join"),
    },
  };
}

export default function HubHeaderFooterFrame({ hub, page, basePath = "", children }) {
  const selection = resolveHeaderFooterSelection({ hub, page });
  const headerProps = buildHeaderProps(basePath);
  const footerProps = buildFooterProps(basePath);

  return (
    <>
      <HeaderSection variant={selection.effectiveHeaderId} {...headerProps} />
      {children}
      <FooterSection variant={selection.effectiveFooterId} {...footerProps} />
    </>
  );
}
