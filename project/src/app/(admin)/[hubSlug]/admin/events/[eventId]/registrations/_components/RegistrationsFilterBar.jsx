"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterBar from "@/components/patterns/filter-bar/FilterBar";

export default function RegistrationsFilterBar({ search, status }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        value: status,
        options: [
          { value: "all", label: "All statuses" },
          { value: "registered", label: "Registered" },
          { value: "waitlisted", label: "Waitlisted" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
    ],
    [status]
  );

  function updateQuery(next) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.type === "search") {
      if (next.value) params.set("search", next.value);
      else params.delete("search");
    }

    if (next.type === "status") {
      if (!next.value || next.value === "all") params.delete("status");
      else params.set("status", next.value);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return <FilterBar search={search} filters={filters} onChange={updateQuery} />;
}
