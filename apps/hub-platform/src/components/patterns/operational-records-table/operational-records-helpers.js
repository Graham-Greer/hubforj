export function normalizeSearchTerm(value) {
  return String(value || "").trim().toLowerCase();
}

export function filterOperationalRecords(records, searchTerm, searchFields = [], activeFilters = {}, filters = []) {
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

  return records.filter((record) => {
    const matchesSearch =
      !normalizedSearchTerm ||
      searchFields.some((field) => String(record?.[field] || "").toLowerCase().includes(normalizedSearchTerm));

    if (!matchesSearch) {
      return false;
    }

    return filters.every((filter) => {
      const activeValue = activeFilters[filter.key] || filter.options[0]?.value || "all";

      if (activeValue === "all") {
        return true;
      }

      return String(filter.getValue(record) || "") === activeValue;
    });
  });
}
