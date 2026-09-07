"use server";

import { getServerEnv } from "@/lib/config/env";
import { redirect, unstable_rethrow } from "next/navigation";
import { assertCommercialSignupEmailAvailable, ensureCommercialAccountAuthUser } from "@/lib/auth/commercial-auth";
import { normalizeProductSignupPayload, resolveInitialProvisioningPayloadForSignup } from "@/lib/domain/signup";
import {
  createOrResolveCommercialAccount,
  getCommercialAccountByEmail,
  listCommercialAccountHubs,
  updateCommercialAccountPackageIntent,
} from "@/lib/data/commercial-accounts";
import { writeCommercialAccountSessionFromAccount } from "@/lib/server/account-session";
import { sendCommercialAccountVerificationEmail } from "@/lib/server/commercial-account-email";
import { createStripeCheckoutForPackageChange } from "@/lib/server/commercial-billing";
import { assertProductSignupAllowed, isPublicAbuseRateLimitError } from "@/lib/server/public-abuse-controls";
import { createCommercialSignupOperation } from "@/lib/data/commercial-signup-operations";
import { resumeCommercialSignup } from "@/lib/server/commercial-signup-recovery";
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
      values: { ...rawValues, password: "", passwordConfirm: "" },
    };
  }

  if (!getServerEnv().productSiteSignupProvisioningEnabled) {
    return { error: "New workspace setup is temporarily unavailable. You can still sign in to an existing account.", values: normalized.values };
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

  // Reject existing identities before provisioning; creation repeats this check
  // and Firebase uniqueness handles an identity created concurrently.
  try {
    await assertCommercialSignupEmailAvailable(normalized.values.ownerEmail);
  } catch (error) {
    return {
      error: String(error?.message || "Unable to check sign-in details. Please try again."),
      values: normalized.values,
    };
  }

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

  let accountWithAuth;
  try {
    accountWithAuth = await ensureCommercialAccountAuthUser({ account, password: rawValues.password });
  } catch {
    return { error: "We could not finish sign-in setup. Try signing in or resetting your password before starting again.", values: normalized.values };
  }
  try {
    await createCommercialSignupOperation({
      accountId: accountWithAuth.id, authUid: accountWithAuth.authUid,
      payload: resolveInitialProvisioningPayloadForSignup(normalized.payload),
      tier: selectedPackageTier, currency: normalized.values.packageCurrency,
    });
  } catch {
    return { error: "Your sign-in details were created, but we could not save your workspace setup. Sign in to your account for help before starting again.", values: normalized.values };
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

  let hub;
  try {
    hub = await resumeCommercialSignup(accountWithAuth);
  } catch {
    return { error: "Your setup is saved, but your workspace is not ready yet. Use Recover setup to sign in and try again.", recoverable: true, values: normalized.values };
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
