import { cn } from "@/utils/cn";
import SectionCard from "@/components/common/section-card";
import { CARD } from "@/components/sponsor/styles";
import { PLACEMENT_SPECS } from "@/components/sponsor/brand-assets/data";

// The file specs organizations ask for per placement, and whether the library covers each one.
export default function PlacementSpecs() {
  return (
    <SectionCard title="What organizations will ask for" className={cn(CARD, "gap-4")}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[14px]">
        {PLACEMENT_SPECS.map((p) => (
          <div key={p.name} className="bg-[#0b0b0b] border border-[#262626] rounded-[12px] p-4">
            <div className="text-[15px] font-bold">{p.name}</div>
            <div className="text-sm text-[#bdbdbd] mt-1">{p.spec}</div>
            <div className={cn("text-[13px] mt-2", p.missing ? "text-[#ffb27a]" : "text-[#a3e3a5]")}>
              {p.missing ? `Missing · ${p.missing}` : "Ready"}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
