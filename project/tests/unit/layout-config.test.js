import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_GLOBAL_FOOTER_ID,
  DEFAULT_GLOBAL_HEADER_ID,
  normalizeFooterOverride,
  normalizeGlobalFooterId,
  normalizeGlobalHeaderId,
  normalizeHeaderOverride,
  resolveHeaderFooterSelection,
} from "../../src/lib/data/pages/layout-config.js";

test("global layout ids default when empty", () => {
  assert.equal(normalizeGlobalHeaderId(""), DEFAULT_GLOBAL_HEADER_ID);
  assert.equal(normalizeGlobalFooterId(""), DEFAULT_GLOBAL_FOOTER_ID);
});

test("page overrides allow empty but reject unsupported variants", () => {
  assert.equal(normalizeHeaderOverride(""), "");
  assert.equal(normalizeFooterOverride(""), "");
  assert.throws(() => normalizeHeaderOverride("unknown"), /invalid/);
});

test("resolveHeaderFooterSelection applies page override over global", () => {
  const resolved = resolveHeaderFooterSelection({
    hub: { globalHeaderId: "standard", globalFooterId: "simple" },
    page: { headerIdOverride: "landing", footerIdOverride: "" },
  });

  assert.equal(resolved.effectiveHeaderId, "landing");
  assert.equal(resolved.effectiveFooterId, "simple");
  assert.equal(resolved.usesHeaderOverride, true);
  assert.equal(resolved.usesFooterOverride, false);
});
