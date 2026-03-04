import test from "node:test";
import assert from "node:assert/strict";
import {
  appendCreatedItem,
  createPendingTransition,
  executePendingTransition,
  getRepeatableItemStatus,
  removeItemById,
  reorderItemsByIds,
  shouldPromptSectionTransition,
  updateItemAtIndex,
} from "../../src/lib/cms/editor-interactions.js";

test("repeatable editor add/update/remove helpers are deterministic", () => {
  const initial = [{ id: "a", title: "One" }];

  const added = appendCreatedItem(initial, () => ({ id: "b", title: "Two" }));
  assert.equal(added.length, 2);
  assert.equal(initial.length, 1);

  const updated = updateItemAtIndex(added, 1, { id: "b", title: "Two updated" });
  assert.equal(updated[1].title, "Two updated");
  assert.equal(added[1].title, "Two");

  const removed = removeItemById(updated, "a");
  assert.deepEqual(removed.map((item) => item.id), ["b"]);
});

test("reorderItemsByIds supports pointer/keyboard reorder contract", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  const pointerReordered = reorderItemsByIds(items, "a", "c");
  const keyboardReordered = reorderItemsByIds(items, "a", "c");

  assert.deepEqual(pointerReordered.map((item) => item.id), ["b", "c", "a"]);
  assert.deepEqual(keyboardReordered.map((item) => item.id), ["b", "c", "a"]);
});

test("reorderItemsByIds is no-op for invalid drag targets", () => {
  const items = [{ id: "a" }, { id: "b" }];
  assert.equal(reorderItemsByIds(items, "a", "a"), items);
  assert.equal(reorderItemsByIds(items, "a", null), items);
  assert.equal(reorderItemsByIds(items, "missing", "b"), items);
});

test("getRepeatableItemStatus returns required fields count and ready tone", () => {
  const incomplete = getRepeatableItemStatus({ id: "x", title: "", content: "" });
  assert.equal(incomplete.tone, "danger");
  assert.equal(incomplete.label, "Fields required (2)");

  const ready = getRepeatableItemStatus({ id: "x", title: "Done", content: "Body" });
  assert.equal(ready.tone, "success");
  assert.equal(ready.label, "Ready");
});

test("dirty-state guard helpers create and execute pending transitions", () => {
  assert.equal(shouldPromptSectionTransition(true), true);
  assert.equal(shouldPromptSectionTransition(false), false);

  let ran = false;
  const pending = createPendingTransition(() => {
    ran = true;
  });
  assert.equal(pending.confirmText, "Discard and continue");

  executePendingTransition(pending);
  assert.equal(ran, true);
});

test("executePendingTransition accepts function transitions", () => {
  let calls = 0;
  executePendingTransition(() => {
    calls += 1;
  });
  assert.equal(calls, 1);
});
