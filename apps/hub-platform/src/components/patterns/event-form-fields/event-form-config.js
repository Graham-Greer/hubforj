import {
  eventCategoryOptions,
  eventRefundPolicyOptions,
  eventStatusLabels,
  eventVisibilityOptions,
} from "@/lib/domain/events";
import {
  eventBookingModeOptions,
  eventGuestDetailsModeOptions,
  eventMaxAttendeesPerBookingOptions,
  eventRegistrationEligibilityOptions,
} from "@/lib/domain/event-bookings";

export const eventFormSections = [
  {
    id: "core",
    label: "Core details",
    description: "Title, summary, rich description, imagery, location, and category.",
  },
  {
    id: "schedule",
    label: "Schedule",
    description: "Dates and times for when the event takes place.",
  },
  {
    id: "registration-payment",
    label: "Registration and payment",
    description: "Capacity, eligibility, visibility, waitlist rules, and pricing.",
  },
  {
    id: "publishing",
    label: "Publishing",
    description: "Control whether the event stays in draft, goes live, or is cancelled.",
  },
];

export const eventScheduleModeOptions = [
  { value: "single", label: "Single event" },
  { value: "recurring", label: "Repeating event" },
];

export const eventPricingOptions = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export const eventStatusOptions = Object.entries(eventStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

export const eventCategoryFieldOptions = [
  { value: "", label: "Select category" },
  ...eventCategoryOptions,
];

export {
  eventBookingModeOptions,
  eventGuestDetailsModeOptions,
  eventMaxAttendeesPerBookingOptions,
  eventRegistrationEligibilityOptions,
  eventRefundPolicyOptions,
  eventVisibilityOptions,
};
