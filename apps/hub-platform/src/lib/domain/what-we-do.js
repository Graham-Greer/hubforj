function normalizeString(value) {
  return String(value || "").trim();
}

export const whatWeDoStatusLabels = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const whatWeDoStatusTones = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};

export function getWhatWeDoStatusLabel(status) {
  return whatWeDoStatusLabels[normalizeString(status)] || "Unknown";
}

export function getWhatWeDoStatusTone(status) {
  return whatWeDoStatusTones[normalizeString(status)] || "neutral";
}

export function normalizeWhatWeDoInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

export function normalizeCreateWhatWeDoPayload(payload) {
  const title = normalizeString(payload.title);
  const description = normalizeString(payload.description);
  const status = normalizeString(payload.status) || "draft";
  const sortOrder = normalizeWhatWeDoInteger(payload.sortOrder, 0);

  if (!title) {
    throw new Error("What we do title is required.");
  }

  if (!description) {
    throw new Error("What we do description is required.");
  }

  if (!whatWeDoStatusLabels[status]) {
    throw new Error("Unsupported What we do status.");
  }

  return {
    title,
    description,
    status,
    sortOrder,
  };
}

export function summarizeWhatWeDoItems(items) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.status === "published") summary.published += 1;
      if (item.status === "draft") summary.drafts += 1;
      if (item.status === "archived") summary.archived += 1;
      return summary;
    },
    { total: 0, published: 0, drafts: 0, archived: 0 }
  );
}
