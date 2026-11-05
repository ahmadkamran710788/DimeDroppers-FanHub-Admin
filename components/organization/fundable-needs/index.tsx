"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Plus, X } from "lucide-react";
import Button from "@/components/common/button";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import PageHeading from "@/components/common/page-heading";
import StatCard, { type Stat } from "@/components/common/stat-card";
import { STAT_TINTS } from "@/components/common/badge-stat-card";
import NeedRow from "@/components/organization/fundable-needs/need-row";
import NeedTypes from "@/components/organization/fundable-needs/need-types";
import {
  NEED_STATUS_FILTERS,
  raisedOf,
  spentOf,
  statusOf,
  type NeedStatusFilter,
} from "@/components/organization/fundable-needs/data";
import { useFundableNeeds } from "@/context/fundable-needs";
import { formatMoney, plural } from "@/utils/helper";
import { routes } from "@/utils/routes";
import type { FundableNeed, NeedType } from "@/utils/types/fundable-need";

function statsOf(needs: FundableNeed[]): Stat[] {
  const raised = needs.reduce((sum, n) => sum + raisedOf(n), 0);
  const spent = needs.reduce((sum, n) => sum + spentOf(n.card), 0);
  const sponsorships = needs.reduce((sum, n) => sum + n.contributions.length, 0);
  const open = needs.filter((n) => statusOf(n) === "open").length;
  return [
    { label: "Awaiting sponsor", value: String(open), tint: STAT_TINTS.brown, caption: `of ${plural(needs.length, "need")}` },
    { label: "Raised", value: formatMoney(raised), tint: STAT_TINTS.green, caption: `from ${plural(sponsorships, "sponsorship")}` },
    {
      label: "Spent from cards",
      value: formatMoney(spent),
      tint: STAT_TINTS.purple,
      caption: `across ${plural(needs.length, "virtual card")}`,
    },
    { label: "Available on cards", value: formatMoney(raised - spent), tint: STAT_TINTS.blue, caption: "ready to spend" },
  ];
}

// Fundable Needs: what the organisation needs funded, by type. Each need has its own virtual card that
// sponsor funding loads onto; sponsors who fund one go on the Fan Wall.
export default function FundableNeeds() {
  const router = useRouter();
  const { needs, recordFunding } = useFundableNeeds();
  const [type, setType] = useState<NeedType | "all">("all");
  const [status, setStatus] = useState<NeedStatusFilter>("all");
  // The need whose Record funding panel is open.
  const [fundingId, setFundingId] = useState<string | null>(null);
  // The last funding recorded, shown in the banner until dismissed.
  const [funded, setFunded] = useState<{ needId: string; text: string } | null>(null);

  const shown = needs.filter((n) => (type === "all" || n.type === type) && (status === "all" || statusOf(n) === status));
  const typeName = type === "all" ? "matching" : type.toLowerCase();
  const statusLabel = NEED_STATUS_FILTERS.find((o) => o.value === status)?.label ?? "All statuses";
  const openCreate = () => router.push(routes.ui.createFundableNeed(type === "all" ? undefined : type));

  function fund(need: FundableNeed, sponsor: string, amount: number) {
    recordFunding(need.id, sponsor, amount);
    setFundingId(null);
    setFunded({
      needId: need.id,
      text: `${sponsor} sponsored “${need.title}” with ${formatMoney(amount)} and is now on your Fan Wall. The amount was loaded onto virtual card •••• ${need.card.last4}.`,
    });
  }

  return (
    <div className="flex flex-col gap-10 pb-10">
      <PageHeading
        title="Fundable Needs"
        description="Things your program needs funded. Sponsors can browse and fund them, and the Sponsor AI Agent can pitch them in outreach."
        actions={
          <Button
            variant="cta"
            label="Create need"
            icon={<Plus className="size-5" strokeWidth={2.2} />}
            onClick={openCreate}
            className="shrink-0 whitespace-nowrap"
          />
        }
      />

      {funded && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-[8px] border border-success/40 bg-success/10 px-4 py-3 text-sm text-white"
        >
          <CircleCheck className="size-5 shrink-0 text-success" strokeWidth={2} aria-hidden="true" />
          <span className="min-w-[220px] flex-1">{funded.text}</span>
          <Button
            size="sm"
            variant="outline"
            label="View Recognition Wall"
            icon={<ArrowRight className="size-4" />}
            iconPosition="end"
            onClick={() => router.push(routes.ui.recognition)}
            className="h-9 px-3"
          />
          <Button
            size="sm"
            variant="outline"
            label="View virtual card"
            icon={<ArrowRight className="size-4" />}
            iconPosition="end"
            onClick={() => router.push(routes.ui.virtualCard(funded.needId))}
            className="h-9 px-3"
          />
          <Button
            size="icon"
            icon={<X className="size-4" />}
            aria-label="Dismiss"
            onClick={() => setFunded(null)}
            className="size-9 bg-transparent backdrop-blur-none hover:bg-white/10 text-white"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {statsOf(needs).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <NeedTypes needs={needs} value={type} onChange={setType} />

      <section className="rounded-[8px] bg-surface-06 backdrop-blur-[24px] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 lg:px-6 lg:py-5">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Existing needs</h3>
            <span className="text-sm text-white/60">{`${type === "all" ? "All types" : type} · ${plural(shown.length, "need")}`}</span>
          </div>
          <FilterChipMenu
            label={statusLabel}
            ariaLabel="Filter by status"
            items={NEED_STATUS_FILTERS.map((o) => ({ label: o.label, onSelect: () => setStatus(o.value) }))}
          />
        </div>
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="font-semibold">{`No ${typeName} needs yet`}</p>
            <p className="max-w-[420px] text-sm leading-[1.5] text-white/60">Create one so sponsors can see what this would fund.</p>
            <Button variant="outline" label={`Create a ${typeName} need`} onClick={openCreate} />
          </div>
        ) : (
          shown.map((need) => (
            <NeedRow
              key={need.id}
              need={need}
              funding={fundingId === need.id}
              onStartFunding={() => {
                setFundingId(need.id);
                setFunded(null);
              }}
              onCancelFunding={() => setFundingId(null)}
              onFund={(sponsor, amount) => fund(need, sponsor, amount)}
            />
          ))
        )}
      </section>
    </div>
  );
}
