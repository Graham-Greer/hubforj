"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./HubPaymentsWorkspace.module.css";

const connectScriptSrc = "https://connect-js.stripe.com/v1.0/connect.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export default function StripeEmbeddedOnboardingPanel({ hubSlug, publishableKey }) {
  const containerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [embedError, setEmbedError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (window.StripeConnect?.init) {
      setScriptLoaded(true);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (window.StripeConnect?.init) {
        setScriptLoaded(true);
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !normalizeString(hubSlug) || !normalizeString(publishableKey) || !containerRef.current) {
      return undefined;
    }

    let cancelled = false;
    let mountedElement = null;
    const container = containerRef.current;

    const fetchClientSecret = async () => {
      const response = await fetch(`/api/admin/hubs/${encodeURIComponent(hubSlug)}/payments/account-session`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(normalizeString(payload?.error) || "Unable to create a Stripe onboarding session.");
      }

      const clientSecret = normalizeString(payload?.client_secret);
      if (!clientSecret) {
        throw new Error("Stripe did not return an onboarding session client secret.");
      }

      return clientSecret;
    };

    const initialize = async () => {
      try {
        const stripeConnect = window.StripeConnect;
        if (!stripeConnect?.init) {
          throw new Error("Stripe Connect.js did not finish loading.");
        }

        const instance = stripeConnect.init({
          publishableKey,
          fetchClientSecret,
        });
        mountedElement = instance.create("account-onboarding");

        if (typeof mountedElement?.setOnExit === "function") {
          mountedElement.setOnExit(async () => {
            try {
              await fetch(`/api/admin/hubs/${encodeURIComponent(hubSlug)}/payments/sync`, { method: "POST" });
            } catch {
              // Best effort sync before reload.
            }

            window.location.reload();
          });
        }

        if (!cancelled) {
          container.replaceChildren(mountedElement);
        }
      } catch (error) {
        if (!cancelled) {
          setEmbedError(String(error?.message || "Unable to load embedded Stripe onboarding."));
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      if (mountedElement && container.contains(mountedElement)) {
        container.removeChild(mountedElement);
      } else {
        container.replaceChildren();
      }
    };
  }, [hubSlug, publishableKey, scriptLoaded]);

  return (
    <Surface padding="md" className={styles.setupEmbedPanel} data-onboarding="payments-setup-embed-panel">
      <Script
        src={connectScriptSrc}
        async
        onLoad={() => setScriptLoaded(true)}
        onReady={() => setScriptLoaded(true)}
      />
      <div className={styles.setupGuidanceStack}>
        <h3 className={styles.planAccordionTitle}>Embedded Stripe onboarding</h3>
        <p className={styles.detail}>
          Complete Stripe onboarding here without leaving Hubforj. When you exit the embedded flow, we immediately sync
          the latest Stripe account state back into this setup workspace.
        </p>
      </div>
      {embedError ? <FormMessage tone="danger">{embedError}</FormMessage> : null}
      <div ref={containerRef} className={styles.setupEmbedContainer}>
        {!scriptLoaded ? <p className={styles.detail}>Loading Stripe onboarding...</p> : null}
      </div>
    </Surface>
  );
}
