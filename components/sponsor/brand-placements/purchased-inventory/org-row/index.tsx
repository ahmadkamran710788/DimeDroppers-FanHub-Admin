import { cn } from "@/utils/cn";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import TemplateChip from "@/components/sponsor/brand-placements/performance/template-chip";
import type { InventoryOrganizationItem } from "@/utils/types/sponsor-inventory";

interface OrgRowProps {
  item: InventoryOrganizationItem;
  selected: boolean;
  onSelect: () => void;
}

// An organization the sponsor bought the picked slot at: its packages (one per event at a tournament) and
// the slot's template.
export default function OrgRow({ item, selected, onSelect }: OrgRowProps) {
  const { organization: org, packages } = item;
  const place = [org.city, org.state].filter(Boolean).join(", ");
  const meta = [org.organizationTypeLabel, place, org.sportsType].filter(Boolean).join(" · ");

  return (
    // A clickable list row (logo, name, chips), not an action button.
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-full flex flex-col gap-[10px] p-[14px] rounded-[12px] border text-left text-white transition-colors",
        selected ? "bg-[#2a2148] border-[#8b6dff]" : "bg-[#141414] border-[#222] hover:border-[#3a3a3a]"
      )}
    >
      <span className="flex items-center gap-3 w-full">
        <OrgMonogram logoUrl={org.logoUrl} name={org.name} size="sm" />
        <span className="flex flex-col gap-[3px] min-w-0 flex-1">
          <span className="text-[15px] font-semibold">{org.name || "Unnamed organization"}</span>
          {meta && <span className="text-xs text-[#a8a8a8]">{meta}</span>}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {packages.map((p) => (
          <span key={p.orderId} className="text-[11px] text-[#a8a8a8] border border-[#333] rounded-full px-2 py-0.5">
            {p.event?.name ? `${p.name} · ${p.event.name}` : p.name}
          </span>
        ))}
        {/* Slot setup is coming soon, so every slot runs the default. */}
        <TemplateChip template="SIMPLE_BPA" />
      </span>
    </button>
  );
}
