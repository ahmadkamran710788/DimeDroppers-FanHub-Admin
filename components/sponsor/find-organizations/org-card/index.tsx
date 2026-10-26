import { cn } from "@/utils/cn";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorOrganizationListItem } from "@/utils/types/sponsor-packages";

interface OrgCardProps {
  org: SponsorOrganizationListItem;
  selected: boolean;
  onSelect: () => void;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// One organisation in the results: logo, name, type and sports, distance, and what it sells.
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
      <OrgMonogram initials={org.initials} logoUrl={org.logoUrl} />
      <div className="flex-auto min-w-0 flex flex-col gap-1.5">
        <div className="flex justify-between gap-[10px] items-baseline">
          <div className="text-lg font-bold break-words">{org.name ?? "Unnamed organization"}</div>
          {org.distanceMiles !== null && (
            <div className="text-sm text-[#a8a8a8] whitespace-nowrap">{`${org.distanceMiles.toFixed(1)} mi`}</div>
          )}
        </div>
        <div className="text-sm text-[#bdbdbd]">
          {[
            org.organizationTypeLabel,
            [org.city, org.state].filter(Boolean).join(", "),
            org.sports.join(", "),
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-sm mt-1">
          <span>
            <strong>{org.fanReach.toLocaleString("en-US")}</strong> <span className="text-[#a8a8a8]">fan reach</span>
          </span>
          <span className="text-[#a8a8a8]">
            <strong className="text-white">{org.packageCount}</strong> {org.packageCount === 1 ? "package" : "packages"}
          </span>
          <span className="text-[#a8a8a8]">
            <strong className="text-white">{org.physicalAddOnCount}</strong>{" "}
            {org.physicalAddOnCount === 1 ? "physical asset" : "physical assets"}
          </span>
          {org.organizationType === "TOURNAMENT" && <span className="text-[#a8a8a8]">{plural(org.eventCount, "event")}</span>}
          {org.fromCents !== null && <span className="text-[#a3e3a5]">{`from ${formatCents(org.fromCents, org.currency)}`}</span>}
        </div>
      </div>
    </button>
  );
}
