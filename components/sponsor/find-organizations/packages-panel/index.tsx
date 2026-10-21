import { cn } from "@/utils/cn";
import { TIERS, type Tier } from "@/components/sponsor/data";
import { CARD } from "@/components/sponsor/styles";
import OrderSummary from "@/components/sponsor/find-organizations/order-summary";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import PhysicalAddOns from "@/components/sponsor/find-organizations/physical-add-ons";
import { packageSlots } from "@/components/sponsor/find-organizations/search-organizations";
import type { Organization } from "@/components/sponsor/find-organizations/data";

interface PackagesPanelProps {
  org: Organization;
  tier: Tier;
  onTierChange: (tier: Tier) => void;
  // Indexes of the ticked physical add-ons, and their total.
  addOns: ReadonlySet<number>;
  addOnTotal: number;
  onToggleAddOn: (index: number) => void;
  onBuy: () => void;
}

// The selected organization's packages, its physical add-ons and the order summary.
export default function PackagesPanel({ org, tier, onTierChange, addOns, addOnTotal, onToggleAddOn, onBuy }: PackagesPanelProps) {
  return (
    <section
      aria-label="Packages"
      className={cn(CARD, "flex-[1.3_1_460px] min-w-0 rounded-[8px] p-4 lg:p-[26px] flex flex-col gap-[18px]")}
    >
      <div className="flex items-center gap-[14px]">
        <OrgMonogram initials={org.initials} color={org.color} size="md" />
        <div className="min-w-0">
          <div className="text-[13px] tracking-[1px] text-[#a8a8a8] font-semibold">SPONSORSHIP PACKAGES</div>
          <h3 className="font-display font-extrabold text-2xl lg:text-[30px] uppercase leading-[1.05]">{org.name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-3">
        {TIERS.map((t, i) => (
          <PackageCard
            key={t}
            tier={t}
            price={org.prices[i]}
            left={org.packagesLeft[i]}
            games={org.games}
            season={org.season}
            slots={packageSlots(org, t)}
            selected={t === tier}
            onSelect={() => onTierChange(t)}
          />
        ))}
      </div>

      <PhysicalAddOns orgName={org.name} addOns={org.addOns} picked={addOns} onToggle={onToggleAddOn} />

      <OrderSummary
        tier={tier}
        packagePrice={org.prices[TIERS.indexOf(tier)]}
        addOnCount={addOns.size}
        addOnTotal={addOnTotal}
        onBuy={onBuy}
      />
    </section>
  );
}
