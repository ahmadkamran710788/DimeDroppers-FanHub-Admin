import SectionCard from "@/components/common/section-card";
import { COMING_SOON, gameTime, gameTitle } from "@/components/organization/fundable-needs/data";
import { formatInstantDate, plural } from "@/utils/helper";
import { dollars } from "@/utils/needs";
import type { OrgCardListItem } from "@/utils/types/needs";

// Who the card's current need is for: the team (or the whole event) and the event, or the game.
function needFor({ currentNeed, needCount }: OrgCardListItem) {
  if (!currentNeed) return { value: "No need right now", sub: `${plural(needCount, "need")} so far` };
  if (currentNeed.event) return { value: currentNeed.team?.name ?? "Whole event", sub: currentNeed.event.name ?? "" };
  if (currentNeed.game)
    return {
      value: currentNeed.team?.name ?? gameTitle(currentNeed.game),
      sub: `${currentNeed.team ? `${gameTitle(currentNeed.game)} · ` : ""}${gameTime(currentNeed.game.utcTime)}`,
    };
  return { value: currentNeed.team?.name ?? "—", sub: "" };
}

// Where the card works: its allowed merchant categories, its limit, the need it serves and when it was issued.
export default function SpendingControls({ item }: { item: OrgCardListItem }) {
  const { card, currentNeed } = item;
  const controls = [
    { label: "Merchant lock", value: "Any merchant in allowed categories", sub: `single-merchant lock · ${COMING_SOON.toLowerCase()}` },
    // The need's raised amount, not card.spendingLimitCents: on a reused card that includes earlier needs.
    {
      label: "Spending limit",
      value: currentNeed ? `${dollars(currentNeed.money.raisedCents)} total` : "—",
      sub: "all_time · grows as sponsors fund",
    },
    { label: "Need for", ...needFor(item) },
    { label: "Issued", value: formatInstantDate(card.createdAt), sub: "Stripe Issuing · virtual" },
  ];

  return (
    <SectionCard title="Spending controls">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[1px] text-white/60">
          {`Allowed merchant categories · ${card.allowedCategories.length}`}
        </span>
        <ul className="flex flex-wrap gap-2">
          {card.allowedCategories.map((mc) => (
            <li
              key={mc.stripeCategory}
              className="flex min-w-0 flex-col gap-0.5 rounded-[8px] border border-[#638BFE]/60 bg-[#638BFE]/10 px-3 py-2"
            >
              <span className="text-sm font-medium text-white">{mc.label}</span>
              <span className="font-mono text-[11px] text-white/60 break-all">
                {mc.mcc ? `${mc.stripeCategory} · MCC ${mc.mcc}` : mc.stripeCategory}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {controls.map((c) => (
          <div key={c.label} className="flex flex-col gap-1 rounded-[8px] border border-white/10 bg-black/30 px-3.5 py-3">
            <span className="text-xs text-white/60">{c.label}</span>
            <span className="text-[15px] font-semibold text-white break-words">{c.value}</span>
            {c.sub && <span className="font-mono text-xs text-white/60">{c.sub}</span>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
