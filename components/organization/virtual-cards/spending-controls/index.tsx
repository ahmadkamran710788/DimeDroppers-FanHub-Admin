import SectionCard from "@/components/common/section-card";
import { MCC_CATEGORIES, mccLabel, raisedOf } from "@/components/organization/fundable-needs/data";
import { formatMoney, formatShortDate } from "@/utils/helper";
import type { FundableNeed } from "@/utils/types/fundable-need";

// Where the card works: its allowed merchant categories, merchant lock, limit, need and issue date.
export default function SpendingControls({ need }: { need: FundableNeed }) {
  const controls = [
    {
      label: "Merchant lock",
      value: need.merchant || "Any merchant in allowed categories",
      sub: need.merchant ? "checked on every authorization" : "no single-merchant lock",
    },
    { label: "Spending limit", value: `${formatMoney(raisedOf(need))} total`, sub: "all_time · grows as sponsors fund" },
    { label: "Need for", value: need.team || "Whole event", sub: need.event },
    { label: "Issued", value: formatShortDate(need.card.issuedOn), sub: "Stripe Issuing · virtual" },
  ];

  return (
    <SectionCard title="Spending controls">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[1px] text-white/60">
          {`Allowed merchant categories · ${need.mccs.length}`}
        </span>
        <ul className="flex flex-wrap gap-2">
          {need.mccs.map((slug) => (
            <li
              key={slug}
              className="flex min-w-0 flex-col gap-0.5 rounded-[8px] border border-[#638BFE]/60 bg-[#638BFE]/10 px-3 py-2"
            >
              <span className="text-sm font-medium text-white">{mccLabel(slug)}</span>
              <span className="font-mono text-[11px] text-white/60 break-all">{`${slug} · MCC ${MCC_CATEGORIES[slug].code}`}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {controls.map((c) => (
          <div key={c.label} className="flex flex-col gap-1 rounded-[8px] border border-white/10 bg-black/30 px-3.5 py-3">
            <span className="text-xs text-white/60">{c.label}</span>
            <span className="text-[15px] font-semibold text-white">{c.value}</span>
            <span className="font-mono text-xs text-white/60">{c.sub}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
