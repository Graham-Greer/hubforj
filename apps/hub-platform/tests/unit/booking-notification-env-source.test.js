import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("hub platform env contract exposes internal automation notification processor settings", () => {
  const source = readFileSync(new URL("../../src/lib/config/env.js", import.meta.url), "utf8");

  assert.match(source, /INTERNAL_AUTOMATION_SECRET/);
  assert.match(source, /INTERNAL_AUTOMATION_PROCESSOR_BATCH_SIZE/);
  assert.match(source, /internalAutomationSecret/);
  assert.match(source, /internalAutomationProcessorBatchSize/);
});
