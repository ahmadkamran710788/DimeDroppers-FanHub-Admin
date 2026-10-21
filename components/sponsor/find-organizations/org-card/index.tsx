import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { fromPrice } from "@/components/sponsor/find-organizations/search-organizations";
import type { Organization } from "@/components/sponsor/find-organizations/data";

interface OrgCardProps {
  org: Organization;
  selected: boolean;
  onSelect: () => void;
}

export default function OrgCard({ org, selected, onSelect }: OrgCardProps) {
  return (
    // A whole clickable card, not an action button, so it stays a native button.
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-full text-left flex gap-4 items-start p-[18px] rounded-[8px] border text-white cursor-pointer",
        selected ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#141414] border-[#222]"
      )}
    >
      <OrgMonogram initials={org.initials} color={org.color} />
      <div className="flex-auto min-w-0 flex flex-col gap-1.5">
        <div className="flex justify-between gap-[10px] items-baseline">
          <div className="text-lg font-bold">{org.name}</div>
          <div className="text-sm text-[#a8a8a8] whitespace-nowrap">{`${org.distance} mi`}</div>
        </div>
        <div className="text-sm text-[#bdbdbd]">{org.sports.join(", ")}</div>
        <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-sm mt-1">
          <span>
            <strong>{org.reach.toLocaleString("en-US")}</strong> <span className="text-[#a8a8a8]">fan reach</span>
          </span>
          <span>
            <strong>{org.prices.length}</strong> <span className="text-[#a8a8a8]">packages</span>
          </span>
          <span>
            <strong>{org.addOns.length}</strong> <span className="text-[#a8a8a8]">physical add-ons</span>
          </span>
          <span className="text-[#a3e3a5]">{`from ${formatMoney(fromPrice(org))}`}</span>
        </div>
      </div>
    </button>
  );
}
