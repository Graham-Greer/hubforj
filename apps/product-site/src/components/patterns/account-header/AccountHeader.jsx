"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { commercialAccountNavItems } from "@/lib/navigation/account-nav";
import SiteMark from "@/components/patterns/site-mark/SiteMark";

const DEFAULT_MOBILE_NAV_OFFSET = 88;

export default function AccountHeader({ ownerName, signOutAction }) {
  const pathname = usePathname();
  const mobilePanelId = useId();
  const headerRef = useRef(null);
  const [mobileNavPath, setMobileNavPath] = useState("");
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [mobileNavOffset, setMobileNavOffset] = useState(DEFAULT_MOBILE_NAV_OFFSET);
  const mobileNavOpen = mobileNavPath === pathname;

  function resolveMobileNavOffset() {
    if (!headerRef.current) {
      return DEFAULT_MOBILE_NAV_OFFSET;
    }

    const headerElement = headerRef.current.closest(".marketing-header");
    const offsetElement = headerElement ?? headerRef.current;

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
      <div ref={headerRef} className="account-topbar">
        <Link href="/" prefetch={false} className="site-mark">
          <SiteMark />
        </Link>
        <div className="account-topbar-nav">
          <nav aria-label="Account navigation" className="subnav">
            {commercialAccountNavItems.map((item) => {
              const isActive = item.match.test(pathname);

              return (
                <Link key={item.href} href={item.href} prefetch={false} className="subnav-link" data-active={isActive ? "true" : "false"}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="account-topbar-actions">
          <div className="account-identity">
            <strong>{ownerName || "Account owner"}</strong>
          </div>
          <form action={signOutAction} className="account-signout-form">
            <button type="submit" className="button-link" data-variant="secondary">
              Sign out
            </button>
          </form>
        </div>
        <button
          type="button"
          className="site-nav-mobile-toggle account-mobile-toggle"
          aria-expanded={mobileNavOpen ? "true" : "false"}
          aria-controls={mobilePanelId}
          aria-label={mobileNavOpen ? "Close account navigation menu" : "Open account navigation menu"}
          onClick={() => setMobileNavPath((current) => (current === pathname ? "" : pathname))}
        >
          <span className="site-nav-mobile-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
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
                className={["site-nav-mobile-panel account-mobile-panel", mobileNavOpen ? "is-open" : ""].filter(Boolean).join(" ")}
                aria-label="Mobile account navigation"
                aria-hidden={!mobileNavOpen}
                style={{ "--mobile-nav-offset": `${mobileNavOffset}px` }}
              >
                <div className="site-nav-mobile-panel-inner">
                  <nav className="site-nav-mobile-links" aria-label="Mobile account navigation">
                    {commercialAccountNavItems.map((item) => {
                      const isActive = item.match.test(pathname);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          className="site-nav-mobile-link"
                          data-active={isActive ? "true" : "false"}
                          onClick={() => setMobileNavPath("")}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="account-mobile-panel-footer">
                    <p className="account-mobile-panel-owner">{ownerName || "Account owner"}</p>
                    <form action={signOutAction} className="account-mobile-signout-form">
                      <button type="submit" className="button-link" data-variant="secondary">
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
