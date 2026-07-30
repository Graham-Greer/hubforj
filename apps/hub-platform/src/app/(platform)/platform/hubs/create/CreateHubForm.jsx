"use client";

import { useActionState, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import Select from "@/components/ui/select/Select";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import Textarea from "@/components/ui/textarea/Textarea";
import { resolvePackageEntitlements } from "@/lib/domain/package-entitlements";
import { packageTierOptions } from "@/lib/domain/package-tiers";
import {
  getAllowedLocalesForCountry,
  getAllowedTimezonesForCountry,
  getDefaultCurrencyForCountry,
  getSupportedCountryOptions,
} from "@/lib/domain/regional-markets";
import { supportedTemplateOptions } from "@/lib/templates/template-registry";
import { initialCreateHubFormState } from "./form-state";
import { createHubAction } from "./actions";
import styles from "./page.module.css";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const countryOptions = getSupportedCountryOptions();
const defaultCountry = initialCreateHubFormState.values.country || "US";

function buildSelectOptions(values) {
  return values.map((value) => ({ value, label: value }));
}

export default function CreateHubForm() {
  const [state, formAction] = useActionState(createHubAction, initialCreateHubFormState);
  const values = {
    ...initialCreateHubFormState.values,
    ...(state?.values || {}),
  };
  const [packageTier, setPackageTier] = useState(values.packageTier);
  const [country, setCountry] = useState(values.country || defaultCountry);
  const [locale, setLocale] = useState(values.locale || getAllowedLocalesForCountry(country)[0] || "en-US");
  const [timezone, setTimezone] = useState(values.timezone || getAllowedTimezonesForCountry(country)[0] || "America/New_York");
  const localeOptions = useMemo(
    () => buildSelectOptions(getAllowedLocalesForCountry(country)),
    [country],
  );
  const timezoneOptions = useMemo(
    () => buildSelectOptions(getAllowedTimezonesForCountry(country)),
    [country],
  );
  const defaultCurrency = getDefaultCurrencyForCountry(country);
  const selectedEntitlements = resolvePackageEntitlements({ packageTier });
  const canUseCustomDomain = selectedEntitlements.capabilities.customDomainEnabled === true;

  return (
    <>
      {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      <form className={styles.form} action={formAction}>
        {!canUseCustomDomain ? (
          <PackageUpgradeNotice
            title="Custom domains are locked on the selected package"
            description="Free and Starter hubs stay on their Hubforj-hosted address. Choose Growth when the client needs a branded custom domain from the outset."
            currentUsage={0}
            limit={0}
            unlocks={[
              "Use a client-owned custom domain",
              "Keep the public experience fully branded",
              "Align the hub with Growth-level commercial capabilities",
            ]}
          />
        ) : null}
        <div className={styles.grid}>
          <Input name="hubName" label="Hub name" placeholder="Oak Hill Community" hint="This is the primary internal and public-facing name." defaultValue={values.hubName} />
          <Input
            name="hubSlug"
            label="Hub slug"
            placeholder="oak-hill"
            hint="Used to generate the Hubforj-hosted address and default public and admin routes."
            defaultValue={values.hubSlug}
          />
          <Input name="contactEmail" label="Contact email" type="email" placeholder="hello@oakhill.community" hint="Primary operational contact for the hub." defaultValue={values.contactEmail} />
          <Input
            name="primaryDomain"
            label="Primary domain"
            placeholder="oakhill.example.com"
            hint={
              canUseCustomDomain
                ? "Growth hubs can be provisioned with a custom domain from the start."
                : "Custom domain is unavailable on the selected package."
            }
            defaultValue={values.primaryDomain}
            disabled={!canUseCustomDomain}
          />
          <Select
            name="packageTier"
            label="Package tier"
            options={packageTierOptions}
            hint="Transitional: mirror the package the client chose on the product site."
            defaultValue={values.packageTier}
            onChange={(event) => setPackageTier(event.target.value)}
          />
          <Select name="template" label="Template family" options={supportedTemplateOptions} hint="Templates should bias tone, not restrict serious theming." defaultValue={values.template} />
          <Select name="theme" label="Default theme" options={themeOptions} hint="Each hub can be light or dark by default." defaultValue={values.theme} />
          <Select
            name="country"
            label="Country"
            options={countryOptions}
            hint="This is the canonical business country for the hub and future Stripe setup."
            value={country}
            onChange={(event) => {
              const nextCountry = event.target.value;
              setCountry(nextCountry);
              setLocale(getAllowedLocalesForCountry(nextCountry)[0] || "en-US");
              setTimezone(getAllowedTimezonesForCountry(nextCountry)[0] || "America/New_York");
            }}
          />
          <Select
            name="locale"
            label="Locale"
            options={localeOptions}
            hint="Default locale for date, time, and public formatting."
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
          />
          <Select
            name="timezone"
            label="Timezone"
            options={timezoneOptions}
            hint="Used for scheduling, recurring operations, and operational timestamps."
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          />
          <Input
            name="defaultCurrency_display"
            label="Default currency"
            value={defaultCurrency}
            hint="New paid offerings and payment defaults will inherit this currency."
            readOnly
          />
          <input type="hidden" name="defaultCurrency" value={defaultCurrency} />
        </div>
        <Textarea
          name="description"
          label="Hub description"
          placeholder="Describe the hub in a way that can support both internal context and public-site usage later."
          hint="Structured hub context, not internal operator notes."
          defaultValue={values.description}
        />
        <div className={styles.actions}>
          <SubmitButton idleLabel="Provision hub" pendingLabel="Provisioning hub..." />
          <Button href="/platform/hubs" variant="secondary">
            Back to hubs
          </Button>
        </div>
      </form>
    </>
  );
}
