"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import StatCard, { type Stat } from "@/components/common/stat-card";
import { CARD } from "@/components/sponsor/styles";
import OrgCard from "@/components/sponsor/find-organizations/org-card";
import PackagesPanel from "@/components/sponsor/find-organizations/packages-panel";
import SearchFilters from "@/components/sponsor/find-organizations/search-filters";
import {
  DEFAULT_SEARCH,
  PAGE_SIZE,
  STAT_TINTS,
  eventFiltersOf,
  type OrgSearch,
} from "@/components/sponsor/find-organizations/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type {
  SponsorOrganizationListItem,
  SponsorOrganizationSearch,
  SponsorSearchFilters,
  SponsorSearchSort,
} from "@/utils/types/sponsor-packages";

// The query for GET /organizations: chips as comma-separated codes; the radius and NEAREST only with a
// location.
function searchParams(search: OrgSearch, sort: SponsorSearchSort, page: number) {
  const location = search.location.trim();
  const name = search.name.trim();
  return {
    ...(name && { search: name }),
    ...(search.type && { organizationType: search.type }),
    ...eventFiltersOf(search),
    ...(search.sports.length && { sports: search.sports.join(",") }),
    ...(search.inApp.length && { inApp: search.inApp.join(",") }),
    ...(search.venue.length && { venue: search.venue.join(",") }),
    sort: !location && sort === "NEAREST" ? "NAME" : sort,
    page,
    limit: PAGE_SIZE,
  };
}

interface Results {
  key: string;
  items: SponsorOrganizationListItem[];
  total: number;
  totalPages: number;
  page: number;
  // Where the search that's shown looked: "within 25 mi of Jacksonville, FL", "in Florida"; null = anywhere.
  area: string | null;
}

// Sponsor search: organizations near a location that play the picked sports and sell the picked
// inventory (GET /fanhub/sponsor-packages/organizations), and a panel with the selected one's packages.
export default function FindOrganizations() {
  const [filters, setFilters] = useState<SponsorSearchFilters | null>(null);
  // The last search run, its sort and the page shown.
  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [sort, setSort] = useState<SponsorSearchSort>("NAME");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Results | null>(null);
  const [selectedId, setSelectedId] = useState("");
  // Bumped after an activation, so the counts on the cards refresh.
  const [refreshes, setRefreshes] = useState(0);
  const listRef = useRef<HTMLElement>(null);

  // The chips, radius options and sorts, once.
  useEffect(() => {
    sponsorRequest<SponsorSearchFilters>("GET", routes.api.sponsorFilters).then((r) => {
      if (r.view) setFilters(r.view);
      else toast.error(r.message ?? "Couldn't load the search filters.");
    });
  }, []);

  const searchKey = `${JSON.stringify(search)}|${sort}|${refreshes}`;
  const key = `${searchKey}|${page}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SponsorOrganizationSearch>("GET", routes.api.sponsorOrganizations, {
      params: searchParams(search, sort, page),
    }).then((r) => {
      if (cancelled) return;
      if (!r.view) {
        toast.error(r.message ?? "Couldn't load organizations.");
        // A failed search (e.g. a location that can't be found) keeps the results already shown.
        setResults((prev) =>
          prev ? { ...prev, key } : { key, items: [], total: 0, totalPages: 0, page, area: null }
        );
        return;
      }
      const v = r.view;
      setResults({
        key,
        items: v.items,
        total: v.pagination.total,
        totalPages: v.pagination.totalPages,
        page,
        // As the backend applied it: a whole state ignores the radius.
        area: v.centre
          ? `within ${v.centre.radiusMiles} mi of ${v.centre.label}`
          : v.state
            ? `in ${v.state.name}`
            : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [key, search, sort, page]);

  const loading = results?.key !== key;
  const items = results?.items ?? [];
  // The open organization, or the first result.
  const selected = items.find((o) => o.id === selectedId) ?? items[0];

  function runSearch(next: OrgSearch) {
    setSearch(next);
    setPage(1);
    // With a location, start on the nearest.
    if (next.location.trim()) setSort("NEAREST");
    else if (sort === "NEAREST") setSort("NAME");
  }

  // Another page replaces the list; back to its top so the new page isn't below the fold.
  function goToPage(next: number) {
    setPage(next);
    listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + items.length - 1;

  const stats: Stat[] = [
    {
      label: "Matching organizations",
      value: String(results?.total ?? 0),
      tint: STAT_TINTS.organizations,
      caption: results?.area ?? "anywhere",
    },
    {
      label: "Open packages",
      value: String(items.reduce((sum, o) => sum + o.packageCount, 0)),
      tint: STAT_TINTS.packages,
      caption: "in the organizations shown",
    },
    {
      label: "Physical assets",
      value: String(items.reduce((sum, o) => sum + o.physicalAssetCount, 0)),
      tint: STAT_TINTS.addOns,
      caption: "banners, signage and more",
    },
  ];

  const hasLocation = !!search.location.trim();
  const sorts = (filters?.sorts ?? []).filter((s) => hasLocation || s.code !== "NEAREST");
  const sortLabel = filters?.sorts.find((s) => s.code === sort)?.label ?? sort;

  return (
    // Spacing and title sizes follow the admin pages, as on Fundable Needs.
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          FIND ORGANIZATIONS
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Choose the area your brand should show up in, then browse every organization and the sponsorship packages
          they have open.
        </p>
      </div>

      <SearchFilters filters={filters} onSearch={runSearch} searching={loading && page === 1} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section
          ref={listRef}
          aria-label="Organizations"
          className="flex-[1_1_400px] min-w-0 flex flex-col gap-[14px] scroll-mt-6"
        >
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Organizations</h3>
            {sorts.length > 0 && (
              <FilterChipMenu
                label={`Sort: ${sortLabel}`}
                ariaLabel="Sort"
                items={sorts.map((s) => ({
                  label: s.label,
                  onSelect: () => {
                    setSort(s.code as SponsorSearchSort);
                    setPage(1);
                  },
                }))}
              />
            )}
          </div>
          {loading ? (
            <Loader />
          ) : items.length ? (
            <>
              {items.map((org) => (
                <OrgCard key={org.id} org={org} selected={org.id === selected?.id} onSelect={() => setSelectedId(org.id)} />
              ))}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${results?.total ?? 0} organizations`}</span>
                <Pagination page={page} pageCount={results?.totalPages ?? 0} onChange={goToPage} />
              </div>
            </>
          ) : (
            <p className={cn(CARD, "rounded-[8px] p-6 text-[15px] text-[#a8a8a8]")}>
              No organizations match these filters. Try a wider radius, or clear some of the sports and inventory.
            </p>
          )}
        </section>

        {selected && (
          <PackagesPanel
            key={selected.id}
            org={selected}
            eventFilters={eventFiltersOf(search)}
            onActivated={() => setRefreshes((n) => n + 1)}
          />
        )}
      </div>
    </div>
  );
}
