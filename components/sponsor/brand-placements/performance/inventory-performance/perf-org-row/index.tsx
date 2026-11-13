import { cn } from "@/utils/cn";
import ProgressBar from "@/components/common/progress-bar";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import TemplateChip from "@/components/sponsor/brand-placements/performance/template-chip";
import { lineFor, type MetricCell, type Period } from "@/components/sponsor/brand-placements/performance/use-performance";
import type { SampleOrg } from "@/components/sponsor/brand-placements/data";
import type { TemplateId } from "@/components/sponsor/brand-placements/purchased-inventory/data";

interface PerfOrgRowProps {
  org: SampleOrg;
  template: TemplateId;
  nowLabel: string;
  cells: MetricCell[];
  // Earlier setups in this period, latest first.
  past: Period[];
  // Share of the inventory's fans, 0–100.
  share: number;
  inventoryName: string;
  selected: boolean;
  onSelect: () => void;
}

// An organization's slot for the picked inventory: its setup now, the numbers, earlier setups and its share.
export default function PerfOrgRow({ org, template, nowLabel, cells, past, share, inventoryName, selected, onSelect }: PerfOrgRowProps) {
  return (
    // A clickable list row (logo, numbers, history), not an action button.
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-full flex flex-col gap-3 p-4 rounded-[12px] border text-left text-white transition-colors",
        selected ? "bg-[#2a2148] border-[#8b6dff]" : "bg-[#141414] border-[#222] hover:border-[#3a3a3a]"
      )}
    >
      <span className="flex flex-wrap items-center gap-3 w-full">
        <OrgMonogram name={org.name} size="sm" />
        <span className="flex-[1_1_200px] min-w-0 flex flex-col gap-[3px]">
          <span className="text-[15px] font-semibold">{org.name}</span>
          <span className="text-xs text-[#a8a8a8]">
            {org.meta} · {org.pkg}
          </span>
        </span>
        <TemplateChip template={template} />
      </span>
      <span className="text-xs font-semibold text-[#c7d2fe]">{nowLabel}</span>
      <span className="w-full grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
        {cells.map((c) => (
          <span key={c.label} className="flex flex-col gap-0.5 rounded-[10px] border border-[#262626] bg-[#0b0b0b] px-3 py-[10px]">
            <span className="text-[11px] text-[#a8a8a8]">{c.label}</span>
            <span className="font-display font-black text-xl">{c.value}</span>
            <span className="text-[11px] text-[#a8a8a8]">{c.how}</span>
          </span>
        ))}
      </span>
      {past.length > 0 && (
        <span className="w-full flex flex-col gap-1.5 border-t border-dashed border-[#2a2f3a] pt-[10px]">
          <span className="text-[11px] font-semibold tracking-[0.8px] text-[#a8a8a8]">EARLIER SETUPS</span>
          {past.map((p) => (
            <span key={p.label} className="flex flex-wrap items-center gap-2 text-[13px] text-[#d4d4d8]">
              <TemplateChip template={p.template} />
              <span className="text-[#a8a8a8]">{p.label}</span>
              <span>{lineFor(p)}</span>
            </span>
          ))}
        </span>
      )}
      <span className="w-full flex flex-col gap-1.5">
        <span className="flex justify-between gap-3 text-xs text-[#d4d4d8]">
          <span>Share of {inventoryName} reach (all setups)</span>
          <span>{share}%</span>
        </span>
        <ProgressBar percent={Math.max(3, share)} ariaLabel={`Share of ${inventoryName} reach`} className="h-2 bg-[#1e222a]" barClassName="bg-[#7c6cff]" />
      </span>
    </button>
  );
}
