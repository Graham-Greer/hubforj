"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import {
  getAllowedLocalesForCountry,
  getAllowedTimezonesForCountry,
  getCountryRegionalConfig,
  getDefaultLocaleForCountry,
  getSupportedCountryOptions,
} from "@/lib/domain/regional-markets";
import { initialRegionalSetupState } from "../settings/form-state";
import { completeRegionalSetupAction } from "./actions";
import styles from "../settings/settings.module.css";

const supportedCountryOptions = getSupportedCountryOptions();

function buildSimpleOptions(values = []) {
  return values.map((value) => ({ value, label: value }));
}

export default function RegionalSetupForm({ hub, initialValues }) {
  const initialState = {
    ...initialRegionalSetupState,
    values: {
      ...initialRegionalSetupState.values,
      ...initialValues,
    },
  };
  const [state, formAction] = useActionState(completeRegionalSetupAction, initialState);
  const values = {
    ...initialState.values,
    ...(state?.values || {}),
  };
  const [selectedCountry, setSelectedCountry] = useState(values.country || "");
  const [selectedLocale, setSelectedLocale] = useState(values.locale || "");
  const [selectedTimezone, setSelectedTimezone] = useState(values.timezone || "");
  const [selectedDefaultCurrency, setSelectedDefaultCurrency] = useState(values.defaultCurrency || "");
  const [lastValues, setLastValues] = useState({
    country: values.country || "",
    defaultCurrency: values.defaultCurrency || "",
    locale: values.locale || "",
    timezone: values.timezone || "",
  });
  const feedbackRef = useRef(null);
  const router = useRouter();
  const regionalMarket = useMemo(
    () => getCountryRegionalConfig(selectedCountry),
    [selectedCountry]
  );
  const localeOptions = useMemo(
    () => buildSimpleOptions(getAllowedLocalesForCountry(selectedCountry)),
    [selectedCountry]
  );
  const timezoneOptions = useMemo(
    () => buildSimpleOptions(getAllowedTimezonesForCountry(selectedCountry)),
    [selectedCountry]
  );
  const currencyOptions = useMemo(
    () => buildSimpleOptions(regionalMarket?.allowedCurrencies || []),
    [regionalMarket]
  );

  const nextValues = {
    country: values.country || "",
    defaultCurrency: values.defaultCurrency || "",
    locale: values.locale || "",
    timezone: values.timezone || "",
  };

  if (
    lastValues.country !== nextValues.country ||
    lastValues.defaultCurrency !== nextValues.defaultCurrency ||
    lastValues.locale !== nextValues.locale ||
    lastValues.timezone !== nextValues.timezone
  ) {
    setLastValues(nextValues);
    setSelectedCountry(nextValues.country);
    setSelectedLocale(nextValues.locale);
    setSelectedTimezone(nextValues.timezone);
    setSelectedDefaultCurrency(nextValues.defaultCurrency);
  }

  useEffect(() => {
    if (!feedbackRef.current || (!state?.error && !state?.success)) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error, state?.success]);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    router.push(`/${hub.slug}/admin`);
  }, [hub.slug, router, state?.success]);

  return (
    <form
      className={styles.form}
      action={formAction}
      data-onboarding="regional-setup-form"
    >
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <AdminFormSection title="Regional setup">
        <div className={styles.grid}>
          <AdminSelect
            name="country"
            label="Country"
            value={selectedCountry}
            options={supportedCountryOptions}
            onChange={(event) => {
              const nextCountry = event.target.value;
              const nextMarket = getCountryRegionalConfig(nextCountry);

              setSelectedCountry(nextCountry);
              setSelectedLocale(getDefaultLocaleForCountry(nextCountry));
              setSelectedTimezone(nextMarket?.defaultTimezone || "");
              setSelectedDefaultCurrency(nextMarket?.defaultCurrency || "");
            }}
            required
            requiredIndicator
            hint="Choose the country your community operates in. This drives timezone, currency, and future Stripe Connect setup."
          />
          <AdminSelect
            name="locale"
            label="Date and number format"
            value={selectedLocale}
            options={localeOptions}
            onChange={(event) => setSelectedLocale(event.target.value)}
            required
            requiredIndicator
            hint="Launch formatting stays English-only. This controls how dates and money are displayed."
          />
          <AdminSelect
            name="timezone"
            label="Timezone"
            value={selectedTimezone}
            options={timezoneOptions}
            onChange={(event) => setSelectedTimezone(event.target.value)}
            required
            requiredIndicator
            hint="Events, courses, recurring schedules, and reminders will use this timezone."
          />
          <AdminSelect
            name="defaultCurrency"
            label="Community currency"
            value={selectedDefaultCurrency}
            options={currencyOptions}
            onChange={(event) => setSelectedDefaultCurrency(event.target.value)}
            required
            requiredIndicator
            hint="Paid offerings and membership plans will default to this currency for your members."
          />
        </div>
      </AdminFormSection>
      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <SubmitButton
          idleLabel="Complete regional setup"
          pendingLabel="Saving regional setup"
          onboardingKey="regional-setup-save"
        />
      </AdminFormFooter>
    </form>
  );
}
