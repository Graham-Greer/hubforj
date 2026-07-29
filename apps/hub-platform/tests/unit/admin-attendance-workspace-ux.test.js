import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event attendance uses the shared operational records table", () => {
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/event-attendance-workspace/EventAttendanceWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const menuSource = readFileSync(
    new URL("../../src/components/patterns/event-attendance-workspace/AttendanceStatusMenu.jsx", import.meta.url),
    "utf8"
  );

  assert.match(workspaceSource, /OperationalRecordsTable/);
  assert.match(workspaceSource, /RegistrationStatusMenu/);
  assert.match(workspaceSource, /AttendanceStatusMenu/);
  assert.doesNotMatch(workspaceSource, /buildRegistrationFilterMenuItems/);
  assert.doesNotMatch(workspaceSource, /filterEventAttendanceRecords/);
  assert.match(menuSource, /OperationalStatusMenu/);
});

test("course attendance supports inline progress menus", () => {
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/course-attendance-workspace/CourseAttendanceWorkspace.jsx", import.meta.url),
    "utf8"
  );
  const menuSource = readFileSync(
    new URL("../../src/components/patterns/course-attendance-workspace/AttendanceStatusMenu.jsx", import.meta.url),
    "utf8"
  );

  assert.match(workspaceSource, /OperationalRecordsTable/);
  assert.match(workspaceSource, /RegistrationStatusMenu/);
  assert.match(workspaceSource, /AttendanceStatusMenu/);
  assert.doesNotMatch(workspaceSource, /key: "progress"/);
  assert.match(menuSource, /OperationalStatusMenu/);
  assert.match(menuSource, /getAllowedCourseAttendanceTransitions/);
  assert.match(menuSource, /courseAttendanceTransitionRequiresConfirmation/);
  assert.match(menuSource, /Mark learner as withdrawn\?/);
  assert.match(menuSource, /updateCourseAttendanceStatusAction/);
});
