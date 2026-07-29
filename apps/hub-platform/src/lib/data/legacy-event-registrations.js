try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

// Deprecated compatibility layer for historical event_registration records.
// New event runtime behavior must use `@/lib/data/event-bookings`.

export {
  getEventRegistrationById,
  countRegisteredEventRegistrations,
  getEventRegistrationByUser,
  getLatestEventRegistrationByUser,
  listEventPaymentItemsByHub,
  listEventRegistrations,
  listEventRegistrationsByUserForEvent,
  listRegistrationsByUser,
} from "./event-registration-queries.js";

export {
  createEventRegistrationForMember,
  updateEventRegistrationAttendanceStatus,
  updateEventRegistrationNativePaymentState,
  updateEventRegistrationPaymentStatus,
  updateEventRegistrationStatus,
} from "./event-registration-mutations.js";
