export function getMemberStatusAction(status) {
  const nextStatus = status === "suspended" ? "active" : "suspended";

  return {
    nextStatus,
    actionLabel: nextStatus === "active" ? "Reactivate member" : "Suspend member",
    description:
      status === "suspended"
        ? "This member is currently suspended and should not continue through normal access flows until reactivated."
        : "This member is active and can continue through normal hub access, booking, and member workflows.",
  };
}

export function getTotalMemberBookings(detail) {
  const eventBookings = detail?.eventBookings?.length ? detail.eventBookings : detail?.registrations || [];
  return eventBookings.length + (detail?.courseRegistrations?.length || 0);
}

export function buildMemberActivityItems(detail = {}) {
  const eventBookings = detail?.eventBookings?.length ? detail.eventBookings : detail?.registrations || [];
  const eventItems = eventBookings.map((registration) => ({
    id: `event:${registration.id}`,
    kind: "event",
    title: registration.eventTitle || "Event booking",
    date: registration.eventStartAt || "",
    status: registration.status,
    paymentStatus: registration.paymentStatus,
  }));

  const courseItems = (detail.courseRegistrations || []).map((registration) => ({
    id: `course:${registration.id}`,
    kind: "course",
    title: registration.courseTitle || "Course enrolment",
    date: registration.courseStartAt || "",
    status: registration.status,
    paymentStatus: registration.paymentStatus,
  }));

  return [...eventItems, ...courseItems].sort((left, right) => {
    const leftTime = Date.parse(String(left.date || ""));
    const rightTime = Date.parse(String(right.date || ""));

    if (!Number.isFinite(leftTime) && !Number.isFinite(rightTime)) {
      return left.title.localeCompare(right.title);
    }

    if (!Number.isFinite(leftTime)) {
      return 1;
    }

    if (!Number.isFinite(rightTime)) {
      return -1;
    }

    return rightTime - leftTime;
  });
}
