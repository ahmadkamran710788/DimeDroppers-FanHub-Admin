"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import Tabs from "@/components/common/tabs";
import { CARD, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import FanPreview from "@/components/sponsor/brand-assets/purchased-inventory/fan-preview";
import OrgRow from "@/components/sponsor/brand-assets/purchased-inventory/org-row";
import SlotEditor from "@/components/sponsor/brand-assets/purchased-inventory/slot-editor";
import { usePurchasedInventory } from "@/components/sponsor/brand-assets/purchased-inventory/use-purchased-inventory";
import { ALL_SLOTS, CATEGORY_TEXT, type CategoryTab } from "@/components/sponsor/brand-assets/purchased-inventory/data";
import { routes } from "@/utils/routes";

const unique = (values: string[]) => [...new Set(values)];

interface ProblemProps {
  message: string;
  onRetry: () => void;
}

// A failed load, with Retry.
function Problem({ message, onRetry }: ProblemProps) {
  return (
    <div role="alert" className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
      <p className="text-sm text-[#f0c36a]">{`Couldn't load your purchased inventory: ${message}`}</p>
      <Button label="Retry" onClick={onRetry} className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")} />
    </div>
  );
}

// What the sponsor bought, by category and slot: the organizations with their packages and slots. Picking
// one shows its slot setup (coming soon) and what fans see.
export default function PurchasedInventory() {
  const s = usePurchasedInventory();
  const account = useSponsorAccount();
  const brand = { name: account?.brandName || account?.displayName || "Your brand", logoUrl: account?.logoUrl ?? null };

  const tabLabels = Object.fromEntries([
    ["ALL", "All"],
    ...(s.summary?.categories.map((c) => [c.category, c.label]) ?? []),
  ]) as Partial<Record<CategoryTab, string>>;
  const tabCounts = Object.fromEntries([
    ["ALL", s.summary?.slots ?? 0],
    ...(s.summary?.categories.map((c) => [c.category, c.slots]) ?? []),
  ]) as Partial<Record<CategoryTab, number>>;

  const chipOptions = [
    { value: ALL_SLOTS, label: "All slots", badge: String(s.tabOrganizations) },
    ...s.chips.map((c) => ({
      value: c.catalogKey,
      label: c.name,
      icon: (
        <span className={cn("text-[10px] font-bold tracking-[0.5px]", CATEGORY_TEXT[c.category])}>
          {c.categoryLabel.toUpperCase()}
        </span>
      ),
      badge: String(c.organizations),
    })),
  ];

  const selected = s.selected;
  const orgName = selected?.organization.name || "Unnamed organization";
  // Physical assets (a banner, a logo on shirts) have no fan screen to set up or preview.
  const physical = s.category === "PHYSICAL_ASSET" || s.chip?.category === "PHYSICAL_ASSET";
  // With a tab or chip, the packages of the matching slots only.
  const packageNames = selected
    ? unique(s.filtered ? selected.slots.map((slot) => slot.package.name) : selected.packages.map((p) => p.name))
    : [];

  function body() {
    if (s.chipsLoading) return <Loader />;
    if (s.chipsError) return <Problem message={s.chipsError} onRetry={s.retry} />;
    if (!s.summary?.slots) {
      return (
        <div className={cn(CARD, "rounded-[8px] p-6 flex flex-col items-start gap-4")}>
          <p className="text-[15px] text-[#a8a8a8]">
            You haven&apos;t bought any inventory yet. Packages and physical assets you activate show up here.
          </p>
          <Link
            href={routes.ui.sponsor.findOrganizations}
            className={cn(PRIMARY_BUTTON, "inline-flex items-center justify-center h-12 px-[22px] rounded-[10px] text-[15px]")}
          >
            Find organizations
          </Link>
        </div>
      );
    }

    return (
      <>
        <Tabs
          tabs={s.tabs}
          active={s.category}
          onChange={s.pickCategory}
          labels={tabLabels}
          counts={tabCounts}
          className="flex-wrap gap-y-3"
        />
        <FilterChips variant="pill" ariaLabel="Slot" options={chipOptions} value={s.catalogKey} onChange={s.pickSlot} />

        {s.orgsLoading ? (
          <Loader />
        ) : s.orgsError ? (
          <Problem message={s.orgsError} onRetry={s.retry} />
        ) : !selected ? (
          <p className="text-[15px] text-[#a8a8a8]">No organization has this slot.</p>
        ) : (
          <div className="flex flex-wrap gap-5 items-start">
            <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-[10px]">
              <div role="list" aria-label="Organizations you bought at" className="flex flex-col gap-[10px]">
                {s.items.map((item) => (
                  <div role="listitem" key={item.organization.id}>
                    <OrgRow
                      item={item}
                      filtered={s.filtered}
                      selected={item.organization.id === selected.organization.id}
                      onSelect={() => s.select(item.organization.id)}
                    />
                  </div>
                ))}
              </div>
              <Pagination page={s.page} pageCount={s.pagination?.totalPages ?? 0} onChange={s.setPage} className="self-center pt-2" />
            </div>

            {physical ? (
              <p className={cn(CARD, "flex-[3_1_560px] min-w-0 rounded-[14px] p-[22px] text-[15px] text-[#a8a8a8]")}>
                Physical assets are placed at the venue, like a banner or a logo on shirts. There&apos;s no screen to set
                up for them.
              </p>
            ) : (
              <div className="flex-[3_1_560px] min-w-0 flex flex-wrap gap-5 items-start">
                <SlotEditor
                  orgName={orgName}
                  chip={s.chip}
                  packageNames={packageNames}
                  orgCount={s.pagination?.total ?? s.items.length}
                  brand={brand}
                />
                <FanPreview chip={s.chip} orgName={orgName} brand={brand} />
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="purchased-inventory-title" className="flex flex-col gap-[14px]">
      <h3 id="purchased-inventory-title" className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">
        Purchased Inventory
      </h3>
      {body()}
    </section>
  );
}
