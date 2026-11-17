"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import FilterChips from "@/components/common/filter-chips";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import LoadProblem from "@/components/sponsor/load-problem";
import { CARD, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import OrgRow from "@/components/sponsor/brand-placements/purchased-inventory/org-row";
import SlotSetup from "@/components/sponsor/brand-placements/purchased-inventory/slot-setup";
import { usePurchasedInventory } from "@/components/sponsor/brand-placements/purchased-inventory/use-purchased-inventory";
import { CATEGORY_TEXT } from "@/components/sponsor/brand-placements/purchased-inventory/data";
import { routes } from "@/utils/routes";

const unique = (values: string[]) => [...new Set(values)];

interface PurchasedInventoryProps {
  // The sponsor's logos, for the slot's logo picker; a change to them loads the slots again.
  logos: BrandLogos;
  brandName: string;
}

// What the sponsor bought, by slot: the organizations with the picked slot, their packages and slots.
// Picking one shows its setup (the logo it shows; templates coming soon) and what fans see.
export default function PurchasedInventory({ logos, brandName }: PurchasedInventoryProps) {
  const s = usePurchasedInventory(logos.version);
  const problem = (message?: string) => (
    <LoadProblem message={`Couldn't load your purchased inventory: ${message}`} onRetry={s.retry} />
  );

  const chipOptions = s.chips.map((c) => ({
    value: c.catalogKey,
    label: c.name,
    icon: (
      <span className={cn("text-[10px] font-bold tracking-[0.5px]", CATEGORY_TEXT[c.category])}>
        {c.categoryLabel.toUpperCase()}
      </span>
    ),
    badge: String(c.organizations),
  }));

  const selected = s.selected;
  const orgName = selected?.organization.name || "Unnamed organization";
  // Physical assets (a banner, a logo on shirts) have no fan screen to set up or preview.
  const physical = s.chip?.category === "PHYSICAL_ASSET";
  // The packages of the picked slot only.
  const packageNames = selected ? unique(selected.slots.map((slot) => slot.package.name)) : [];
  // The picked slot's order lines at the selected organization.
  const lines = selected && s.chip ? selected.slots.filter((slot) => slot.catalogKey === s.chip?.catalogKey) : [];

  function body() {
    if (s.chipsLoading) return <Loader />;
    if (s.chipsError) return problem(s.chipsError);
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
            Find sponsorships
          </Link>
        </div>
      );
    }

    return (
      <>
        <FilterChips variant="pill" ariaLabel="Slot" options={chipOptions} value={s.catalogKey ?? ""} onChange={s.pickSlot} />

        {s.orgsLoading ? (
          <Loader />
        ) : s.orgsError ? (
          problem(s.orgsError)
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
            ) : !s.chip || lines.length === 0 ? null : (
              <div className="flex-[3_1_560px] min-w-0 flex flex-wrap gap-5 items-start">
                <SlotSetup
                  // New picks start over for another organization or slot.
                  key={`${selected.organization.id}:${s.chip.catalogKey}`}
                  orgName={orgName}
                  chip={s.chip}
                  lines={lines}
                  packageNames={packageNames}
                  orgCount={s.pagination?.total ?? s.items.length}
                  logos={logos}
                  brandName={brandName}
                  onSaved={s.refresh}
                />
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
