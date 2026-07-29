"use server";

import { redirect } from "next/navigation";
import { requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { updateHubUserStatusById } from "@/lib/data/users";
import {
  approveMembershipUpgradeRequest,
  cancelScheduledMembershipDefaultPlanDowngradeForUser,
  scheduleMembershipDefaultPlanDowngradeForUser,
  upsertMembershipForUser,
  updateMembershipPaymentStatus,
} from "@/lib/data/memberships";
import { updateEventRegistrationPaymentStatus } from "@/lib/data/legacy-event-registrations";
import { updateCourseRegistrationPaymentStatus } from "@/lib/data/course-registrations";

function normalizeString(value) {
  return String(value || "").trim();
}

function buildMemberDetailRedirect(hubSlug, memberId, membersQuery = "", feedback = "") {
  const params = new URLSearchParams(normalizeString(membersQuery));

  if (feedback) {
    const [key, value] = feedback.split("=", 2);
    if (key && value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return `/${hubSlug}/admin/members/${memberId}${queryString ? `?${queryString}` : ""}`;
}

export async function updateMemberStatusAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const memberId = normalizeString(formData.get("memberId"));
  const status = normalizeString(formData.get("status"));
  const membersQuery = normalizeString(formData.get("membersQuery"));

  if (!hubSlug || !memberId) {
    return { error: "Member context is required." };
  }

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    await updateHubUserStatusById(hub.id, memberId, { status }, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update member status.") };
  }

  redirect(buildMemberDetailRedirect(hubSlug, memberId, membersQuery, "success=statusUpdated"));
}

export async function assignMembershipAction(_previousState, formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const memberId = normalizeString(formData.get("memberId"));
  const membersQuery = normalizeString(formData.get("membersQuery"));

  if (!hubSlug || !memberId) {
    return { error: "Member context is required." };
  }

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    await upsertMembershipForUser(
      hub.id,
      memberId,
      {
        planId: formData.get("planId"),
        status: formData.get("status"),
        paymentStatus: formData.get("paymentStatus"),
        startDate: formData.get("startDate"),
        renewalDate: formData.get("renewalDate"),
        notes: formData.get("notes"),
      },
      actorId
    );
  } catch (error) {
    return { error: String(error?.message || "Unable to assign membership.") };
  }

  redirect(buildMemberDetailRedirect(hubSlug, memberId, membersQuery, "success=membershipUpdated"));
}

export async function updateMemberPaymentStatusAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const memberId = normalizeString(formData.get("memberId"));
  const kind = normalizeString(formData.get("kind"));
  const paymentStatus = normalizeString(formData.get("forcePaymentStatus") || formData.get("paymentStatus"));
  const recordId = normalizeString(formData.get("recordId"));
  const ownerId = normalizeString(formData.get("ownerId"));
  const membersQuery = normalizeString(formData.get("membersQuery"));

  if (!hubSlug || !memberId || !kind || !paymentStatus || !recordId) {
    return { error: "Payment item context is required." };
  }

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);

    if (kind === "membership") {
      await updateMembershipPaymentStatus(hub.id, recordId, paymentStatus, actorId);
    } else if (kind === "event") {
      await updateEventRegistrationPaymentStatus(hub.id, ownerId, recordId, paymentStatus, actorId);
    } else if (kind === "course") {
      await updateCourseRegistrationPaymentStatus(hub.id, ownerId, recordId, paymentStatus, actorId);
    } else {
      throw new Error("Unsupported payment item kind.");
    }
  } catch (error) {
    return { error: String(error?.message || "Unable to update payment status.") };
  }

  redirect(buildMemberDetailRedirect(hubSlug, memberId, membersQuery, "success=paymentUpdated"));
}

export async function approveMembershipUpgradeRequestAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const memberId = normalizeString(formData.get("memberId"));
  const requestId = normalizeString(formData.get("requestId"));
  const paymentStatus = normalizeString(formData.get("paymentStatus")) || "paid";
  const membersQuery = normalizeString(formData.get("membersQuery"));

  if (!hubSlug || !memberId || !requestId) {
    redirect(
      buildMemberDetailRedirect(
        hubSlug,
        memberId,
        membersQuery,
        `error=${encodeURIComponent("Membership upgrade request context is required.")}`
      )
    );
  }

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    await approveMembershipUpgradeRequest(hub.id, requestId, {
      paymentStatus,
      actorId,
    });
  } catch (error) {
    redirect(
      buildMemberDetailRedirect(
        hubSlug,
        memberId,
        membersQuery,
        `error=${encodeURIComponent(String(error?.message || "Unable to approve membership upgrade request."))}`
      )
    );
  }

  redirect(buildMemberDetailRedirect(hubSlug, memberId, membersQuery, "success=upgradeRequestApproved"));
}

export async function revertMemberToDefaultMembershipAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const memberId = normalizeString(formData.get("memberId"));
  const membersQuery = normalizeString(formData.get("membersQuery"));

  if (!hubSlug || !memberId) {
    redirect(
      buildMemberDetailRedirect(
        hubSlug,
        memberId,
        membersQuery,
        `error=${encodeURIComponent("Member context is required.")}`
      )
    );
  }

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    await scheduleMembershipDefaultPlanDowngradeForUser(
      hub.id,
      memberId,
      actorId,
      "Admin scheduled this membership to return to the default plan."
    );
  } catch (error) {
    redirect(
      buildMemberDetailRedirect(
        hubSlug,
        memberId,
        membersQuery,
        `error=${encodeURIComponent(String(error?.message || "Unable to schedule this member to return to the default plan."))}`
      )
    );
  }

  redirect(buildMemberDetailRedirect(hubSlug, memberId, membersQuery, "success=membershipReturnScheduled"));
}

export async function cancelScheduledMemberMembershipDowngradeAction(formData) {
  const hubSlug = normalizeString(formData.get("hubSlug"));
  const memberId = normalizeString(formData.get("memberId"));
  const membersQuery = normalizeString(formData.get("membersQuery"));

  if (!hubSlug || !memberId) {
    redirect(
      buildMemberDetailRedirect(
        hubSlug,
        memberId,
        membersQuery,
        `error=${encodeURIComponent("Member context is required.")}`
      )
    );
  }

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    await cancelScheduledMembershipDefaultPlanDowngradeForUser(
      hub.id,
      memberId,
      actorId,
      "Admin cancelled the scheduled return to the default plan."
    );
  } catch (error) {
    redirect(
      buildMemberDetailRedirect(
        hubSlug,
        memberId,
        membersQuery,
        `error=${encodeURIComponent(String(error?.message || "Unable to cancel the scheduled membership change."))}`
      )
    );
  }

  redirect(buildMemberDetailRedirect(hubSlug, memberId, membersQuery, "success=membershipReturnScheduleCancelled"));
}
