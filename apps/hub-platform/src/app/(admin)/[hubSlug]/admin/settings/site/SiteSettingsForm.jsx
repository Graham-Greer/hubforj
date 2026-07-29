"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDiscardChangesButton from "@/components/patterns/admin-form-runtime/AdminDiscardChangesButton";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  getAllowedLocalesForCountry,
  getAllowedTimezonesForCountry,
  getCountryRegionalConfig,
  getDefaultLocaleForCountry,
  getSupportedCountryOptions,
  resolveRegionalDefaults,
} from "@/lib/domain/regional-markets";
import FormMessage from "@/components/ui/form-message/FormMessage";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import { initialSiteSettingsState } from "../form-state";
import { updateSiteSettingsAction } from "../actions";
import styles from "../settings.module.css";

const fieldKeys = Object.keys(initialSiteSettingsState.values);

const supportedCountryOptions = getSupportedCountryOptions();

function createSavedValuesSnapshot(values) {
  return createSavedSnapshotFromKeys(fieldKeys, initialSiteSettingsState.values, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

function buildSimpleOptions(values = []) {
  return values.map((value) => ({ value, label: value }));
}

export default function SiteSettingsForm({ hub, initialValues, countryLocked = false }) {
  const router = useRouter();
  const initialState = {
    ...initialSiteSettingsState,
    values: {
      ...initialSiteSettingsState.values,
      ...initialValues,
    },
  };
  const initialSavedSnapshot = createSavedValuesSnapshot(initialState.values);
  const [state, formAction] = useActionState(updateSiteSettingsAction, initialState);
  const initialValuesRef = useRef(initialState.values);
  const feedbackRef = useRef(null);
  const values = {
    ...initialState.values,
    ...(state?.values || {}),
  };
  const resolvedRegionalDefaults = useMemo(
    () =>
      resolveRegionalDefaults({
        country: values.country,
        locale: values.locale,
        timezone: values.timezone,
        defaultCurrency: values.defaultCurrency,
      }),
    [values.country, values.defaultCurrency, values.locale, values.timezone]
  );
  const [selectedCountry, setSelectedCountry] = useState(values.country || "");
  const [selectedLocale, setSelectedLocale] = useState(resolvedRegionalDefaults.locale || "");
  const [selectedTimezone, setSelectedTimezone] = useState(resolvedRegionalDefaults.timezone || "");
  const [selectedDefaultCurrency, setSelectedDefaultCurrency] = useState(resolvedRegionalDefaults.defaultCurrency || "");
  const [selectedAddressCountry, setSelectedAddressCountry] = useState(values.addressCountry || "");
  const [lastRegionalSelection, setLastRegionalSelection] = useState({
    addressCountry: values.addressCountry || "",
    country: resolvedRegionalDefaults.country || values.country || "",
    defaultCurrency: resolvedRegionalDefaults.defaultCurrency || "",
    locale: resolvedRegionalDefaults.locale || "",
    timezone: resolvedRegionalDefaults.timezone || "",
  });
  const { formRef, isDirty, updateDirtyState, markSaved } = useDirtyFormState({
    initialSnapshot: initialSavedSnapshot,
    createFormSnapshot,
  });
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

  useEffect(() => {
    if (!feedbackRef.current || (!state?.error && !state?.success)) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error, state?.success]);

  useEffect(() => {
    if (!state?.success || !state?.values) {
      return;
    }

    const nextSnapshot = createSavedValuesSnapshot({
      ...initialValuesRef.current,
      ...state.values,
    });
    initialValuesRef.current = nextSnapshot;
    markSaved(nextSnapshot);
  }, [markSaved, state?.success, state?.values]);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    router.push(`/${hub.slug}/admin/settings`);
  }, [hub.slug, router, state?.success]);

  const nextRegionalSelection = {
    addressCountry: values.addressCountry || "",
    country: resolvedRegionalDefaults.country || values.country || "",
    defaultCurrency: resolvedRegionalDefaults.defaultCurrency || "",
    locale: resolvedRegionalDefaults.locale || "",
    timezone: resolvedRegionalDefaults.timezone || "",
  };

  if (
    lastRegionalSelection.addressCountry !== nextRegionalSelection.addressCountry ||
    lastRegionalSelection.country !== nextRegionalSelection.country ||
    lastRegionalSelection.defaultCurrency !== nextRegionalSelection.defaultCurrency ||
    lastRegionalSelection.locale !== nextRegionalSelection.locale ||
    lastRegionalSelection.timezone !== nextRegionalSelection.timezone
  ) {
    setLastRegionalSelection(nextRegionalSelection);
    setSelectedCountry(nextRegionalSelection.country);
    setSelectedLocale(nextRegionalSelection.locale);
    setSelectedTimezone(nextRegionalSelection.timezone);
    setSelectedDefaultCurrency(nextRegionalSelection.defaultCurrency);
    setSelectedAddressCountry(nextRegionalSelection.addressCountry);
  }

  const submitIdleLabel = state?.success && !isDirty ? "Site settings saved" : "Save site settings";

  return (
    <form ref={formRef} className={styles.form} action={formAction} onInput={updateDirtyState} onChange={updateDirtyState} data-onboarding="site-settings-form">
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <AdminFormSection title="Identity and contact">
        <div className={styles.grid}>
          <Input name="hubName" label="Hub name" defaultValue={values.hubName} requiredIndicator hint="Required organisation or community name used across the product." />
          <Input name="siteName" label="Site name" defaultValue={values.siteName} requiredIndicator hint="Required name used across public pages and footer surfaces." />
          <Input name="contactEmail" label="Contact email" type="email" defaultValue={values.contactEmail} requiredIndicator hint="Required public contact address used across the site." />
          <Input name="contactPhone" label="Contact phone" defaultValue={values.contactPhone} hint="Optional phone number for contact and footer display." />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Regional defaults" divider>
        <div className={styles.grid}>
          <AdminSelect
            name="country"
            label="Country"
            value={selectedCountry}
            options={supportedCountryOptions}
            onChange={(event) => {
              const nextCountry = event.target.value;
              const nextMarket = getCountryRegionalConfig(nextCountry);
              const previousAutoAddressCountry = getCountryRegionalConfig(selectedCountry)?.label || "";
              const nextAutoAddressCountry = nextMarket?.label || "";
              setSelectedCountry(nextCountry);
              setSelectedLocale(getDefaultLocaleForCountry(nextCountry));
              setSelectedTimezone(nextMarket?.defaultTimezone || "");
              setSelectedDefaultCurrency(nextMarket?.defaultCurrency || "");
              setSelectedAddressCountry((currentValue) =>
                !currentValue || currentValue === previousAutoAddressCountry
                  ? nextAutoAddressCountry
                  : currentValue
              );
            }}
            disabled={countryLocked}
            required
            requiredIndicator
            hint={
              countryLocked
                ? "Country cannot be changed after Stripe setup begins. Contact support if this business country needs to change."
                : "Choose the business country for this hub. Locale, timezone, and currency defaults follow from this market."
            }
          />
          {countryLocked ? <input type="hidden" name="country" value={selectedCountry} /> : null}
          <AdminSelect
            name="locale"
            label="Locale"
            value={selectedLocale}
            options={localeOptions}
            onChange={(event) => setSelectedLocale(event.target.value)}
            required
            requiredIndicator
            hint="Controls date, time, and currency formatting across public and member-facing surfaces."
          />
          <AdminSelect
            name="timezone"
            label="Timezone"
            value={selectedTimezone}
            options={timezoneOptions}
            onChange={(event) => setSelectedTimezone(event.target.value)}
            required
            requiredIndicator
            hint="Controls scheduling defaults for events, courses, and recurring occurrences."
          />
          <AdminSelect
            name="defaultCurrency"
            label="Default currency"
            value={selectedDefaultCurrency}
            options={currencyOptions}
            onChange={(event) => setSelectedDefaultCurrency(event.target.value)}
            required
            requiredIndicator
            hint="New paid offerings and membership plans start from this currency unless intentionally changed."
          />
        </div>
        <FormMessage tone="info">
          Changing these regional defaults updates future events, courses, and membership plans. Existing offerings and recorded payments keep their current currency unless you edit them individually.
        </FormMessage>
      </AdminFormSection>

      <AdminFormSection title="Address" divider>
        <div className={styles.grid}>
          <Input name="addressLine1" label="Address line 1" defaultValue={values.addressLine1} requiredIndicator hint="Required primary street or venue line for structured public display." />
          <Input name="addressLine2" label="Address line 2" defaultValue={values.addressLine2} hint="Optional suite, building, or locality detail." />
          <Input name="addressCity" label="Town / city" defaultValue={values.addressCity} requiredIndicator />
          <Input name="addressStateOrProvince" label="State / province" defaultValue={values.addressStateOrProvince} />
          <Input name="addressPostalCode" label="ZIP / postal code" defaultValue={values.addressPostalCode} requiredIndicator />
          <Input
            name="addressCountry"
            label="Country"
            value={selectedAddressCountry}
            onChange={(event) => setSelectedAddressCountry(event.target.value)}
            requiredIndicator
          />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Social links" divider>
        <div className={styles.grid}>
          <Input name="facebook" label="Facebook URL" defaultValue={values.facebook} />
          <Input name="instagram" label="Instagram URL" defaultValue={values.instagram} />
          <Input name="x" label="X URL" defaultValue={values.x} />
          <Input name="linkedin" label="LinkedIn URL" defaultValue={values.linkedin} />
          <Input name="youtube" label="YouTube URL" defaultValue={values.youtube} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Hours" divider>
        <div className={styles.grid}>
          <Input name="hoursMonday" label="Monday" defaultValue={values.hoursMonday} hint="Examples: 9am - 5pm, Closed, By appointment." />
          <Input name="hoursTuesday" label="Tuesday" defaultValue={values.hoursTuesday} />
          <Input name="hoursWednesday" label="Wednesday" defaultValue={values.hoursWednesday} />
          <Input name="hoursThursday" label="Thursday" defaultValue={values.hoursThursday} />
          <Input name="hoursFriday" label="Friday" defaultValue={values.hoursFriday} />
          <Input name="hoursSaturday" label="Saturday" defaultValue={values.hoursSaturday} />
          <Input name="hoursSunday" label="Sunday" defaultValue={values.hoursSunday} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="SEO defaults" divider>
        <div className={styles.grid}>
          <Input name="seoTitle" label="SEO default title" defaultValue={values.seoTitle} requiredIndicator hint="Required fallback title for public pages without more specific metadata." />
          <Input name="seoDescription" label="SEO default description" defaultValue={values.seoDescription} requiredIndicator hint="Required fallback description for search and link previews." />
        </div>
      </AdminFormSection>
      <AdminFormFooter ref={feedbackRef} error={state?.error} success={state?.success}>
        <AdminDiscardChangesButton href={`/${hub.slug}/admin/settings`} />
        <SubmitButton
          idleLabel={submitIdleLabel}
          pendingLabel="Saving site settings"
          disabled={!isDirty}
          onboardingKey="site-settings-save"
        />
      </AdminFormFooter>
    </form>
  );
}
