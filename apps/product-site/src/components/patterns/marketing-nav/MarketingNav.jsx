"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import SiteMark from "@/components/patterns/site-mark/SiteMark";

const DEFAULT_MOBILE_NAV_OFFSET = 88;

export default function MarketingNav({ hasAccountSession = false }) {
  const pathname = usePathname();
  const mobilePanelId = useId();
  const navRef = useRef(null);
  const [mobileNavPath, setMobileNavPath] = useState("");
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [mobileNavOffset, setMobileNavOffset] = useState(DEFAULT_MOBILE_NAV_OFFSET);
  const mobileNavOpen = mobileNavPath === pathname;
  const marketingNavItems = hasAccountSession
    ? [
        { href: "/pricing", label: "Pricing" },
        { href: "/account", label: "Account" },
      ]
    : [
        { href: "/", label: "Overview" },
        { href: "/pricing", label: "Pricing" },
        { href: "/signup", label: "Signup" },
        { href: "/sign-in", label: "Sign in" },
      ];

  function resolveMobileNavOffset() {
    if (!navRef.current) {
      return DEFAULT_MOBILE_NAV_OFFSET;
    }

    const headerElement = navRef.current.closest(".marketing-header");
    const offsetElement = headerElement ?? navRef.current;

    return Math.round(offsetElement.getBoundingClientRect().bottom);
  }

  useEffect(() => {
    function updateMobileNavOffset() {
      setMobileNavOffset(resolveMobileNavOffset());
    }

    updateMobileNavOffset();
    window.addEventListener("resize", updateMobileNavOffset);

    return () => {
      window.removeEventListener("resize", updateMobileNavOffset);
    };
  }, []);

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

    function updateMobileNavOffset() {
      setMobileNavOffset(resolveMobileNavOffset());
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileNavPath("");
      }
    }

    const desktopMediaQuery = window.matchMedia("(min-width: 54.001rem)");

    function handleDesktopChange(event) {
      if (event.matches) {
        setMobileNavPath("");
      }
    }

    updateMobileNavOffset();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMobileNavOffset);
    desktopMediaQuery.addEventListener("change", handleDesktopChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMobileNavOffset);
      desktopMediaQuery.removeEventListener("change", handleDesktopChange);
    };
  }, [mobileNavOpen]);

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Product site"
        className="site-nav"
      >
        <Link href="/" className="site-mark">
          <SiteMark />
        </Link>
        <div className="site-nav-links">
          {marketingNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="site-nav-link" data-active={isActive ? "true" : "false"}>
                {item.label}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          className="site-nav-mobile-toggle"
          aria-expanded={mobileNavOpen ? "true" : "false"}
          aria-controls={mobilePanelId}
          aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMobileNavPath((current) => (current === pathname ? "" : pathname))}
        >
          <span className="site-nav-mobile-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </nav>
      {isMounted
        ? createPortal(
            <>
              <div
                className={["site-nav-mobile-overlay", mobileNavOpen ? "is-open" : ""].filter(Boolean).join(" ")}
                aria-hidden={!mobileNavOpen}
                style={{ "--mobile-nav-offset": `${mobileNavOffset}px` }}
                onClick={() => setMobileNavPath("")}
              />
              <div
                id={mobilePanelId}
                className={["site-nav-mobile-panel", mobileNavOpen ? "is-open" : ""].filter(Boolean).join(" ")}
                aria-label="Mobile product navigation"
                aria-hidden={!mobileNavOpen}
                style={{ "--mobile-nav-offset": `${mobileNavOffset}px` }}
              >
                <div className="site-nav-mobile-panel-inner">
                  <nav className="site-nav-mobile-links" aria-label="Mobile product site">
                    {marketingNavItems.map((item) => {
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="site-nav-mobile-link"
                          data-active={isActive ? "true" : "false"}
                          onClick={() => setMobileNavPath("")}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
