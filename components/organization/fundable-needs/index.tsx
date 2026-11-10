"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import Loader from "@/components/common/loader";
import PageHeading from "@/components/common/page-heading";
import Pagination from "@/components/common/pagination";
import StatCard, { type Stat } from "@/components/common/stat-card";
import { STAT_TINTS } from "@/components/common/badge-stat-card";
import NeedRow from "@/components/organization/fundable-needs/need-row";
import NeedTypes from "@/components/organization/fundable-needs/need-types";
import { NEEDS_PAGE_SIZE, NEED_STATUS_FILTERS } from "@/components/organization/fundable-needs/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { plural } from "@/utils/helper";
import { dollars } from "@/utils/needs";
import { routes } from "@/utils/routes";
import type { NeedOptions, NeedStatus, OrgNeedListItem, OrgNeedsSummary, Paged } from "@/utils/types/needs";

// A response for one set of filters (key); a newer key means it's still loading.
interface Loaded<T> {
  key: string;
  view?: T;
  error?: string;
}

function statsOf(summary: OrgNeedsSummary | undefined): Stat[] {
  const s = summary;
  const dash = "—";
  return [
    {
      label: "Awaiting sponsor",
      value: s ? String(s.awaitingSponsorCount) : dash,
      tint: STAT_TINTS.brown,
      caption: s ? `of ${plural(s.needCount, "need")}` : " ",
    },
    {
      label: "Raised",
      value: s ? dollars(s.raisedCents) : dash,
      tint: STAT_TINTS.green,
      caption: s ? `from ${plural(s.sponsorshipCount, "sponsorship")}` : " ",
    },
    {
      label: "Spent from cards",
      value: s ? dollars(s.spentCents) : dash,
      tint: STAT_TINTS.purple,
      caption: s ? `across ${plural(s.cardCount, "virtual card")}` : " ",
    },
    {
      label: "Available on cards",
      value: s ? dollars(s.availableCents) : dash,
      tint: STAT_TINTS.blue,
      caption: "ready to spend",
    },
  ];
}

// Fundable Needs: what the organisation needs funded (GET /fanhub/org/needs), by category and status. Sponsors
// fund a need from their app; the money loads onto the organisation's virtual card for that category.
export default function FundableNeeds() {
  const router = useRouter();
  // The categories for the tiles; null while loading, undefined when it failed.
  const [options, setOptions] = useState<NeedOptions | null | undefined>(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<NeedStatus | "">("");
  const [page, setPage] = useState(1);
  // Bumped to load the list and the stats again (Retry, or after a cancel).
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded<Paged<OrgNeedListItem>> | null>(null);
  const [summary, setSummary] = useState<Loaded<OrgNeedsSummary> | null>(null);
  const [cancelling, setCancelling] = useState<OrgNeedListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    sponsorRequest<NeedOptions>("GET", routes.api.orgNeedOptions).then((r) => {
      if (!cancelled) setOptions(r.view ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryKey = String(reloads);
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<OrgNeedsSummary>("GET", routes.api.orgNeedsSummary).then((r) => {
      if (!cancelled) setSummary({ key: summaryKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [summaryKey]);

  const listKey = `${category}|${status}|${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<Paged<OrgNeedListItem>>("GET", routes.api.orgNeeds, {
      params: { categoryCode: category || undefined, status: status || undefined, page, limit: NEEDS_PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setList({ key: listKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [listKey, category, status, page]);

  const current = list?.key === listKey ? list : null;
  const needs = current?.view?.items ?? [];
  const total = current?.view?.pagination.total ?? 0;
  const categoryName = options?.categories.find((c) => c.code === category)?.name;
  const typeName = categoryName ? categoryName.toLowerCase() : "matching";
  const statusLabel = NEED_STATUS_FILTERS.find((o) => o.value === status)?.label ?? "All statuses";
  const openCreate = () => router.push(routes.ui.createFundableNeed(category || undefined));

  // A new filter starts again from page 1.
  const filter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const cancelNeed = async () => {
    if (!cancelling) return false;
    const r = await sponsorRequest<OrgNeedListItem>("POST", routes.api.orgNeedCancel(cancelling.id));
    if (r.view) toast.success(`“${cancelling.title}” cancelled.`);
    else toast.error(r.message ?? "Couldn't cancel the need, please try again.");
    // 409: a sponsor has paid (or is paying) meanwhile; the list shows it as it is now.
    if (r.view || r.status === 409) setReloads((n) => n + 1);
    return !!r.view || r.status === 409;
  };

  return (
    <div className="flex flex-col gap-10 pb-10">
      <PageHeading
        title="Fundable Needs"
        description="Things your program needs funded. Sponsors browse and fund them, and their money loads onto your virtual card for that kind of need."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {statsOf(summary?.key === summaryKey ? summary.view : undefined).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <NeedTypes
        categories={options?.categories ?? null}
        failed={options === undefined}
        value={category}
        onChange={(code) => filter(() => setCategory(code))}
      />

      <section className="rounded-[8px] bg-surface-06 backdrop-blur-[24px] text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 lg:px-6 lg:py-5">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Existing needs</h3>
            <span className="text-sm text-white/60">
              {`${categoryName ?? "All types"}${current?.view ? ` · ${plural(total, "need")}` : ""}`}
            </span>
          </div>
          <FilterChipMenu
            label={statusLabel}
            ariaLabel="Filter by status"
            items={NEED_STATUS_FILTERS.map((o) => ({ label: o.label, onSelect: () => filter(() => setStatus(o.value)) }))}
          />
        </div>
        {!current ? (
          <div className="py-10">
            <Loader />
          </div>
        ) : current.error ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-sm text-white/60">{`Couldn't load your needs: ${current.error}`}</p>
            <Button variant="outline" label="Try again" onClick={() => setReloads((n) => n + 1)} />
          </div>
        ) : needs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="font-semibold">{`No ${status ? `${statusLabel.toLowerCase()} ` : ""}${typeName} needs yet`}</p>
            <p className="max-w-[420px] text-sm leading-[1.5] text-white/60">Create one so sponsors can see what this would fund.</p>
            <Button variant="outline" label={`Create a ${typeName} need`} onClick={openCreate} />
          </div>
        ) : (
          <>
            {needs.map((need) => (
              <NeedRow key={need.id} need={need} onCancel={() => setCancelling(need)} />
            ))}
            <Pagination
              page={page}
              pageCount={current.view?.pagination.totalPages ?? 0}
              onChange={setPage}
              className="border-t border-white/10 p-4 lg:px-6"
            />
          </>
        )}
      </section>

      <ConfirmModal
        isOpen={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancel need"
        message={
          <>
            Cancel <span className="font-semibold">{cancelling?.title}</span>? Sponsors won&apos;t see it any more. A need can
            only be cancelled before any sponsor has paid.
          </>
        }
        confirmLabel="Cancel need"
        busyLabel="Cancelling…"
        cancelLabel="Keep need"
        onConfirm={cancelNeed}
        destructive
      />
    </div>
  );
}
