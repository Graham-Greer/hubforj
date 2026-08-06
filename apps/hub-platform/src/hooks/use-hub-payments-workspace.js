import { useMemo, useRef, useState } from "react";
import { getOperationalPaymentStatus } from "@/components/patterns/hub-payments-workspace/hub-payments-helpers";

function resolveDateFilterValue(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function useHubPaymentsWorkspace(items, initialFilters = {}) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || "");
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || "");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openPlanId, setOpenPlanId] = useState(null);
  const [planDeleteTarget, setPlanDeleteTarget] = useState(null);
  const createFormRef = useRef(null);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const normalizedSearchTerm = String(searchTerm || "").trim().toLowerCase();

        if (
          normalizedSearchTerm &&
          !String(item.userName || item.userEmail || "")
            .toLowerCase()
            .includes(normalizedSearchTerm)
        ) {
          return false;
        }

        if (typeFilter !== "all" && item.kind !== typeFilter) {
          return false;
        }

        if (statusFilter !== "all" && getOperationalPaymentStatus(item) !== statusFilter) {
          return false;
        }

        const itemDate = resolveDateFilterValue(item.lifecycleDate || item.dueDate);

        if (dateFrom && (!itemDate || itemDate < dateFrom)) {
          return false;
        }

        if (dateTo && (!itemDate || itemDate > dateTo)) {
          return false;
        }

        return true;
      }),
    [dateFrom, dateTo, items, searchTerm, statusFilter, typeFilter]
  );

  const impactedMembers = useMemo(
    () => new Set(filteredItems.map((item) => item.userId).filter(Boolean)).size,
    [filteredItems]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, pageSize, safeCurrentPage]);

  function openCreatePlan() {
    setOpenPlanId("__create__");
    requestAnimationFrame(() => {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return {
    searchTerm,
    typeFilter,
    statusFilter,
    pageSize,
    currentPage: safeCurrentPage,
    dateFrom,
    dateTo,
    openPlanId,
    planDeleteTarget,
    createFormRef,
    filteredItems,
    paginatedItems,
    impactedMembers,
    setSearchTerm: (value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    },
    setTypeFilter: (value) => {
      setTypeFilter(value);
      setCurrentPage(1);
    },
    setStatusFilter: (value) => {
      setStatusFilter(value);
      setCurrentPage(1);
    },
    setDateFrom: (value) => {
      setDateFrom(value);
      setCurrentPage(1);
    },
    setDateTo: (value) => {
      setDateTo(value);
      setCurrentPage(1);
    },
    setPageSize: (value) => {
      setPageSize(value);
      setCurrentPage(1);
    },
    setCurrentPage,
    setOpenPlanId,
    setPlanDeleteTarget,
    openCreatePlan,
  };
}
