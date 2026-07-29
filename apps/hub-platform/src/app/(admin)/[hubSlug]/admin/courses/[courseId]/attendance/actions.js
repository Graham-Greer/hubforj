"use server";

import { revalidatePath } from "next/cache";
import { assertActionHubIdMatches, requireHubOperatorActionAccess } from "@/lib/auth/action-access";
import { updateCourseRegistrationAttendanceStatus } from "@/lib/data/course-registrations";

function revalidateCoursePaths(hubSlug, courseId) {
  revalidatePath(`/${hubSlug}/admin/courses/${courseId}`);
  revalidatePath(`/${hubSlug}/admin/courses/${courseId}/registrations`);
  revalidatePath(`/${hubSlug}/admin/courses/${courseId}/attendance`);
}

export async function updateCourseAttendanceStatusAction(_previousState, formData) {
  const hubId = String(formData.get("hubId") || "").trim();
  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const courseId = String(formData.get("courseId") || "").trim();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const attendanceStatus = String(formData.get("attendanceStatus") || "").trim();

  try {
    const { hub, actorId } = await requireHubOperatorActionAccess(hubSlug);
    assertActionHubIdMatches(hub, hubId, { allowEmpty: false });
    await updateCourseRegistrationAttendanceStatus(hub.id, courseId, registrationId, attendanceStatus, actorId);
  } catch (error) {
    return { error: String(error?.message || "Unable to update course attendance.") };
  }

  revalidateCoursePaths(hubSlug, courseId);
  return { error: "" };
}
