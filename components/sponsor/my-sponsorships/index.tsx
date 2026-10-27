"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import Tabs from "@/components/common/tabs";
import { CARD, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import CancelModal from "@/components/sponsor/my-sponsorships/cancel-modal";
import SponsorshipRow from "@/components/sponsor/my-sponsorships/sponsorship-row";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PackageActivation, PackageActivationsPage, PackageActivationStatus } from "@/utils/types/sponsor-packages";

const PAGE_SIZE = 10;
const TABS = ["Active", "Expired", "Cancelled", "All"] as const;
type Tab = (typeof TABS)[number];
const TAB_STATUS: Record<Tab, PackageActivationStatus | undefined> = {
  Active: "ACTIVE",
  Expired: "EXPIRED",
  Cancelled: "CANCELLED",
  All: undefined,
};
const EMPTY_TEXT: Record<Tab, string> = {
  Active: "You have no active sponsorships.",
  Expired: "None of your sponsorships has ended yet.",
  Cancelled: "You haven't cancelled any sponsorship.",
  All: "You haven't activated any sponsorship yet.",
};

const LINK_BUTTON = "inline-flex items-center justify-center h-12 px-[22px] rounded-[10px] text-[15px]";

interface Loaded {
  key: string;
  page?: PackageActivationsPage;
  error?: string;
}

// The sponsor's own activations (GET /fanhub/sponsor-packages/activations), newest first, by status;
// an active one can be cancelled here.
export default function MySponsorships() {
  const [tab, setTab] = useState<Tab>("Active");
  const [page, setPage] = useState(1);
  // Bumped to load the list again (Retry, or after a cancel).
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded | null>(null);
  const [cancelling, setCancelling] = useState<PackageActivation | null>(null);

  const key = `${tab}|${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<PackageActivationsPage>("GET", routes.api.sponsorActivations, {
      params: { status: TAB_STATUS[tab], page, limit: PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setList({ key, page: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, tab, page]);

  const current = list?.key === key ? list : null;
  const items = current?.page?.items ?? [];
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + items.length - 1;

  // A cancelled one leaves the Active tab: step back when it was the last on its page.
  const afterCancel = () => {
    if (tab === "Active" && items.length === 1 && page > 1) setPage((p) => p - 1);
    else setReloads((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          MY SPONSORSHIPS
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Every package and physical asset you&apos;ve activated. Cancel an active one here.
        </p>
      </div>

      <section aria-label="Sponsorships" className="flex flex-col gap-4">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        {!current ? (
          <Loader />
        ) : current.error ? (
          <div className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
            <p className="text-sm text-[#f0c36a]">{`Couldn't load your sponsorships: ${current.error}`}</p>
            <Button
              label="Retry"
              onClick={() => setReloads((n) => n + 1)}
              className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
            />
          </div>
        ) : items.length === 0 ? (
          <div className={cn(CARD, "rounded-[8px] p-6 flex flex-col items-start gap-4")}>
            <p className="text-[15px] text-[#a8a8a8]">{EMPTY_TEXT[tab]}</p>
            {(tab === "Active" || tab === "All") && (
              <Link href={routes.ui.sponsor.findOrganizations} className={cn(PRIMARY_BUTTON, LINK_BUTTON)}>
                Find organizations
              </Link>
            )}
          </div>
        ) : (
          <>
            {items.map((a) => (
              <SponsorshipRow key={a.id} activation={a} onCancel={() => setCancelling(a)} />
            ))}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
              <span className="text-xs text-white/80">
                {`Showing ${from} to ${to} of ${current.page?.pagination.total ?? 0} sponsorships`}
              </span>
              <Pagination page={page} pageCount={current.page?.pagination.totalPages ?? 0} onChange={setPage} />
            </div>
          </>
        )}
      </section>

      <CancelModal target={cancelling} onClose={() => setCancelling(null)} onDone={afterCancel} />
    </div>
  );
}
