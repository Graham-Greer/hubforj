import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("event and course admin list pages use the shared offering admin list workspace", () => {
  const eventSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/events/page.jsx", import.meta.url),
    "utf8"
  );
  const courseSource = readFileSync(
    new URL("../../src/app/(admin)/[hubSlug]/admin/courses/page.jsx", import.meta.url),
    "utf8"
  );
  const workspaceSource = readFileSync(
    new URL("../../src/components/patterns/offering-admin-list-workspace/OfferingAdminListWorkspace.jsx", import.meta.url),
    "utf8"
  );

  assert.match(eventSource, /OfferingAdminListWorkspace/);
  assert.match(courseSource, /OfferingAdminListWorkspace/);
  assert.match(eventSource, /registeredAttendeeCount/);
  assert.match(eventSource, /series\.imageAsset\?\.publicUrl/);
  assert.match(courseSource, /countEnrolledCourseRegistrations/);
  assert.match(eventSource, /Attending/);
  assert.match(courseSource, /Attending/);
  assert.match(workspaceSource, /SearchField/);
  assert.match(workspaceSource, /filterDefinitions/);
  assert.match(workspaceSource, /PaginationControls/);
  assert.match(workspaceSource, /pageSizeOptions=\{\[5, 10, 20\]\}/);
  assert.match(workspaceSource, /useDebouncedValue/);
  assert.match(workspaceSource, /useSearchParams/);
  assert.match(workspaceSource, /router\.replace/);
  assert.match(workspaceSource, /buildOfferingQuery/);
  assert.match(workspaceSource, /enableDateRangeFilter/);
  assert.match(workspaceSource, /dateFrom/);
  assert.match(workspaceSource, /dateTo/);
  assert.match(workspaceSource, /triggerTooltip=\{filter\.label\}/);
  assert.match(workspaceSource, /PageHeader/);
  assert.doesNotMatch(workspaceSource, /WorkspaceSection/);
});
