"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { syncHubPaymentLedger } from "@/lib/data/payment-ledger-sync";
import { repairHubPaymentReconciliation } from "@/lib/data/payment-reconciliation";
import { assertHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { assertHubCapability } from "@/lib/domain/package-guards";
import { createMembershipPlan, deleteMembershipPlan, updateMembershipPlan, updateMembershipPaymentStatus } from "@/lib/data/memberships";
import { updateEventRegistrationPaymentStatus } from "@/lib/data/legacy-event-registrations";
import { updateCourseRegistrationPaymentStatus } from "@/lib/data/course-registrations";
import { ensureHubStripeConnectedAccount, syncHubStripeConnectedAccount } from "@/lib/server/hub-payment-connect";
import {
  extractDeleteMembershipPlanFormValues,
  extractMembershipPlanFormValues,
  validateMembershipPlanDeletionConfirmation,
} from "./form-state";

function normalizeString(value) {
  return String(value || "").trim();
}

async function requireHubPaymentsAccess(hubSlug) {
  const { hub, access } = await requireHubOperatorActionAccess(hubSlug, {
    unauthorizedMessage: "You are not authorized to manage payments for this hub.",
  });

  assertHubRegionalSetupComplete(hub);
  assertHubCapability(hub, "paymentsEnabled", "Built-in payments are only available on the Growth package.");

  return { hub, access };
}

function revalidatePaymentsPaths(hubSlug) {
  revalidatePath(`/${hubSlug}/admin/payments`);
  revalidatePath(`/${hubSlug}/admin/settings/account`);
}

export async function createMembershipPlanAction(_previousState, formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const values = extractMembershipPlanFormValues(formData);

  if (!hubSlug) {
    return { error: "Hub context is required.", values };
  }

  try {
    const { hub, access } = await requireHubPaymentsAccess(hubSlug);
    await createMembershipPlan(hub.id, values, access.actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to create membership plan."), values };
  }

  redirect(`/${hubSlug}/admin/payments?view=plans&success=planCreated`);
}

export async function updateMembershipPlanAction(_previousState, formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const planId = normalizeString(formData.get("planId"));
  const values = extractMembershipPlanFormValues(formData);

  if (!hubSlug || !planId) {
    return { error: "Membership plan context is required.", values };
  }

  try {
    const { hub, access } = await requireHubPaymentsAccess(hubSlug);
    await updateMembershipPlan(hub.id, planId, values, access.actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update membership plan."), values };
  }

  redirect(`/${hubSlug}/admin/payments?view=plans&success=planUpdated`);
}

export async function deleteMembershipPlanAction(_previousState, formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const planId = normalizeString(formData.get("planId"));
  const deleteValues = extractDeleteMembershipPlanFormValues(formData);

  if (!hubSlug || !planId) {
    return { error: "Membership plan context is required.", confirmation: deleteValues.confirmation };
  }

  const confirmationError = validateMembershipPlanDeletionConfirmation(deleteValues);
  if (confirmationError) {
    return { error: confirmationError, confirmation: deleteValues.confirmation };
  }

  try {
    const { hub } = await requireHubPaymentsAccess(hubSlug);
    await deleteMembershipPlan(hub.id, planId);
  } catch (error) {
    return { error: String(error?.message || "Unable to delete membership plan."), confirmation: deleteValues.confirmation };
  }

  redirect(`/${hubSlug}/admin/payments?view=plans&success=planDeleted`);
}

export async function updatePaymentItemStatusAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const kind = normalizeString(formData.get("kind"));
  const paymentStatus = normalizeString(formData.get("forcePaymentStatus") || formData.get("paymentStatus"));
  const recordId = normalizeString(formData.get("recordId"));
  const ownerId = normalizeString(formData.get("ownerId"));

  if (!hubSlug || !kind || !paymentStatus || !recordId) {
    return { error: "Payment item context is required." };
  }

  try {
    const { hub, access } = await requireHubPaymentsAccess(hubSlug);

    if (kind === "membership") {
      await updateMembershipPaymentStatus(hub.id, recordId, paymentStatus, access.actorId);
    } else if (kind === "event") {
      await updateEventRegistrationPaymentStatus(hub.id, ownerId, recordId, paymentStatus, access.actorId);
    } else if (kind === "course") {
      await updateCourseRegistrationPaymentStatus(hub.id, ownerId, recordId, paymentStatus, access.actorId);
    } else {
      throw new Error("Unsupported payment item kind.");
    }
  } catch (error) {
    return { error: String(error?.message || "Unable to update payment status.") };
  }

  redirect(`/${hubSlug}/admin/payments?success=paymentUpdated`);
}

export async function beginHubPaymentSetupAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/platform");
  }

  try {
    const { hub, access } = await requireHubPaymentsAccess(hubSlug);
    await ensureHubStripeConnectedAccount(hub, {
      actorId: access.actorId,
      contactEmail: access?.adminSession?.user?.email || access?.operatorSession?.user?.email || "",
    });
    revalidatePaymentsPaths(hub.slug);
  } catch (error) {
    redirect(`/${hubSlug}/admin/payments?view=setup&error=${encodeURIComponent(String(error?.message || "Unable to start Stripe setup."))}`);
  }

  redirect(`/${hubSlug}/admin/payments?view=setup&success=stripeSetupStarted`);
}

export async function refreshHubPaymentSetupAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/platform");
  }

  try {
    const { hub, access } = await requireHubPaymentsAccess(hubSlug);
    await syncHubStripeConnectedAccount(hub, access.actorId);
    revalidatePaymentsPaths(hub.slug);
  } catch (error) {
    redirect(`/${hubSlug}/admin/payments?view=setup&error=${encodeURIComponent(String(error?.message || "Unable to refresh Stripe status."))}`);
  }

  redirect(`/${hubSlug}/admin/payments?view=setup&success=stripeStatusRefreshed`);
}

export async function syncHubPaymentLedgerAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/platform");
  }

  try {
    const { hub, access } = await requireHubPaymentsAccess(hubSlug);
    await syncHubPaymentLedger(hub.id, access.actorId);
    revalidatePaymentsPaths(hub.slug);
    revalidatePath(`/${hub.slug}/admin`);
  } catch (error) {
    redirect(`/${hubSlug}/admin/payments?view=setup&error=${encodeURIComponent(String(error?.message || "Unable to sync the payment ledger."))}`);
  }

  redirect(`/${hubSlug}/admin/payments?view=setup&success=paymentLedgerSynced`);
}

export async function repairHubPaymentReconciliationAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));

  if (!hubSlug) {
    redirect("/platform");
  }

  try {
    const { hub, access } = await requireHubPaymentsAccess(hubSlug);
    await repairHubPaymentReconciliation(hub.id, access.actorId);
    revalidatePaymentsPaths(hub.slug);
    revalidatePath(`/${hub.slug}/admin`);
  } catch (error) {
    redirect(`/${hubSlug}/admin/payments?view=setup&error=${encodeURIComponent(String(error?.message || "Unable to repair payment reconciliation issues."))}`);
  }

  redirect(`/${hubSlug}/admin/payments?view=setup&success=paymentReconciliationRepaired`);
}
