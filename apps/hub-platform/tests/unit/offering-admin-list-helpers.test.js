import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFilterStateFromSearchParams,
  buildFilterState,
  buildOfferingQuery,
  filterOfferingItems,
  normalizeSearchTerm,
} from "../../src/components/patterns/offering-admin-list-workspace/offering-admin-list-helpers.js";

test("normalizeSearchTerm trims and lowercases input", () => {
  assert.equal(normalizeSearchTerm("  Spring Gala  "), "spring gala");
});

test("buildFilterState uses the first option for each filter", () => {
  assert.deepEqual(
    buildFilterState([
      {
        key: "status",
        options: [{ value: "all", label: "All" }, { value: "draft", label: "Draft" }],
      },
      {
        key: "pricing",
        options: [{ value: "all", label: "All" }, { value: "paid", label: "Paid" }],
      },
    ]),
    {
      status: "all",
      pricing: "all",
      dateFrom: "",
      dateTo: "",
    }
  );
});

test("buildOfferingQuery only persists non-default filters and search", () => {
  assert.equal(
    buildOfferingQuery(
      " Spring Gala ",
      { status: "published", pricing: "all", dateFrom: "", dateTo: "" },
      [
        {
          key: "status",
          options: [{ value: "all", label: "All" }, { value: "published", label: "Published" }],
        },
        {
          key: "pricing",
          options: [{ value: "all", label: "All" }, { value: "paid", label: "Paid" }],
        },
      ]
    ),
    "?q=Spring+Gala&status=published"
  );
});

test("buildFilterStateFromSearchParams restores allowed values and falls back safely", () => {
  assert.deepEqual(
    buildFilterStateFromSearchParams(
      [
        {
          key: "status",
          options: [{ value: "all", label: "All" }, { value: "published", label: "Published" }],
        },
        {
          key: "pricing",
          options: [{ value: "all", label: "All" }, { value: "paid", label: "Paid" }],
        },
      ],
      new URLSearchParams("status=published&pricing=invalid&date_from=2026-05-01&date_to=2026-05-31")
    ),
    {
      status: "published",
      pricing: "all",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-31",
    }
  );
});

test("filterOfferingItems matches search text across title, schedule, summary, and search terms", () => {
  const items = [
    {
      id: "1",
      title: "Spring Gala",
      scheduleLabel: "Sat, 10 May 2026",
      summary: "Fundraising social evening",
      searchTerms: ["Town Hall", "Special Event"],
      filterValues: { status: "published" },
    },
    {
      id: "2",
      title: "Leadership Cohort",
      scheduleLabel: "Mon, 12 May 2026",
      summary: "Leadership course",
      searchTerms: ["Online", "Programme"],
      filterValues: { status: "draft" },
    },
  ];

  const filterDefinitions = [
    {
      key: "status",
      options: [{ value: "all", label: "All" }, { value: "published", label: "Published" }],
    },
  ];

  assert.equal(filterOfferingItems(items, "town hall", { status: "all" }, filterDefinitions).length, 1);
  assert.equal(filterOfferingItems(items, "leadership", { status: "draft" }, filterDefinitions).length, 1);
  assert.equal(filterOfferingItems(items, "leadership", { status: "published" }, filterDefinitions).length, 0);
});

test("filterOfferingItems applies optional date range filtering", () => {
  const items = [
    {
      id: "1",
      title: "Spring Gala",
      scheduleLabel: "Sat, 10 May 2026",
      summary: "Fundraising social evening",
      searchTerms: ["Town Hall"],
      filterValues: { status: "published" },
      dateFilterValue: "2026-05-10",
    },
    {
      id: "2",
      title: "Morning Yoga",
      scheduleLabel: "Tue, 02 Jun 2026",
      summary: "Weekly practice",
      searchTerms: ["Studio One"],
      filterValues: { status: "published" },
      dateFilterValue: "2026-06-02",
    },
  ];

  const filterDefinitions = [
    {
      key: "status",
      options: [{ value: "all", label: "All" }, { value: "published", label: "Published" }],
    },
  ];

  assert.equal(
    filterOfferingItems(items, "", { status: "published" }, filterDefinitions, {
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
    }).length,
    1
  );
});
