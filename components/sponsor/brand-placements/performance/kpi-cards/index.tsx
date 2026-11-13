import { Eye, ExternalLink, List, Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { CARD } from "@/components/sponsor/styles";
import { TEMPLATE_CHIP } from "@/components/sponsor/brand-placements/data";

type KpiId = "fans" | "VISIT_WEBSITE" | "SURVEY" | "OFFER_PROMO_CODE";

// Each number's icon and its tile colors (the action ones match their setup's chip).
const ICONS: Record<KpiId, { icon: LucideIcon; tile: string }> = {
  fans: { icon: Eye, tile: "bg-[#17153a] text-[#c7d2fe]" },
  VISIT_WEBSITE: { icon: ExternalLink, tile: TEMPLATE_CHIP.VISIT_WEBSITE },
  SURVEY: { icon: List, tile: TEMPLATE_CHIP.SURVEY },
  OFFER_PROMO_CODE: { icon: Tag, tile: TEMPLATE_CHIP.OFFER_PROMO_CODE },
};

interface KpiCardsProps {
  kpis: readonly { id: KpiId; label: string; value: string; plain: string }[];
}

// The period's headline numbers: fans reached and the fans who acted, by kind of action.
export default function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px]">
      {kpis.map((k) => {
        const { icon: Icon, tile } = ICONS[k.id];
        return (
          <div key={k.id} className={cn(CARD, "rounded-[14px] p-[18px] flex flex-col gap-[10px]")}>
            <span className={cn("size-10 rounded-[10px] flex items-center justify-center", tile)}>
              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="font-display font-black text-[38px] leading-none">{k.value}</span>
            <span className="text-[15px] font-semibold">{k.label}</span>
            <span className="text-[13px] leading-[1.45] text-[#a8a8a8]">{k.plain}</span>
          </div>
        );
      })}
    </div>
  );
}
