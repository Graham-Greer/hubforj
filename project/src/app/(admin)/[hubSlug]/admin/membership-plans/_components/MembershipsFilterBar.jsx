"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterBar from "@/components/patterns/filter-bar/FilterBar";

export default function MembershipsFilterBar({ search, status, paymentStatus }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => [
    {
      key: "status",
      label: "Status",
      value: status,
      options: [
        { value: "all", label: "All statuses" },
        { value: "pending", label: "Pending" },
        { value: "active", label: "Active" },
        { value: "expired", label: "Expired" },
        { value: "inactive", label: "Inactive" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "paymentStatus",
      label: "Payment",
      value: paymentStatus,
      options: [
        { value: "all", label: "All payments" },
        { value: "not-required", label: "Not required" },
        { value: "unpaid", label: "Unpaid" },
        { value: "paid", label: "Paid" },
      ],
    },
  ], [status, paymentStatus]);

  function update(next) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.type === "search") {
      if (next.value) params.set("search", next.value);
      else params.delete("search");
    }

    if (next.type === "status") {
      if (!next.value || next.value === "all") params.delete("status");
      else params.set("status", next.value);
    }

    if (next.type === "paymentStatus") {
      if (!next.value || next.value === "all") params.delete("paymentStatus");
      else params.set("paymentStatus", next.value);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return <FilterBar search={search} filters={filters} onChange={update} />;
}
