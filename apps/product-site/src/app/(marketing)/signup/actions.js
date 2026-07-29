"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { ensureCommercialAccountAuthUser } from "@/lib/auth/commercial-auth";
import { normalizeProductSignupPayload, resolveInitialProvisioningPayloadForSignup } from "@/lib/domain/signup";
import {
  createOrResolveCommercialAccount,
  getCommercialAccountByEmail,
  listCommercialAccountHubs,
  provisionCommercialAccountForSignup,
  updateCommercialAccountPackageIntent,
} from "@/lib/data/commercial-accounts";
import { writeCommercialAccountSessionFromAccount } from "@/lib/server/account-session";
import { sendCommercialAccountVerificationEmail } from "@/lib/server/commercial-account-email";
import { createStripeCheckoutForPackageChange } from "@/lib/server/commercial-billing";
import { assertProductSignupAllowed, isPublicAbuseRateLimitError } from "@/lib/server/public-abuse-controls";
import { provisionHubFromProductSite } from "@/lib/server/provision-hub";
import { assertStripePriceMatchesSelection, resolveStripePriceSelection } from "@/lib/server/stripe";

export async function createProductSiteSignupAction(_previousState, formData) {
  const rawValues = {
    ownerFullName: String(formData.get("ownerFullName") || ""),
    ownerEmail: String(formData.get("ownerEmail") || ""),
    communityName: String(formData.get("communityName") || ""),
    hubSlug: String(formData.get("hubSlug") || ""),
    packageTier: String(formData.get("packageTier") || "starter"),
    packageCurrency: String(formData.get("packageCurrency") || ""),
    password: String(formData.get("password") || ""),
    passwordConfirm: String(formData.get("passwordConfirm") || ""),
  };

  let normalized;

  try {
    normalized = normalizeProductSignupPayload(rawValues);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to prepare signup."),
      values: rawValues,
    };
  }

  try {
    await assertProductSignupAllowed({ email: normalized.values.ownerEmail });
  } catch (error) {
    if (isPublicAbuseRateLimitError(error)) {
      return {
        error: error.userMessage,
        values: normalized.values,
      };
    }

    return {
      error: "Unable to prepare signup safely right now. Please try again.",
      values: normalized.values,
    };
  }

  try {
    const existingAccount = await getCommercialAccountByEmail(normalized.values.ownerEmail);

    if (existingAccount?.id) {
      const ownedHubs = await listCommercialAccountHubs(existingAccount.id);
      const alreadyOwnsWorkspace =
        ownedHubs.length > 0 ||
        Boolean(existingAccount.primaryHubId) ||
        Boolean(existingAccount.lastHubId) ||
        Number(existingAccount.hubCount || 0) > 0;

      if (alreadyOwnsWorkspace) {
        return {
          error:
            "This email address is already linked to a Hubforj workspace. Sign in to manage your existing workspace or use a different email address to create a new account.",
          values: normalized.values,
        };
      }
    }
  } catch (error) {
    return {
      error: String(error?.message || "Unable to confirm whether this email can be used for signup."),
      values: normalized.values,
    };
  }

  const selectedPackageTier = String(normalized.values.packageTier || "free").toLowerCase();

  if (selectedPackageTier === "starter" || selectedPackageTier === "growth") {
    const priceSelection = resolveStripePriceSelection({
      tier: selectedPackageTier,
      country: normalized.values.country,
      currency: normalized.values.packageCurrency,
    });

    if (!priceSelection.priceId) {
      return {
        error: "The selected paid package is not ready for checkout yet. Complete the Stripe GBP package price setup first.",
        values: normalized.values,
      };
    }

    try {
      await assertStripePriceMatchesSelection({
        tier: selectedPackageTier,
        currency: priceSelection.currency,
        priceId: priceSelection.priceId,
      });
    } catch (error) {
      return {
        error: String(error?.message || "The Stripe package price configuration is not valid for GBP billing yet."),
        values: normalized.values,
      };
    }
  }

  let account;

  try {
    account = await createOrResolveCommercialAccount({
      ownerFullName: normalized.values.ownerFullName,
      ownerEmail: normalized.values.ownerEmail,
    });
  } catch (error) {
    return {
      error: String(error?.message || "Unable to prepare the commercial account."),
      values: normalized.values,
    };
  }

  let hub;

  try {
    hub = await provisionHubFromProductSite(resolveInitialProvisioningPayloadForSignup(normalized.payload));
  } catch (error) {
    return {
      error: String(error?.message || "Unable to provision the community."),
      values: normalized.values,
    };
  }

  let ownership;

  try {
    ownership = await provisionCommercialAccountForSignup({
      ownerFullName: normalized.values.ownerFullName,
      ownerEmail: normalized.values.ownerEmail,
      hubId: String(hub.id || ""),
      hubSlug: String(hub.slug || normalized.values.hubSlug),
      communityName: normalized.values.communityName,
      packageTier: String(hub.packageTier || "free"),
      packageStatus: String(hub.packageStatus || "active"),
    });
  } catch (error) {
    return {
      error: String(error?.message || "Your community was created, but we could not finish the commercial account link."),
      values: normalized.values,
    };
  }

  let accountWithAuth;

  try {
    accountWithAuth = await ensureCommercialAccountAuthUser({
      account: ownership.account || account,
      password: rawValues.password,
    });
  } catch (error) {
    return {
      error: String(error?.message || "Your community was created, but we could not finish account sign-in setup."),
      values: normalized.values,
    };
  }

  let verificationStatus = "retry";

  try {
    const delivery = await sendCommercialAccountVerificationEmail({
      account: accountWithAuth,
      communityName: normalized.values.communityName,
    });
    verificationStatus = String(delivery?.status || "sent");
  } catch {
    verificationStatus = "retry";
  }

  await writeCommercialAccountSessionFromAccount({
    account: accountWithAuth,
    currentHub: {
      id: String(hub.id || ""),
      name: normalized.values.communityName,
      slug: String(hub.slug || normalized.values.hubSlug),
      packageTier: String(hub.packageTier || "free"),
    },
  });
  if (selectedPackageTier === "starter" || selectedPackageTier === "growth") {
    try {
      const checkoutSuccessParams = new URLSearchParams({
        packageTier: selectedPackageTier,
        verification: verificationStatus,
      });

      if (hub.slug) {
        checkoutSuccessParams.set("hubSlug", String(hub.slug));
      }

      const checkoutSession = await createStripeCheckoutForPackageChange({
        account: accountWithAuth,
        currentHub: {
          id: String(hub.id || ""),
          name: normalized.values.communityName,
          slug: String(hub.slug || normalized.values.hubSlug),
          packageTier: String(hub.packageTier || "free"),
          country: normalized.payload.country,
          timezone: normalized.payload.timezone,
          locale: normalized.payload.locale,
          defaultCurrency: normalized.payload.defaultCurrency,
          packageCurrency: normalized.values.packageCurrency,
        },
        targetTier: selectedPackageTier,
        successPath: `/signup/next-steps?${checkoutSuccessParams.toString()}`,
      });

      redirect(String(checkoutSession?.url || "/account/upgrade"));
    } catch (error) {
      unstable_rethrow(error);
      await updateCommercialAccountPackageIntent(accountWithAuth.id, {
        pendingPackageTier: selectedPackageTier,
        pendingPackageCurrency: normalized.values.packageCurrency,
        pendingPackageStatus: "checkout_setup_failed",
        pendingPackageEffectiveAt: "",
      });
      console.error("createProductSiteSignupAction paid checkout handoff failed", {
        targetTier: selectedPackageTier,
        accountId: accountWithAuth?.id,
        hubId: hub?.id,
        error: String(error?.message || error || "Unknown Stripe checkout handoff error"),
      });
      const params = new URLSearchParams({
        tier: selectedPackageTier,
        state: "checkout-setup-failed",
      });

      if (error?.message) {
        params.set("message", String(error.message));
      }

      redirect(`/account/upgrade?${params.toString()}`);
    }
  }

  const params = new URLSearchParams({
    hubId: String(hub.id || ""),
    hubSlug: String(hub.slug || normalized.values.hubSlug),
    packageTier: String(hub.packageTier || "free"),
    verification: verificationStatus,
  });

  redirect(`/signup/success?${params.toString()}`);
}
