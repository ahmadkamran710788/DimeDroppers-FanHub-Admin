"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Filter, Plus } from "lucide-react";
import toast from "react-hot-toast";
import BadgeStatCard, { STAT_TINTS, type BadgeStat } from "@/components/common/BadgeStatCard";
import Button from "@/components/common/Button";
import GenericTable, { type Column } from "@/components/common/GenericTable";
import Pagination from "@/components/common/Pagination";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import SearchInput from "@/components/common/SearchInput";
import StatusPill from "@/components/common/StatusPill";
import CampaignCard from "@/components/buy-tickets/CampaignCard";
import CreateCampaignModal, { type CampaignTier } from "@/components/buy-tickets/CreateCampaignModal";
import { DEMO_CAMPAIGN, HOME_AWAY_COLOR, HOME_AWAY_LABEL } from "@/components/buy-tickets/data";
import { useSetup } from "@/context/setup";
import apiCall from "@/utils/api-call";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type { ScheduleItem, ScheduleListResponse } from "@/utils/types/schedule";

const PAGE_SIZE = 10;
// Upper bound on games pulled into one campaign view.
const FETCH_LIMIT = 100;

// Campaign create/edit and per-game ticket actions come later (no backend yet).
const comingSoon = () => toast("Coming soon.");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtTime = (iso: string, allDay: boolean) =>
  allDay ? "All Day" : new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default function BuyTicketsPage() {
  const { savedSchool } = useSetup();
  const [games, setGames] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  // Which campaign dialog is open (null = closed).
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  // Campaigns created this session (no campaigns endpoint yet, so they are not persisted).
  const [tiers, setTiers] = useState<CampaignTier[]>([]);
  // "Now" captured when the games load, so upcoming/ended stays stable across renders.
  const [now, setNow] = useState(0);

  const campaign = DEMO_CAMPAIGN;
  const ticketUrl = savedSchool?.gofanSchoolPage || null;

  useEffect(() => {
    let cancelled = false;
    apiCall<ScheduleListResponse>({
      endpoint: routes.api.proxyListSchedules,
      method: "GET",
      data: { page: 1, limit: FETCH_LIMIT, sortOrder: "asc" },
    }).then((result) => {
      if (cancelled) return;
      setNow(Date.now());
      if (result.success && result.data) {
        const payload = (result.data as unknown as ScheduleListResponse).data?.[0];
        setGames(payload?.items ?? []);
      } else {
        toast.error("Couldn't load your schedule.");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) =>
      [g.title, g.opponent, g.location, g.sports, g.level].some((v) => v?.toLowerCase().includes(q))
    );
  }, [games, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const upcoming = games.filter((g) => new Date(g.start).getTime() > now).length;
  const home = games.filter((g) => g.homeAway === "home").length;
  const stats: BadgeStat[] = [
    { label: "Scheduled Games", value: games.length, caption: "In this campaign", tint: STAT_TINTS.blue },
    { label: "Upcoming Games", value: upcoming, caption: "Tickets on sale", tint: STAT_TINTS.green },
    { label: "Home Games", value: home, caption: `${games.length - home} away / neutral`, tint: STAT_TINTS.purple },
    { label: "Ticket Link", value: ticketUrl ? "✓" : "—", caption: ticketUrl ? campaign.provider : "Not set", tint: STAT_TINTS.brown },
  ];

  const columns: Column<ScheduleItem>[] = [
    {
      header: "Game",
      cls: "flex-1 min-w-[220px] py-5",
      cell: (g) => (
        <div className="flex items-center gap-3 min-w-0">
          {g.opponentLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.opponentLogoUrl} alt="" className="size-10 shrink-0 rounded-full object-cover border border-white/30" />
          ) : (
            <span className="size-10 shrink-0 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              <CalendarDays className="size-5 text-white/60" strokeWidth={1.5} />
            </span>
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate">
              {g.opponent ? `vs ${g.opponent}` : g.title}
            </span>
            <span className="text-xs text-white/40 truncate">
              {[g.sports, g.level, g.gender].filter(Boolean).join(" · ") || g.title}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Date & Time",
      cls: "w-40 shrink-0 py-5",
      cell: (g) => (
        <div className="flex flex-col gap-1">
          <span>{fmtDate(g.start)}</span>
          <span className="text-white/60">{fmtTime(g.start, g.isAllDay)}</span>
        </div>
      ),
    },
    {
      header: "Home / Away",
      cls: "w-28 shrink-0 py-5",
      cell: (g) =>
        g.homeAway ? (
          <span className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", HOME_AWAY_COLOR[g.homeAway])} />
            {HOME_AWAY_LABEL[g.homeAway]}
          </span>
        ) : (
          "—"
        ),
    },
    { header: "Location", cls: "w-40 shrink-0 py-5", cell: (g) => <span className="leading-5">{g.location ?? "TBD"}</span> },
    {
      header: "Tickets",
      cls: "w-28 shrink-0 py-5",
      cell: (g) => {
        const past = new Date(g.start).getTime() <= now;
        if (g.status === "cancelled") return <StatusPill label="Cancelled" color="bg-error" />;
        if (past) return <StatusPill label="Ended" color="bg-white/30" />;
        return ticketUrl ? <StatusPill label="On Sale" color="bg-success" /> : <StatusPill label="No Link" color="bg-white/30" />;
      },
    },
    {
      header: "Actions",
      cls: "w-20 shrink-0 py-5 justify-end",
      cell: (g) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${g.opponent ?? g.title}`}
          className="bg-white/25 hover:bg-white/35"
          items={[
            {
              label: "Open Ticket Page",
              onSelect: () => (ticketUrl ? window.open(ticketUrl, "_blank", "noopener,noreferrer") : toast.error("Add your GoFan link in External Links first.")),
            },
            { label: "Remove from Campaign", onSelect: comingSoon, variant: "destructive" },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Created campaigns are appended to the Campaign section below. */}
      {/* Mounted per open (keyed) so edit mode always starts from the current campaigns. */}
      {modalMode && (
        <CreateCampaignModal
          key={modalMode}
          isOpen
          mode={modalMode}
          initialTiers={tiers}
          onClose={() => setModalMode(null)}
          onSave={(saved) => setTiers((prev) => (modalMode === "edit" ? saved : [...prev, ...saved]))}
        />
      )}

      {/* Title + create */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
            Buy Tickets
          </h2>
          <p className="text-base text-white/80">Manage your ticket campaign and the scheduled games fans can buy tickets for.</p>
        </div>
        <Button variant="cta" label="Create Campaign" icon={<Plus className="size-5" />} onClick={() => setModalMode("create")} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <BadgeStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Campaign */}
      <CampaignCard campaign={campaign} ticketUrl={ticketUrl} tiers={tiers} onEdit={() => setModalMode(tiers.length ? "edit" : "create")} />

      {/* Campaign schedules */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <div className="flex items-center gap-4">
          <SearchInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search games"
          />
          <Button
            variant="ghost"
            label="Filters"
            icon={<Filter className="w-5 h-5" />}
            className="shrink-0 min-w-0 px-4"
            onClick={comingSoon}
          />
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="self-start flex items-center gap-2 font-display font-black text-[28px] uppercase text-white leading-none"
        >
          Schedules ({filtered.length})
          <ChevronDown className={cn("w-6 h-6 transition-transform", collapsed && "-rotate-90")} />
        </button>

        {!collapsed && (
          <div className="flex flex-col">
            <GenericTable
              columns={columns}
              rows={rows}
              getKey={(g) => g.id}
              loading={loading}
              empty={query ? "No games match your search." : "No games on your schedule yet."}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
              <span className="text-xs text-white/80">
                Showing {from} to {to} of {filtered.length} games
              </span>
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
