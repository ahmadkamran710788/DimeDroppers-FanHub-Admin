import { cn } from "@/utils/cn";
import LogoTile, { type SponsorBrand } from "@/components/sponsor/brand-placements/purchased-inventory/logo-tile";
import { CATEGORY_TEXT, GENERIC_SAMPLE, PREVIEW_SAMPLES } from "@/components/sponsor/brand-placements/purchased-inventory/data";
import type { SlotChip } from "@/utils/types/sponsor-inventory";

interface FanPreviewProps {
  // The picked slot; null on "All slots".
  chip: SlotChip | null;
  orgName: string;
  brand: SponsorBrand;
}

// The slot as fans see it in the Fan Hub: Simple BPA (the sponsor's logo) until slot setup ships.
export default function FanPreview({ chip, orgName, brand }: FanPreviewProps) {
  const sample = chip ? (PREVIEW_SAMPLES[chip.catalogKey] ?? { title: chip.name, choices: [] }) : GENERIC_SAMPLE;

  return (
    <aside aria-label="Fan view preview" className="flex-[2_1_280px] min-w-0 flex flex-col gap-[10px]">
      <span className="text-xs font-semibold tracking-[1px] text-[#a8a8a8] truncate">
        WHAT FANS SEE · {orgName.toUpperCase()}
      </span>
      <div className="max-w-[360px] bg-[#08090c] border border-[#2a2f3a] rounded-[28px] pt-[18px] px-[14px] pb-[22px] flex flex-col gap-[14px]">
        <div className="text-center font-display font-black italic text-[15px]">FAN HUB</div>
        <div className="bg-[#14171d] border border-[#262b35] rounded-[16px] p-4 flex flex-col gap-3">
          <span
            className={cn("text-[10px] font-bold tracking-[0.5px]", chip ? CATEGORY_TEXT[chip.category] : "text-[#a8a8a8]")}
          >
            {chip ? `${chip.categoryLabel} · ${chip.name}`.toUpperCase() : "ANY SLOT"}
          </span>
          <span className="font-display font-black text-[20px] leading-[1.15]">{sample.title}</span>
          {sample.choices.length > 0 && (
            <div className="flex gap-2">
              {sample.choices.map((choice) => (
                <span
                  key={choice}
                  className="flex-1 min-h-10 rounded-[10px] bg-[#1e222a] flex items-center justify-center px-1.5 text-center text-[13px] font-semibold"
                >
                  {choice}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-[#262b35] pt-3 flex flex-col gap-[10px]">
            <span className="text-[11px] tracking-[0.5px] text-[#a8a8a8]">PRESENTED BY</span>
            <LogoTile brand={brand} size="large" />
          </div>
        </div>
      </div>
    </aside>
  );
}
