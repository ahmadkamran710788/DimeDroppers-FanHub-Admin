"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import FilterChips from "@/components/common/filter-chips";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import StatCard, { type Stat } from "@/components/common/stat-card";
import { type SponsorStore, useSponsorStores } from "@/components/sponsor/find-organizations/use-sponsor-stores";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { CARD, HINT, HINT_LINK, OUTLINE_BUTTON } from "@/components/sponsor/styles";
import FundPanel from "@/components/sponsor/fundable-needs/fund-panel";
import NeedCard from "@/components/sponsor/fundable-needs/need-card";
import {
  ALL_CATEGORIES,
  ALL_STORES,
  ANYWHERE,
  AREA_OPTIONS,
  CATEGORY_CHIPS,
  DEFAULT_RADIUS,
  NEEDS_PAGE_SIZE,
  SORT_OPTIONS,
  URGENT_DAYS,
  dollars,
} from "@/components/sponsor/fundable-needs/data";
import type { NeedSponsorSort, Paged, SponsorNeedListItem, SponsorNeedsSummary } from "@/utils/types/needs";

// A response for one set of filters (key); a newer key means it's still loading.
interface Loaded<T> {
  key: string;
  view?: T;
  error?: string;
}

// The stat card tints, as in the design.
const TINTS = ["#3d6f3e", "#3d5194", "#5e4277"];

function statsOf(summary: SponsorNeedsSummary | undefined, nearby: boolean, failed: boolean): Stat[] {
  const pending = failed ? "Couldn't load" : "Loading…";
  return [
    {
      label: nearby ? "OPEN NEEDS NEARBY" : "OPEN NEEDS",
      value: summary ? String(summary.openNeedCount) : "—",
      tint: TINTS[0],
      caption: summary ? `${summary.closingSoonCount} closing in the next ${URGENT_DAYS} days` : pending,
    },
    {
      label: "STILL NEEDED",
      value: summary ? dollars(summary.stillNeededCents) : "—",
      tint: TINTS[1],
      caption: summary ? `across ${plural(summary.organizationCount, "organization")}` : pending,
    },
    {
      label: "FUNDED BY YOU",
      value: summary ? dollars(summary.fundedByYouCents) : "—",
      tint: TINTS[2],
      caption: summary ? plural(summary.fundedNeedCount, "need") : pending,
    },
  ];
}

// What the Location filter calls each store, by id: "Dell · Austin, TX" (a brand's stores often share its
// name), or the address for a store without a name. Stores that would still read the same show their full
// address, so no two choices look alike.
function storeNames(stores: SponsorStore[]): Map<string, string> {
  const short = (s: SponsorStore) => (s.hint && s.area ? `${s.label} · ${s.area}` : s.label);
  const counts = new Map<string, number>();
  for (const s of stores) counts.set(short(s), (counts.get(short(s)) ?? 0) + 1);
  return new Map(
    stores.map((s) => [s.id, s.hint && (counts.get(short(s)) ?? 0) > 1 ? `${s.label} · ${s.hint}` : short(s)])
  );
}

interface BrowseNeedsProps {
  // Bumped by the page after a payment: the stats and the list load again.
  refresh: number;
  onFunded: () => void;
}

