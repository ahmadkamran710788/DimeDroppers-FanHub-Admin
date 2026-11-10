import { Check } from "lucide-react";
import TypeChip from "@/components/organization/fundable-needs/type-chip";
import { COMING_SOON, allowedLabel } from "@/components/organization/fundable-needs/data";
import type { MerchantCategory } from "@/utils/types/needs";

export interface NeedPreviewData {
  categoryName: string;
  // Who it's for: "Team · Event", or the game.
  forText: string;
  title: string;
  description: string;
  whyItMatters: string;
  // "$1,500", or "" before a goal is typed.
  goal: string;
  allowedCategories: MerchantCategory[];
}

// The need as sponsors will see it, updated as the form is filled in.
export default function NeedPreview({ data }: { data: NeedPreviewData }) {
  const why = data.whyItMatters.trim();
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-8">
      <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight text-white">
        Preview (what sponsors see)
      </h3>
      {/* No backdrop blur: it sticks while the form scrolls, and over the blurred page it looked the same. */}
      <div className="flex flex-col gap-3 rounded-[8px] bg-surface-06 p-5 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <TypeChip label={data.categoryName || "Type of need"} />
          <span className="text-xs text-white/60">{data.forText || "Who it's for"}</span>
        </div>
        <span className="text-lg font-semibold leading-[1.3] break-words">{data.title.trim() || "Name of the need"}</span>
        <span className="text-sm leading-[1.5] text-white/85 break-words whitespace-pre-line">
          {data.description.trim() || "What this covers will appear here."}
        </span>
        {why && <span className="text-sm italic leading-[1.5] text-white/60 break-words">{why}</span>}
        <span className="text-sm">
          <span className="font-semibold">{data.goal ? `Goal ${data.goal}` : "Goal amount"}</span>
          <span className="text-white/60"> · $0 raised</span>
        </span>
        {data.allowedCategories.length > 0 && (
          <span className="text-[13px] leading-[1.5] text-white/60">{`Card usable at: ${allowedLabel(data.allowedCategories)}`}</span>
        )}
        <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1px] text-white/60">
            What you get
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] normal-case tracking-normal">{COMING_SOON}</span>
          </span>
          <span className="flex items-center gap-2 text-[13px] text-white/60">
            <Check className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            Shown on our Fan Wall as soon as you fund
          </span>
        </div>
        {/* What the sponsor's button will look like; not clickable here. */}
        <span
          aria-hidden="true"
          className="mt-1 flex h-11 items-center justify-center rounded-[8px] font-semibold text-white"
          style={{ background: "var(--gradient-cta)" }}
        >
          Fund this need
        </span>
      </div>
    </aside>
  );
}
