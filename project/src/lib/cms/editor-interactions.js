function moveItem(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function reorderItemsByIds(items = [], activeId, overId) {
  if (!overId || activeId === overId) return items;

  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0) return items;

  return moveItem(items, oldIndex, newIndex);
}

export function updateItemAtIndex(items = [], index, nextItem) {
  if (index < 0 || index >= items.length) return items;
  const next = [...items];
  next[index] = nextItem;
  return next;
}

export function appendCreatedItem(items = [], createItem) {
  const item = typeof createItem === "function" ? createItem() : null;
  if (!item) return items;
  return [...items, item];
}

export function removeItemById(items = [], itemId) {
  return items.filter((item) => item.id !== itemId);
}

export function getRepeatableItemStatus(item = {}) {
  const requiredKeys = ["title", "description", "content", "body"].filter((key) => key in item);
  const keysToCheck = requiredKeys.length ? requiredKeys : ["title"].filter((key) => key in item);
  const missingCount = keysToCheck.reduce((count, key) => {
    const value = item[key];
    return String(value || "").trim() ? count : count + 1;
  }, 0);

  if (missingCount > 0) {
    return { label: `Fields required (${missingCount})`, tone: "danger" };
  }
  return { label: "Ready", tone: "success" };
}

export function shouldPromptSectionTransition(hasUnsavedSectionChanges) {
  return Boolean(hasUnsavedSectionChanges);
}

export function createPendingTransition(run, options = {}) {
  return {
    run,
    title: options.title || "Discard unsaved section updates?",
    message: options.message || "You have unsaved section updates. Save section or discard before continuing.",
    confirmText: options.confirmText || "Discard and continue",
  };
}

export function executePendingTransition(transition) {
  if (!transition) return;
  if (typeof transition === "function") {
    transition();
    return;
  }
  if (typeof transition.run === "function") {
    transition.run();
  }
}
