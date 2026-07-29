"use client";

import { useActionState, useMemo, useState } from "react";
import MarketingSelect from "@/components/patterns/marketing-select/MarketingSelect";
import { createProductSiteSignupAction } from "./actions";
import { deriveHubSlugFromCommunityName, initialProductSignupState } from "@/lib/domain/signup";
import { getPackagePricingForTierAndCurrency } from "@/lib/domain/package-pricing";

const packageOptions = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
];

function formatPackageOptionLabel(tier, currency) {
  const normalizedTier = String(tier || "").trim().toLowerCase();

  if (normalizedTier === "free") {
    return "Free";
  }

  const pricing = getPackagePricingForTierAndCurrency(normalizedTier, currency);
  const title = normalizedTier === "growth" ? "Growth" : "Starter";

  return `${title} — ${pricing.display}/month`;
}

function SignupProvisionFields({ values, onPackageTierChange }) {
  const [communityName, setCommunityName] = useState(values.communityName);
  const [hubSlug, setHubSlug] = useState(values.hubSlug);
  const [hasEditedSlug, setHasEditedSlug] = useState(Boolean(values.hubSlug));
  const [packageTier, setPackageTier] = useState(values.packageTier || "starter");
  const packageCurrency = values.packageCurrency || "GBP";
  const packageOptionLabels = useMemo(
    () => packageOptions.map((option) => ({
      ...option,
      label: formatPackageOptionLabel(option.value, packageCurrency),
    })),
    [packageCurrency],
  );

  return (
    <div className="signup-form-grid">
      <label className="form-field">
        <span className="form-label">Your name</span>
        <input className="form-input" name="ownerFullName" defaultValue={values.ownerFullName} placeholder="Jordan Smith" />
        <span className="form-helper">We will use this name for your account.</span>
      </label>
      <label className="form-field">
        <span className="form-label">Your email</span>
        <input className="form-input" name="ownerEmail" type="email" defaultValue={values.ownerEmail} placeholder="jordan@northshore.community" />
        <span className="form-helper">We will send verification and account updates to this address.</span>
      </label>
      <label className="form-field">
        <span className="form-label">Create password</span>
        <input className="form-input" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
        <span className="form-helper">Use this to sign back into your account later.</span>
      </label>
      <label className="form-field">
        <span className="form-label">Confirm password</span>
        <input className="form-input" name="passwordConfirm" type="password" autoComplete="new-password" placeholder="Repeat your password" />
        <span className="form-helper">Repeat the password you want to use for your account.</span>
      </label>
      <label className="form-field">
        <span className="form-label">Community name</span>
        <input
          className="form-input"
          name="communityName"
          value={communityName}
          onChange={(event) => {
            const nextCommunityName = event.target.value;

            setCommunityName(nextCommunityName);

            if (!hasEditedSlug) {
              setHubSlug(deriveHubSlugFromCommunityName(nextCommunityName));
            }
          }}
          placeholder="North Shore Community"
        />
        <span className="form-helper">This appears across your website and admin area.</span>
      </label>
      <label className="form-field">
        <span className="form-label">Community address</span>
        <input
          className="form-input"
          name="hubSlug"
          value={hubSlug}
          onChange={(event) => {
            setHasEditedSlug(true);
            setHubSlug(event.target.value);
          }}
          placeholder="north-shore"
        />
        <span className="form-helper">We suggest one automatically from your community name, and you can change it before you continue.</span>
      </label>
      <MarketingSelect
        label="Package"
        name="packageTier"
        value={packageTier}
        options={packageOptionLabels}
        onChange={(nextValue) => {
          setPackageTier(nextValue);
          onPackageTierChange?.(nextValue);
        }}
        hint={
          packageTier === "free"
            ? "Choose Free to create your community without going to checkout."
            : "Paid packages are billed in GBP and take you straight to secure checkout after your workspace is prepared."
        }
      />
      <input type="hidden" name="packageCurrency" value={packageCurrency} />
    </div>
  );
}

export default function SignupProvisionForm({ initialValues = null }) {
  const [state, formAction] = useActionState(createProductSiteSignupAction, null);
  const values = {
    ...initialProductSignupState.values,
    ...(initialValues || {}),
    ...(state?.values || {}),
  };
  const formStateKey = [
    values.ownerFullName,
    values.ownerEmail,
    values.communityName,
    values.hubSlug,
    values.packageTier,
    values.packageCurrency,
    values.password,
    values.passwordConfirm,
  ].join("|");

  return (
    <SignupProvisionFormInner
      key={formStateKey}
      formAction={formAction}
      state={state}
      values={values}
    />
  );
}

function SignupProvisionFormInner({ formAction, state, values }) {
  const [selectedPackageTier, setSelectedPackageTier] = useState(values.packageTier || "starter");
  const formStateKey = [
    values.ownerFullName,
    values.ownerEmail,
    values.communityName,
    values.hubSlug,
    values.packageTier,
    values.packageCurrency,
    values.password,
    values.passwordConfirm,
  ].join("|");
  const submitLabel = selectedPackageTier === "free" ? "Create my community" : "Continue to checkout";

  return (
    <form action={formAction} className="signup-form-shell">
      {state?.error ? <div className="form-message" data-tone="danger">{state.error}</div> : null}
      <SignupProvisionFields
        key={formStateKey}
        values={values}
        onPackageTierChange={setSelectedPackageTier}
      />
      <div className="form-actions">
        <button type="submit" className="button-link" data-variant="primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
