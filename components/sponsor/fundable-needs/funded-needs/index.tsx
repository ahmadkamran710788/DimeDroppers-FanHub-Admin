"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { CARD, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import FundedNeedCard from "@/components/sponsor/fundable-needs/funded-need-card";
import FundedNeedDetail from "@/components/sponsor/fundable-needs/funded-need-detail";
import NeedTransactions from "@/components/sponsor/fundable-needs/need-transactions";
import { FUNDED_PAGE_SIZE } from "@/components/sponsor/fundable-needs/data";
import type { Paged, SponsorFundedNeed } from "@/utils/types/needs";

interface Loaded {
  key: string;
  view?: Paged<SponsorFundedNeed>;
  error?: string;
}

interface FundedNeedsProps {
  // Bumped by the page after a payment: the list loads again.
  refresh: number;
  // How many needs the sponsor has funded, for the tab's count.
  onTotal: (total: number) => void;
  // Opens the Browse needs tab.
  onBrowse: () => void;
}

// The My funded needs tab (GET /fanhub/sponsor-needs/funded, latest payment first): the needs this sponsor
// has paid for, and for the picked one, the need itself and where the sponsor's money went.
export default function FundedNeeds({ refresh, onTotal, onBrowse }: FundedNeedsProps) {
  const [page, setPage] = useState(1);
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const key = `${page}|${reloads}|${refresh}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<Paged<SponsorFundedNeed>>("GET", routes.api.sponsorFundedNeeds, {
      params: { page, limit: FUNDED_PAGE_SIZE },
    }).then((r) => {
      if (cancelled) return;
      setList({ key, view: r.view, error: r.view ? undefined : r.message });
      if (r.view) onTotal(r.view.pagination.total);
    });
    return () => {
      cancelled = true;
    };
  }, [key, page, onTotal]);

  const current = list?.key === key ? list : null;
  const items = current?.view?.items ?? [];
  // The picked need while it's on this page; otherwise the latest one.
  const selected = items.find((f) => f.need.id === selectedId) ?? items[0] ?? null;

  if (!current) return <Loader />;

  if (current.error) {
    return (
      <div className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
        <p className="text-sm text-[#f0c36a]">{`Couldn't load your funded needs: ${current.error}`}</p>
        <Button
          label="Retry"
          onClick={() => setReloads((n) => n + 1)}
          className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
        />
      </div>
    );
  }

  if (!selected) {
    return (
      <div className={cn(CARD, "rounded-[8px] p-6 flex flex-col items-start gap-4")}>
        <p className="text-[15px] text-[#a8a8a8]">
          You haven&apos;t funded a need yet. Once you do, you&apos;ll see here how the organization spends your money.
        </p>
        <Button label="Browse needs" onClick={onBrowse} className={cn(PRIMARY_BUTTON, "h-12 px-[22px] rounded-[10px] text-[15px]")} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6 items-start">
      <section aria-label="Funded needs" className="flex-[1_1_320px] min-w-0 flex flex-col gap-3">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Funded needs</h3>
        {items.map((f) => (
          <FundedNeedCard
            key={f.need.id}
            funded={f}
            selected={f.need.id === selected.need.id}
            onSelect={() => setSelectedId(f.need.id)}
          />
        ))}
        <Pagination page={page} pageCount={current.view?.pagination.totalPages ?? 0} onChange={setPage} />
      </section>
      <section aria-label="Spending" className="flex-[2_1_560px] min-w-0 flex flex-col gap-5">
        <FundedNeedDetail funded={selected} />
        <NeedTransactions
          key={selected.need.id}
          needId={selected.need.id}
          allowedCategories={selected.need.allowedCategories}
          refresh={refresh}
        />
      </section>
    </div>
  );
}
