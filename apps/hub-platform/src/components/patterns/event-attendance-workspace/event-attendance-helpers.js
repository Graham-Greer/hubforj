export function getEventAttendanceLabel(status) {
  if (status === "pending") {
    return "Unmarked";
  }

  if (status === "present") {
    return "Attended";
  }

  if (status === "absent") {
    return "Absent";
  }

  return "Unknown";
}
