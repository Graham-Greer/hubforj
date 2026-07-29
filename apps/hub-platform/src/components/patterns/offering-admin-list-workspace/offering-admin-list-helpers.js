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

export function buildOfferingQuery(searchTerm, activeFilters = {}, filterDefinitions = []) {
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
