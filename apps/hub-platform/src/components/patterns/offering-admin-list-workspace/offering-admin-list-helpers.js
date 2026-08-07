function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeDateFilterValue(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function normalizeSearchTerm(value) {
  return normalizeString(value).toLowerCase();
}

export function normalizeTemporalView(value, allowedViews = ["current", "history"], fallback = "current") {
  const normalized = normalizeString(value).toLowerCase();
  const allowed = new Set(allowedViews.map((entry) => normalizeString(entry).toLowerCase()).filter(Boolean));
  const normalizedFallback = allowed.has(normalizeString(fallback).toLowerCase())
    ? normalizeString(fallback).toLowerCase()
    : "current";

  return allowed.has(normalized) ? normalized : normalizedFallback;
}

function parseTemporalDate(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function getOfferingTemporalBoundaryDate(item, view = "current") {
  const values = view === "history"
    ? [item?.temporalEndValue, item?.dateSortValue, item?.dateFilterValue]
    : [item?.temporalStartValue, item?.dateSortValue, item?.dateFilterValue];

  for (const value of values) {
    const date = parseTemporalDate(value);

    if (date) {
      return date;
    }
  }

  return null;
}

export function isOfferingHistoryItem(item, now = new Date()) {
  if (normalizeString(item?.status).toLowerCase() === "cancelled") {
    return true;
  }

  const boundary = parseTemporalDate(item?.temporalEndValue || item?.dateSortValue || item?.dateFilterValue);

  if (!boundary) {
    return false;
  }

  const today = now instanceof Date ? new Date(now) : new Date();
  today.setHours(0, 0, 0, 0);

  return boundary.getTime() < today.getTime();
}

export function filterOfferingItemsByTemporalView(items = [], temporalView = "current", now = new Date()) {
  const normalizedView = normalizeTemporalView(temporalView);

  return items.filter((item) => {
    const isHistory = isOfferingHistoryItem(item, now);
    return normalizedView === "history" ? isHistory : !isHistory;
  });
}

export function compareOfferingItemsForTemporalView(left, right, temporalView = "current") {
  const normalizedView = normalizeTemporalView(temporalView);
  const leftDate = getOfferingTemporalBoundaryDate(left, normalizedView);
  const rightDate = getOfferingTemporalBoundaryDate(right, normalizedView);

  if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) {
    return normalizedView === "history"
      ? rightDate.getTime() - leftDate.getTime()
      : leftDate.getTime() - rightDate.getTime();
  }

  if (leftDate && !rightDate) {
    return -1;
  }

  if (!leftDate && rightDate) {
    return 1;
  }

  return normalizeString(left?.title).localeCompare(normalizeString(right?.title));
}

export function sortOfferingItemsForTemporalView(items = [], temporalView = "current") {
  return [...items].sort((left, right) => compareOfferingItemsForTemporalView(left, right, temporalView));
}

export function filterOfferingItems(
  items,
  searchTerm,
  activeFilters = {},
  filterDefinitions = [],
  { dateFrom = "", dateTo = "" } = {}
) {
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
  const normalizedDateFrom = normalizeDateFilterValue(dateFrom);
  const normalizedDateTo = normalizeDateFilterValue(dateTo);

  return items.filter((item) => {
    if (normalizedSearchTerm) {
      const haystack = [item.title, item.scheduleLabel, item.summary, ...(item.searchTerms || [])]
        .map((value) => normalizeString(value).toLowerCase())
        .join(" ");

      if (!haystack.includes(normalizedSearchTerm)) {
        return false;
      }
    }

    const itemDateValue = normalizeDateFilterValue(item?.dateFilterValue || item?.dateSortValue);

    if (normalizedDateFrom && (!itemDateValue || itemDateValue < normalizedDateFrom)) {
      return false;
    }

    if (normalizedDateTo && (!itemDateValue || itemDateValue > normalizedDateTo)) {
      return false;
    }

    return filterDefinitions.every((filter) => {
      const activeValue = normalizeString(activeFilters[filter.key] || filter.options[0]?.value || "all");

      if (!activeValue || activeValue === "all") {
        return true;
      }

      return normalizeString(item?.filterValues?.[filter.key]) === activeValue;
    });
  });
}

export function buildFilterState(filterDefinitions = []) {
  return {
    ...Object.fromEntries(filterDefinitions.map((filter) => [filter.key, filter.options[0]?.value || "all"])),
    dateFrom: "",
    dateTo: "",
  };
}

export function buildOfferingQuery(searchTerm, activeFilters = {}, filterDefinitions = [], options = {}) {
  const params = new URLSearchParams();
  const normalizedSearchTerm = normalizeString(searchTerm);

  if (normalizedSearchTerm) {
    params.set("q", normalizedSearchTerm);
  }

  filterDefinitions.forEach((filter) => {
    const defaultValue = normalizeString(filter.options[0]?.value || "all");
    const currentValue = normalizeString(activeFilters[filter.key] || defaultValue);

    if (currentValue && currentValue !== defaultValue) {
      params.set(filter.key, currentValue);
    }
  });

  const normalizedDateFrom = normalizeDateFilterValue(activeFilters.dateFrom);
  const normalizedDateTo = normalizeDateFilterValue(activeFilters.dateTo);

  if (normalizedDateFrom) {
    params.set("date_from", normalizedDateFrom);
  }

  if (normalizedDateTo) {
    params.set("date_to", normalizedDateTo);
  }

  if (options.enableTemporalView) {
    const temporalViewParam = normalizeString(options.temporalViewParam) || "view";
    const defaultTemporalView = normalizeTemporalView(options.defaultTemporalView || "current");
    const temporalView = normalizeTemporalView(activeFilters[temporalViewParam], options.allowedTemporalViews, defaultTemporalView);

    if (temporalView !== defaultTemporalView) {
      params.set(temporalViewParam, temporalView);
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function buildFilterStateFromSearchParams(filterDefinitions = [], searchParams) {
  const defaults = buildFilterState(filterDefinitions);

  if (!searchParams) {
    return defaults;
  }

  return {
    ...Object.fromEntries(
      filterDefinitions.map((filter) => {
        const defaultValue = filter.options[0]?.value || "all";
        const allowedValues = new Set(filter.options.map((option) => normalizeString(option.value)));
        const currentValue = normalizeString(searchParams.get(filter.key) || defaultValue);

        return [filter.key, allowedValues.has(currentValue) ? currentValue : defaultValue];
      })
    ),
    dateFrom: normalizeDateFilterValue(searchParams.get("date_from")),
    dateTo: normalizeDateFilterValue(searchParams.get("date_to")),
  };
}
