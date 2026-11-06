"use client";

import { useState } from "react";
import FundedNeedCard from "@/components/sponsor/fundable-needs/funded-need-card";
import FundedNeedDetail from "@/components/sponsor/fundable-needs/funded-need-detail";
import NeedTransactions from "@/components/sponsor/fundable-needs/need-transactions";
import { FUNDED_NEEDS, NEEDS } from "@/components/sponsor/fundable-needs/data";

const needOf = (needId: number) => NEEDS.find((n) => n.id === needId) ?? NEEDS[0];

// The My funded needs tab: the needs this sponsor has funded, and for the picked one, the need itself and
// what the organization has bought with its card.
export default function FundedNeeds() {
  const [selectedId, setSelectedId] = useState(FUNDED_NEEDS[0].needId);
  const funded = FUNDED_NEEDS.find((f) => f.needId === selectedId) ?? FUNDED_NEEDS[0];

  return (
    <div className="flex flex-wrap gap-6 items-start">
      <section aria-label="Funded needs" className="flex-[1_1_320px] min-w-0 flex flex-col gap-3">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Funded needs</h3>
        {FUNDED_NEEDS.map((f) => (
          <FundedNeedCard
            key={f.needId}
            need={needOf(f.needId)}
            amount={f.amount}
            selected={f.needId === funded.needId}
            onSelect={() => setSelectedId(f.needId)}
          />
        ))}
      </section>
      <section aria-label="Spending" className="flex-[2_1_560px] min-w-0 flex flex-col gap-5">
        <FundedNeedDetail need={needOf(funded.needId)} funded={funded} />
        <NeedTransactions funded={funded} />
      </section>
    </div>
  );
}
