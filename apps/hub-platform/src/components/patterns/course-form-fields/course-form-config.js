import {
  courseFormatOptions,
  courseLevelOptions,
  courseRefundPolicyOptions,
  courseStatusLabels,
  courseTypeOptions,
  courseVisibilityOptions,
} from "@/lib/domain/courses";

export const courseFormSections = [
  {
    id: "core",
    label: "Core details",
    description: "Title, summary, rich description, imagery, course type, and level.",
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "How the course is delivered and what learners need to attend.",
  },
  {
    id: "schedule-enrolment",
    label: "Schedule and enrolment",
    description: "Dates, registration window, capacity, and visibility.",
  },
  {
    id: "pricing",
    label: "Payment",
    description: "Price, deposit rules, and payment timing.",
  },
  {
    id: "publishing",
    label: "Publishing",
    description: "Control whether the course stays in draft, goes live, or is cancelled.",
  },
];

export const coursePricingOptions = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

export const courseTypeFieldOptions = [
  { value: "", label: "Select a course type" },
  ...courseTypeOptions,
];

export const courseLevelFieldOptions = [
  { value: "", label: "Select a course level" },
  ...courseLevelOptions,
];

export const courseStatusOptions = Object.entries(courseStatusLabels).map(([value, label]) => ({
  value,
  label,
}));

export {
  courseFormatOptions,
  courseRefundPolicyOptions,
  courseVisibilityOptions,
};
