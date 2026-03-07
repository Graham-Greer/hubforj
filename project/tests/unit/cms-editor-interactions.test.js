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
import {
  appendPricingTier,
  removePricingTier,
  resolveActivePricingTierId,
} from "../../src/lib/cms/sections/pricing-section.js";

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

test("reorderItemsByIds supports team member repeatable reorder", () => {
  const items = [{ id: "person_1" }, { id: "person_2" }, { id: "person_3" }];
  const reordered = reorderItemsByIds(items, "person_3", "person_1");
  assert.deepEqual(reordered.map((item) => item.id), ["person_3", "person_1", "person_2"]);
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

test("getRepeatableItemStatus requires image alt when card item media is selected", () => {
  const missingAlt = getRepeatableItemStatus({
    id: "card_1",
    title: "Card",
    description: "",
    media: {
      imageMediaId: "media_card_1",
      alt: "",
    },
  });
  assert.equal(missingAlt.tone, "danger");
  assert.equal(missingAlt.label, "Fields required (1)");
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

test("pricing tier helpers enforce max tier count on add", () => {
  const createTier = (id) => () => ({
    id,
    name: `Tier ${id}`,
    isFree: true,
    features: [{ id: "feature_1", text: "Feature" }],
  });

  let tiers = [];
  tiers = appendPricingTier(tiers, createTier("tier_1"));
  tiers = appendPricingTier(tiers, createTier("tier_2"));
  tiers = appendPricingTier(tiers, createTier("tier_3"));
  tiers = appendPricingTier(tiers, createTier("tier_4"));
  const capped = appendPricingTier(tiers, createTier("tier_5"));

  assert.equal(capped.length, 4);
  assert.deepEqual(capped.map((tier) => tier.id), ["tier_1", "tier_2", "tier_3", "tier_4"]);
});

test("pricing tier helpers resolve active selection after remove", () => {
  const tiers = [{ id: "tier_1" }, { id: "tier_2" }, { id: "tier_3" }];
  const removed = removePricingTier(tiers, "tier_2", "tier_2");
  assert.deepEqual(removed.items.map((tier) => tier.id), ["tier_1", "tier_3"]);
  assert.equal(removed.activeId, "tier_1");
});

test("resolveActivePricingTierId keeps existing valid selection", () => {
  const tiers = [{ id: "tier_1" }, { id: "tier_2" }];
  assert.equal(resolveActivePricingTierId(tiers, "tier_2"), "tier_2");
  assert.equal(resolveActivePricingTierId(tiers, "missing"), "tier_1");
});
