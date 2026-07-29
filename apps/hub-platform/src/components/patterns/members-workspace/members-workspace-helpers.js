function normalizeString(value) {
  return String(value || "").trim();
}

function matchesLastSeenFilter(item, activeValue) {
  const normalizedValue = normalizeString(activeValue);
  const lastSignedInAt = normalizeString(item?.lastSignedInAt);

  if (normalizedValue === "never") {
    return !lastSignedInAt;
  }

  if (!lastSignedInAt) {
    return false;
  }

  const lastSeenTime = Date.parse(lastSignedInAt);

  if (!Number.isFinite(lastSeenTime)) {
    return false;
  }

  const now = Date.now();
  const daysSinceLastSeen = (now - lastSeenTime) / (1000 * 60 * 60 * 24);

  if (normalizedValue === "last_7") {
    return daysSinceLastSeen <= 7;
  }

  if (normalizedValue === "last_30") {
    return daysSinceLastSeen <= 30;
  }

  if (normalizedValue === "over_30") {
    return daysSinceLastSeen > 30;
  }

  return true;
}

export function normalizeSearchTerm(value) {
  return normalizeString(value).toLowerCase();
}

export function buildFilterState(filterDefinitions = []) {
  return Object.fromEntries(filterDefinitions.map((filter) => [filter.key, filter.options[0]?.value || "all"]));
}

export function buildMembersQuery(searchTerm, activeFilters = {}, filterDefinitions = []) {
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

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function buildFilterStateFromSearchParams(filterDefinitions = [], searchParams) {
  const defaults = buildFilterState(filterDefinitions);

  if (!searchParams) {
    return defaults;
  }

  return Object.fromEntries(
    filterDefinitions.map((filter) => {
      const defaultValue = filter.options[0]?.value || "all";
      const allowedValues = new Set(filter.options.map((option) => normalizeString(option.value)));
      const currentValue = normalizeString(searchParams.get(filter.key) || defaultValue);

      return [filter.key, allowedValues.has(currentValue) ? currentValue : defaultValue];
    })
  );
}

export function filterMembers(items, searchTerm, activeFilters = {}, filterDefinitions = []) {
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

  return items.filter((item) => {
    if (normalizedSearchTerm) {
      const haystack = [item.name, ...(item.searchTerms || [])]
        .map((value) => normalizeString(value).toLowerCase())
        .join(" ");

      if (!haystack.includes(normalizedSearchTerm)) {
        return false;
      }
    }

    return filterDefinitions.every((filter) => {
      const activeValue = normalizeString(activeFilters[filter.key] || filter.options[0]?.value || "all");

      if (!activeValue || activeValue === "all") {
        return true;
      }

      if (filter.key === "lastSeen") {
        return matchesLastSeenFilter(item, activeValue);
      }

      return normalizeString(item?.filterValues?.[filter.key]) === activeValue;
    });
  });
}
