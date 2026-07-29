try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

import { getCurrentMembershipByUser, getPendingMembershipUpgradeRequestByUser, listMembershipPaymentHistoryByUser } from "@/lib/data/memberships";
import { listMemberPaymentItems } from "@/lib/data/member-payments";
import { listCourseRegistrationsByUser } from "@/lib/data/course-registrations";
import { listEventBookingsByBooker } from "@/lib/data/event-bookings";
import { getUserById } from "@/lib/data/users";
import { buildMemberDetail } from "@/lib/domain/member-account";

export async function getMemberDetailById(hubId, memberId) {
  const user = await getUserById(hubId, memberId);

  if (!user || user.role !== "member") {
    return null;
  }

  const [membership, membershipUpgradeRequest, eventBookings, courseRegistrations, paymentItems, membershipPaymentHistory] = await Promise.all([
    getCurrentMembershipByUser(hubId, memberId),
    getPendingMembershipUpgradeRequestByUser(hubId, memberId),
    listEventBookingsByBooker(hubId, memberId),
    listCourseRegistrationsByUser(hubId, memberId),
    listMemberPaymentItems(hubId, memberId),
    listMembershipPaymentHistoryByUser(hubId, memberId),
  ]);

  return buildMemberDetail({
    user,
    membership,
    membershipUpgradeRequest,
    eventBookings,
    courseRegistrations,
    paymentItems,
    membershipPaymentHistory,
  });
}