// The Browse needs tab: open needs (GET /fanhub/sponsor-needs) near the sponsor's stores (all of them or the
// one picked in Location, from the Sponsor Profile), by category, with the stat cards on top and a panel to
// fund the selected one.
export default function BrowseNeeds({ refresh, onFunded }: BrowseNeedsProps) {
  // null while the stores load; the area waits for them, so the list isn't loaded twice.
  const stores = useSponsorStores();
  const [category, setCategory] = useState(ALL_CATEGORIES);
  // The store the needs are near: one of the sponsor's ids, or ALL_STORES.
  const [storeId, setStoreId] = useState(ALL_STORES);
  // null = the default: 25 mi around all stores, or anywhere for a sponsor without stores.
  const [radius, setRadius] = useState<string | null>(null);
  const [sort, setSort] = useState<NeedSponsorSort>("CLOSING_SOONEST");
  const [page, setPage] = useState(1);
  // Bumped to load again (Retry, or a need that can't be funded any more).
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded<Paged<SponsorNeedListItem>> | null>(null);
  const [summary, setSummary] = useState<Loaded<SponsorNeedsSummary> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const storesReady = stores !== null;
  const hasStores = !!stores?.length;
  const area = hasStores ? (radius ?? DEFAULT_RADIUS) : ANYWHERE;
  // The picked store while it's still one of the sponsor's; otherwise all of them.
  const store = stores?.find((s) => s.id === storeId) ?? null;
  const locationIds = store?.id ?? ALL_STORES;
  // Nearest sorts by distance to the stores, so it needs an area.
  const sortInUse: NeedSponsorSort = area === ANYWHERE && sort === "NEAREST" ? "CLOSING_SOONEST" : sort;

  const summaryKey = `${area}|${locationIds}|${reloads}|${refresh}`;
  const listKey = `${category}|${area}|${locationIds}|${sortInUse}|${page}|${reloads}|${refresh}`;

  useEffect(() => {
    if (!storesReady) return;
    let cancelled = false;
    const near = area === ANYWHERE ? {} : { brandLocationIds: locationIds, radiusMiles: Number(area) };
    sponsorRequest<SponsorNeedsSummary>("GET", routes.api.sponsorNeedsSummary, { params: near }).then((r) => {
      if (!cancelled) setSummary({ key: summaryKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [storesReady, area, locationIds, summaryKey]);

  useEffect(() => {
    if (!storesReady) return;
    let cancelled = false;
    const near = area === ANYWHERE ? {} : { brandLocationIds: locationIds, radiusMiles: Number(area) };
    sponsorRequest<Paged<SponsorNeedListItem>>("GET", routes.api.sponsorNeeds, {
      params: {
        categoryCode: category === ALL_CATEGORIES ? undefined : category,
        ...near,
        sort: sortInUse,
        page,
        limit: NEEDS_PAGE_SIZE,
      },
    }).then((r) => {
      if (!cancelled) setList({ key: listKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [storesReady, category, area, locationIds, sortInUse, page, listKey]);

  const currentSummary = summary?.key === summaryKey ? summary : null;
  const current = list?.key === listKey ? list : null;
  const needs = current?.view?.items ?? [];
  // The picked need while it's on this page; otherwise the first one.
  const selected = needs.find((n) => n.id === selectedId) ?? needs[0] ?? null;

  // A new filter starts again from page 1.
  const filter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const areaLabel = AREA_OPTIONS.find((o) => o.value === area)?.label ?? "Anywhere";
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortInUse)?.label ?? "";

  // Location: "All my locations" (only with more than one store) and each store.
  const names = storeNames(stores ?? []);
  const pickStore = (id: string) =>
    filter(() => {
      setStoreId(id);
      // Picking a location means near it: from Anywhere, back to the default radius.
      if (area === ANYWHERE) setRadius(null);
    });
  const locationItems = [
    ...(stores && stores.length > 1 ? [{ label: "All my locations", onSelect: () => pickStore(ALL_STORES) }] : []),
    ...(stores ?? []).map((s) => ({ label: names.get(s.id) ?? s.label, onSelect: () => pickStore(s.id) })),
  ];
  // The store the chip names: the picked one, or the sponsor's only store.
  const shownStore = store ?? (stores?.length === 1 ? stores[0] : null);
  const locationLabel =
    area === ANYWHERE
      ? "Anywhere"
      : shownStore
        ? (names.get(shownStore.id) ?? shownStore.label)
        : "All my locations";

  return (
    // Spacing follows the admin pages (gap-10).
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-10">
        {statsOf(currentSummary?.view, area !== ANYWHERE, !!currentSummary?.error).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <FilterChips
            variant="pill"
            ariaLabel="Category"
            options={CATEGORY_CHIPS}
            value={category}
            onChange={(value) => filter(() => setCategory(value))}
          />
          <div className="flex gap-3 flex-wrap">
            {hasStores && (
              <>
                <FilterChipMenu label={`Location: ${locationLabel}`} ariaLabel="Location" items={locationItems} />
                <FilterChipMenu
                  label={`Area: ${areaLabel}`}
                  ariaLabel="Area"
                  items={AREA_OPTIONS.map((o) => ({
                    label: o.label,
                    onSelect: () => filter(() => setRadius(o.value)),
                  }))}
                />
              </>
            )}
            <FilterChipMenu
              label={`Sort: ${sortLabel}`}
              ariaLabel="Sort"
              items={SORT_OPTIONS.filter((o) => !o.needsArea || area !== ANYWHERE).map((o) => ({
                label: o.label,
                onSelect: () => filter(() => setSort(o.value)),
              }))}
            />
          </div>
        </div>
        {/* Every sponsor adds a store at sign-up, but one without a map point (or none) can't search near it. */}
        {storesReady && !hasStores && (
          <p className={HINT}>
            Showing needs from anywhere. To see needs near your stores, add a store location with its address on
            your{" "}
            <Link href={routes.ui.sponsor.profile} className={HINT_LINK}>
              Sponsor Profile
            </Link>
            .
          </p>
        )}
      </div>

      {!current ? (
        <Loader />
      ) : current.error ? (
        <div className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
          <p className="text-sm text-[#f0c36a]">{`Couldn't load the needs: ${current.error}`}</p>
          <Button
            label="Retry"
            onClick={() => setReloads((n) => n + 1)}
            className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
          />
        </div>
      ) : needs.length === 0 ? (
        <div className={cn(CARD, "rounded-[8px] p-6 flex flex-col gap-2")}>
          <p className="text-[15px] text-white">No open needs match these filters.</p>
          <p className="text-[14px] text-[#a8a8a8]">
            {area !== ANYWHERE
              ? `Try a wider area${store ? ", all your locations" : ""} or another category. New needs show up here as organizations post them.`
              : "New needs show up here as organizations post them."}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 items-start">
          <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-4">
            <section
              aria-label="Needs"
              className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[18px]"
            >
              {needs.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  selected={need.id === selected?.id}
                  onSelect={() => setSelectedId(need.id)}
                />
              ))}
            </section>
            <Pagination page={page} pageCount={current.view?.pagination.totalPages ?? 0} onChange={setPage} />
          </div>
          {selected && (
            <FundPanel
              // Starts over for another need, or when this one lacks less after a reload.
              key={`${selected.id}|${selected.money.remainingToGoalCents}`}
              need={selected}
              onFunded={onFunded}
              onStale={() => setReloads((n) => n + 1)}
            />
          )}
        </div>
      )}
    </div>
  );
}
