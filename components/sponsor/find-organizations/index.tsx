"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import ConfirmModal from "@/components/common/confirm-modal";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import StatCard, { type Stat } from "@/components/common/stat-card";
import { TIERS, tierLabel, type Tier } from "@/components/sponsor/data";
import { CARD } from "@/components/sponsor/styles";
import OrgCard from "@/components/sponsor/find-organizations/org-card";
import PackagesPanel from "@/components/sponsor/find-organizations/packages-panel";
import SearchFilters from "@/components/sponsor/find-organizations/search-filters";
import { searchOrganizations, sortOrganizations } from "@/components/sponsor/find-organizations/search-organizations";
import {
  DEFAULT_SEARCH,
  DEFAULT_TIER,
  SORTS,
  STAT_TINTS,
  type OrgSearch,
  type Organization,
  type SortOption,
} from "@/components/sponsor/find-organizations/data";

// The three stat cards over the results.
function resultStats(search: OrgSearch, orgs: Organization[]): Stat[] {
  return [
    {
      label: "Matching organizations",
      value: String(orgs.length),
      tint: STAT_TINTS.organizations,
      caption: `within ${search.radius} mi of ${search.location}`,
    },
    {
      label: "Open packages",
      value: String(orgs.length * TIERS.length),
      tint: STAT_TINTS.packages,
      caption: "Platinum, Gold, Silver and Bronze",
    },
    {
      label: "Physical add-ons",
      value: String(orgs.reduce((count, o) => count + o.addOns.length, 0)),
      tint: STAT_TINTS.addOns,
      caption: "banners, scoreboards, PA and booths",
    },
  ];
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Sponsor search: organizations near a location that play the picked sports and sell the picked
// inventory, and a panel to buy one of the selected organization's packages.
export default function FindOrganizations() {
  // The last search run and what it found.
  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [found, setFound] = useState(() => searchOrganizations(DEFAULT_SEARCH));
  const [sort, setSort] = useState<SortOption>(SORTS[0]);
  const [selectedId, setSelectedId] = useState(() => sortOrganizations(found, sort)[0]?.id);
  const [tier, setTier] = useState<Tier>(DEFAULT_TIER);
  // Indexes of the selected organization's ticked physical add-ons; the first starts ticked.
  const [addOns, setAddOns] = useState<ReadonlySet<number>>(new Set([0]));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const results = sortOrganizations(found, sort);
  const selected = results.find((o) => o.id === selectedId);
  const addOnTotal = selected?.addOns.reduce((sum, a, i) => (addOns.has(i) ? sum + a.price : sum), 0) ?? 0;
  const total = selected ? selected.prices[TIERS.indexOf(tier)] + addOnTotal : 0;

  // Picking an organization starts its panel on the Gold package with no add-ons.
  function selectOrg(id: number) {
    setSelectedId(id);
    setTier(DEFAULT_TIER);
    setAddOns(new Set());
  }

  function runSearch(next: OrgSearch) {
    // Stands in for the search request until the API is integrated.
    const orgs = searchOrganizations(next);
    setSearch(next);
    setFound(orgs);
    // Keep the open organization if it still matches; otherwise open the first result.
    if (orgs.length && !orgs.some((o) => o.id === selectedId)) selectOrg(sortOrganizations(orgs, sort)[0].id);
  }

  function toggleAddOn(index: number) {
    setAddOns((prev) => {
      const next = new Set(prev);
      if (!next.delete(index)) next.add(index);
      return next;
    });
  }

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

      <SearchFilters onSearch={runSearch} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-10">
        {resultStats(search, found).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section aria-label="Organizations" className="flex-[1_1_400px] min-w-0 flex flex-col gap-[14px]">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Organizations</h3>
            <FilterChipMenu
              label={`Sort: ${sort}`}
              ariaLabel="Sort"
              items={SORTS.map((s) => ({ label: s, onSelect: () => setSort(s) }))}
            />
          </div>
          {results.length ? (
            results.map((org) => (
              <OrgCard key={org.id} org={org} selected={org.id === selectedId} onSelect={() => selectOrg(org.id)} />
            ))
          ) : (
            <p className={cn(CARD, "rounded-[8px] p-6 text-[15px] text-[#a8a8a8]")}>
              No organizations match these filters. Try a wider radius, or clear some of the sports and inventory.
            </p>
          )}
        </section>

        {selected && (
          <PackagesPanel
            org={selected}
            tier={tier}
            onTierChange={setTier}
            addOns={addOns}
            addOnTotal={addOnTotal}
            onToggleAddOn={toggleAddOn}
            onBuy={() => setConfirmOpen(true)}
          />
        )}
      </div>

      {selected && (
        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Buy package"
          message={`Send ${selected.name} a request for the ${tierLabel(tier)} package${
            addOns.size ? ` and ${plural(addOns.size, "physical add-on")}` : ""
          }, ${formatMoney(total)} per season? The organization confirms before you’re charged.`}
          confirmLabel="Send request"
          busyLabel="Sending…"
          onConfirm={async () => {
            toast.success(`Package request sent to ${selected.name}`);
            return true;
          }}
        />
      )}
    </div>
  );
}
