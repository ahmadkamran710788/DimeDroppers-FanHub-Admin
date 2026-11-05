import { Check } from "lucide-react";
import TypeChip from "@/components/organization/fundable-needs/type-chip";
import { allowedLabel, forLabel } from "@/components/organization/fundable-needs/data";
import type { NeedDraft } from "@/utils/types/fundable-need";

// The need as sponsors will see it, updated as the form is filled in.
export default function NeedPreview({ draft }: { draft: NeedDraft }) {
  const why = draft.why.trim();
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-8">
      <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight text-white">
        Preview (what sponsors see)
      </h3>
      <div className="flex flex-col gap-3 rounded-[8px] bg-surface-06 p-5 text-white backdrop-blur-[24px]">
        <div className="flex flex-wrap items-center gap-2">
          <TypeChip label={draft.type || "Type of need"} />
          <span className="text-xs text-white/60">{draft.event ? forLabel(draft) : "Event and team"}</span>
        </div>
        <span className="text-lg font-semibold leading-[1.3] break-words">{draft.title.trim() || "Name of the need"}</span>
        <span className="text-sm leading-[1.5] text-white/85 break-words">
          {draft.covers.trim() || "What this covers will appear here."}
        </span>
        {why && <span className="text-sm italic leading-[1.5] text-white/60 break-words">{why}</span>}
        {draft.mccs.length > 0 && <span className="text-[13px] text-white/60">{`Card usable at: ${allowedLabel(draft)}`}</span>}
        <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-[1px] text-white/60">What you get</span>
          <span className="flex items-center gap-2 text-[13px]">
            <Check className="size-4 shrink-0 text-success" strokeWidth={2.4} aria-hidden="true" />
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
