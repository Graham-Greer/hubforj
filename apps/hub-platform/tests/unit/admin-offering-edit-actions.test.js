import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin form footer source pushes the trailing action to the right", () => {
  const source = readFileSync(
    new URL("../../src/components/patterns/admin-form-footer/AdminFormFooter.module.css", import.meta.url),
    "utf8"
  );

  assert.match(source, /\.actions > :last-child \{/);
  assert.match(source, /margin-inline-start: auto;/);
});

test("event and course edit forms expose delete and left-side cancel actions", () => {
  const eventFormSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/EditEventForm.jsx", import.meta.url),
    "utf8"
  );
  const courseFormSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/EditCourseForm.jsx", import.meta.url),
    "utf8"
  );
  const eventActionSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/[eventId]/actions.js", import.meta.url),
    "utf8"
  );
  const courseActionSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/[courseId]/actions.js", import.meta.url),
    "utf8"
  );
  const eventMutationSource = readFileSync(
    new URL("../../src/lib/data/event-mutations.js", import.meta.url),
    "utf8"
  );
  const courseMutationSource = readFileSync(
    new URL("../../src/lib/data/course-mutations.js", import.meta.url),
    "utf8"
  );

  assert.match(eventFormSource, /AdminDiscardChangesButton/);
  assert.match(eventFormSource, /label="Cancel"/);
  assert.match(eventFormSource, /variant="secondary"/);
  assert.match(courseFormSource, /AdminDiscardChangesButton/);
  assert.match(courseFormSource, /label="Cancel"/);
  assert.match(courseFormSource, /variant="secondary"/);

  assert.match(eventActionSource, /export async function deleteEventAction/);
  assert.match(courseActionSource, /export async function deleteCourseAction/);
  assert.match(eventMutationSource, /export async function deleteEventById/);
  assert.match(courseMutationSource, /export async function deleteCourseById/);
  assert.match(eventMutationSource, /cannot be deleted because it already has registrations or bookings/);
  assert.match(courseMutationSource, /cannot be deleted because it already has registrations/);
});
