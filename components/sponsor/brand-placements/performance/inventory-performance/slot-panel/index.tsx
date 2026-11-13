import { ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { CARD, EYEBROW } from "@/components/sponsor/styles";
import TemplateChip from "@/components/sponsor/brand-placements/performance/template-chip";
import { TEMPLATE_NAME, lineFor, type SlotDetail } from "@/components/sponsor/brand-placements/performance/use-performance";

interface SlotPanelProps {
  detail: SlotDetail;
  rangeLabel: string;
  onEditSetup: () => void;
}

// The selected slot: its setup before and now, the numbers now, a tip and its setup history.
export default function SlotPanel({ detail, rangeLabel, onEditSetup }: SlotPanelProps) {
  const { previous, now } = detail;

  return (
    <aside aria-labelledby="slot-panel-title" className={cn(CARD, "flex-[2_1_320px] min-w-0 rounded-[14px] p-5 flex flex-col gap-[14px]")}>
      <div className="flex flex-col gap-1.5">
        <span className={EYEBROW}>{detail.kicker}</span>
        <h4 id="slot-panel-title" className="font-display font-black text-[22px] leading-tight">
          {detail.title}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-[10px]">
        <div className="rounded-[12px] border border-[#333] bg-[#0b0b0b] p-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[1px] text-[#a8a8a8]">PREVIOUSLY</span>
          {previous ? (
            <>
              <TemplateChip template={previous.template} className="self-start" />
              <span className="text-xs text-[#a8a8a8]">{previous.label}</span>
              <span className="text-[13px] leading-[1.4] text-[#d4d4d8]">{lineFor(previous)}</span>
            </>
          ) : (
            <span className="text-[13px] leading-[1.4] text-[#a8a8a8]">
              No earlier setup. This slot has been {TEMPLATE_NAME[now.template]} since it was bought ({now.since}).
            </span>
          )}
        </div>
        <div className="rounded-[12px] border border-[#4a5bd8] bg-[#141a35] p-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[1px] text-[#c7d2fe]">NOW</span>
          <TemplateChip template={now.template} className="self-start" />
          <span className="text-xs text-[#a8a8a8]">Since {now.since}</span>
          <span className="text-[13px] leading-[1.4] text-[#d4d4d8]">{lineFor(now)}</span>
        </div>
      </div>

      <span className={EYEBROW}>NOW, {rangeLabel.toUpperCase()}</span>
      {detail.cards.map((c) => (
        <div key={c.label} className="flex items-center justify-between gap-3 border-b border-[#222] pb-3">
          <span className="flex flex-col gap-[3px]">
            <span className="text-sm font-medium">{c.label}</span>
            <span className="text-xs text-[#a8a8a8]">{c.how}</span>
          </span>
          <span className="font-display font-black text-2xl whitespace-nowrap">{c.value}</span>
        </div>
      ))}
      <p className="text-sm leading-normal text-[#d4d4d8]">{detail.tip}</p>

      <div className="flex flex-col gap-[10px] border-t border-[#222] pt-[14px]">
        <span className={EYEBROW}>SETUP HISTORY</span>
        <ol className="flex flex-col gap-[10px]">
          {detail.history.map((p) => (
            <li key={p.label} className="flex gap-[10px]">
              <span aria-hidden="true" className={cn("mt-[5px] size-2.5 flex-none rounded-full", p.current ? "bg-[#7c6cff]" : "bg-[#52525b]")} />
              <span className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <TemplateChip template={p.template} />
                  <span className="text-xs text-[#a8a8a8]">{p.label}</span>
                </span>
                <span className="text-[13px] text-[#d4d4d8]">{lineFor(p)}</span>
              </span>
            </li>
          ))}
        </ol>
        <span className="text-xs leading-normal text-[#a8a8a8]">{detail.historyNote}</span>
      </div>

      <Button
        label="Change this slot’s setup"
        icon={<ArrowRight className="size-4" strokeWidth={2} />}
        iconPosition="end"
        onClick={onEditSetup}
        className="self-start h-11 px-4 gap-2 rounded-[10px] border border-[#8b6dff] bg-[#2a2148] text-white text-[15px] font-semibold backdrop-blur-none"
      />
    </aside>
  );
}
