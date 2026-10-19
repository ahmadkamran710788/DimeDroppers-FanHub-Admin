"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import toast from "react-hot-toast";
import BadgeStatCard, { STAT_TINTS, type BadgeStat } from "@/components/common/badge-stat-card";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import FilterChips, { type FilterChipOption } from "@/components/common/filter-chips";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import Select from "@/components/common/select";
import StatusPill from "@/components/common/status-pill";
import Tabs from "@/components/common/tabs";
import CampaignCard from "@/components/buy-tickets/campaign-card";
import CreateCampaignModal from "@/components/buy-tickets/create-campaign-modal";
import { HOME_AWAY_COLOR, HOME_AWAY_LABEL } from "@/components/buy-tickets/data";
import GameAttendance from "@/components/buy-tickets/game-attendance";
import OrdersTab from "@/components/buy-tickets/orders-tab";
import { useTicketGames, type GameTicketFilter } from "@/components/buy-tickets/use-ticket-games";
import { useTicketCampaigns } from "@/components/buy-tickets/use-ticket-campaigns";
import { useTicketOverview } from "@/components/buy-tickets/use-ticket-overview";
import { useOrgTeams } from "@/components/teams/use-org-teams";
import apiCall from "@/utils/api-call";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type { GameTicketStatus, TicketCampaign, TicketScheduleGame } from "@/utils/types/tickets";

const TABS = ["Schedules", "Orders"] as const;
type Tab = (typeof TABS)[number];

const PAGE_SIZE = 10;
// Wait this long after the last keystroke before searching the API.
const SEARCH_DELAY_MS = 300;

const FILTERS: FilterChipOption<GameTicketFilter>[] = [
  { value: "all", label: "All" },
  { value: "on-sale", label: "On Sale" },
  { value: "not-on-sale", label: "Not On Sale" },
  { value: "ended", label: "Ended" },
];

const TICKET_STATUS: Record<GameTicketStatus, { label: string; color: string }> = {
  ON_SALE: { label: "On Sale", color: "bg-success" },
  NOT_ON_SALE: { label: "Not On Sale", color: "bg-white/30" },
  ENDED: { label: "Ended", color: "bg-white/30" },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

type Detach = { game: TicketScheduleGame; campaign: NonNullable<TicketScheduleGame["campaign"]> };

type HomeAway = "" | "home" | "away" | "neutral";

const HOME_AWAY_OPTIONS = [
  { label: "All", value: "" },
  { label: "Home", value: "home" },
  { label: "Away", value: "away" },
  { label: "Neutral", value: "neutral" },
];

const FILTER_LABEL = "text-xs font-medium text-white/60";

// "All" plus each distinct value, sorted.
const optionsOf = (values: string[]) => [
  { label: "All", value: "" },
  ...[...new Set(values.filter((v) => v && v !== "—"))].sort().map((v) => ({ label: v, value: v })),
];

// Buy Tickets: the four cards, every ticket campaign and the games fans can buy tickets for, all
// from /fanhub/org/tickets.
export default function BuyTicketsPage() {
  // The four cards come from the overview; the campaigns from their own list endpoint.
  const { overview, reload: reloadOverview } = useTicketOverview();
  const { campaigns, loading: campaignsLoading, reload: reloadCampaigns } = useTicketCampaigns();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GameTicketFilter>("all");
  const [page, setPage] = useState(1);
  const [homeAway, setHomeAway] = useState<HomeAway>("");
  const [sports, setSports] = useState("");
  const [level, setLevel] = useState("");
  const [tab, setTab] = useState<Tab>("Schedules");
  // The game whose tickets-sold breakdown is open under its row.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { games, total, loading: gamesLoading, reload: reloadGames } = useTicketGames({
    page,
    limit: PAGE_SIZE,
    search,
    status,
    homeAway,
    sports,
    level,
  });
  // The sports and levels to filter by are the org's teams'.
  const { teams } = useOrgTeams();
  const sportOptions = useMemo(() => optionsOf(teams.map((t) => t.sport)), [teams]);
  const levelOptions = useMemo(() => optionsOf(teams.map((t) => t.level)), [teams]);
  const filtered = !!search || status !== "all" || !!homeAway || !!sports || !!level;
  // Which campaign dialog is open (null = closed).
  // The campaign dialog: null = create, a campaign = edit it, undefined = closed.
  const [editing, setEditing] = useState<TicketCampaign | null | undefined>(undefined);
  const [detach, setDetach] = useState<Detach | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ticketLink = overview?.cards.ticketLink ?? null;

  const reloadAll = () => {
    reloadOverview();
    reloadCampaigns();
    reloadGames();
  };

  const onSearch = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
  };

  // apiCall shows the refusal itself, e.g. "Tickets have already been sold for this game".
  const runDetach = async ({ game, campaign }: Detach) => {
    const { success } = await apiCall({
      endpoint: routes.api.ticketCampaignGame(campaign.id, game.id),
      method: "DELETE",
      invalidates: ["fanhub/org/tickets"],
      showSuccessToast: true,
      successMessage: `${campaign.title} removed from this game`,
    });
    if (success) reloadAll();
    return success;
  };

  const cards = overview?.cards;
  const stats: BadgeStat[] = [
    {
      label: "Scheduled Games",
      value: cards ? cards.scheduledGames : "—",
      caption: "With ticket campaigns",
      tint: STAT_TINTS.blue,
    },
    { label: "Upcoming Games", value: cards ? cards.upcomingGames : "—", caption: "Tickets on sale", tint: STAT_TINTS.green },
    {
      label: "Home Games",
      value: cards ? cards.homeGames.value : "—",
      caption: cards ? `${cards.homeGames.awayOrNeutral} away / neutral` : "",
      tint: STAT_TINTS.purple,
    },
    { label: "Ticket Link", value: ticketLink ? "✓" : "—", caption: ticketLink ? "GoFan" : "Not set", tint: STAT_TINTS.brown },
  ];

  const actionsFor = (g: TicketScheduleGame): RowAction[] => [
    {
      label: "Open Ticket Page",
      onSelect: () =>
        ticketLink ? window.open(ticketLink, "_blank", "noopener,noreferrer") : toast.error("Add your GoFan link in External Links first."),
    },
    // A game sells through one campaign at a time.
    ...(g.campaign
      ? [
          {
            label: `Remove from ${g.campaign.title}`,
            variant: "destructive" as const,
            onSelect: () => setDetach({ game: g, campaign: g.campaign! }),
          },
        ]
      : []),
  ];

  const columns: Column<TicketScheduleGame>[] = [
    {
      header: "",
      cls: "w-8 shrink-0 py-5",
      cell: (g) => (
        <span title={expandedId === g.id ? "Hide tickets sold" : "Show tickets sold"} className="flex">
          <ChevronDown
            aria-hidden
            className={cn("size-5 text-white/60 transition-transform", expandedId === g.id && "rotate-180")}
          />
        </span>
      ),
    },
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
            <span className="text-sm font-semibold text-white truncate">{g.opponent ? `vs ${g.opponent}` : g.title}</span>
            <span className="text-xs text-white/40 truncate">{[g.sports, g.level, g.gender].filter(Boolean).join(" · ") || g.title}</span>
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
          <span className="text-white/60">{fmtTime(g.start)}</span>
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
      cls: "w-36 shrink-0 py-5",
      cell: (g) => {
        const s = g.status === "cancelled" ? { label: "Cancelled", color: "bg-error" } : TICKET_STATUS[g.ticketStatus];
        const sold = g.ticketTypes.reduce((sum, t) => sum + t.sold, 0);
        const left = g.ticketTypes.reduce((sum, t) => sum + t.available, 0);
        return (
          <div className="flex flex-col gap-1.5">
            <StatusPill label={s.label} color={s.color} className="self-start whitespace-nowrap" />
            {g.campaign && <span className="text-xs text-white/60 truncate">{g.campaign.title}</span>}
            {g.ticketTypes.length > 0 && <span className="text-xs text-white/60">{`${sold} sold · ${left} left`}</span>}
          </div>
        );
      },
    },
    {
      header: "Actions",
      cls: "w-20 shrink-0 py-5 justify-end",
      cell: (g) => (
        // Opening the menu (or picking from it) mustn't also open or close the row.
        <div onClick={(e) => e.stopPropagation()}>
          <RowActionsMenu ariaLabel={`Actions for ${g.opponent ?? g.title}`} className="bg-white/25 hover:bg-white/35" items={actionsFor(g)} />
        </div>
      ),
    },
  ];

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-10">
      {/* Mounted per open (keyed) so the form starts from the campaign being edited. */}
      {editing !== undefined && (
        <CreateCampaignModal key={editing?.id ?? "new"} campaign={editing} onClose={() => setEditing(undefined)} onSaved={reloadAll} />
      )}

      <ConfirmModal
        isOpen={!!detach}
        onClose={() => setDetach(null)}
        title="Remove From Game"
        message={
          detach
            ? `Fans will no longer be able to buy "${detach.campaign.title}" for ${detach.game.opponent ? `vs ${detach.game.opponent}` : detach.game.title}. This isn't possible once tickets have been sold for the game.`
            : ""
        }
        confirmLabel="Remove"
        busyLabel="Removing…"
        destructive
        onConfirm={() => (detach ? runDetach(detach) : Promise.resolve(false))}
      />

      {/* Title + create */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
            Buy Tickets
          </h2>
          <p className="text-base text-white/80">Manage your ticket campaigns and the scheduled games fans can buy tickets for.</p>
        </div>
        <Button variant="cta" label="Create Campaign" icon={<Plus className="size-5" />} onClick={() => setEditing(null)} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <BadgeStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Ticket campaigns */}
      <CampaignCard campaigns={campaigns} loading={campaignsLoading} ticketLink={ticketLink} onEdit={setEditing} />

      {/* Schedules | Orders */}
      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
        <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ Schedules: total }} />

        {tab === "Orders" ? (
          <OrdersTab campaigns={campaigns} />
        ) : (
          <>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <SearchInput value={query} onChange={(e) => onSearch(e.target.value)} aria-label="Search games" className="lg:max-w-sm" />
            <FilterChips
              options={FILTERS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:max-w-3xl">
            <Select
              label="Home / Away"
              name="homeAway"
              variant="dark"
              value={homeAway}
              options={HOME_AWAY_OPTIONS}
              onChange={(e) => {
                setHomeAway(e.target.value as HomeAway);
                setPage(1);
              }}
              labelClassName={FILTER_LABEL}
            />
            <Select
              label="Sport"
              name="sports"
              variant="dark"
              value={sports}
              options={sportOptions}
              onChange={(e) => {
                setSports(e.target.value);
                setPage(1);
              }}
              labelClassName={FILTER_LABEL}
            />
            <Select
              label="Level"
              name="level"
              variant="dark"
              value={level}
              options={levelOptions}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
              labelClassName={FILTER_LABEL}
            />
          </div>

          <p className="text-xs text-white/60">Click a game to see the tickets sold for it.</p>
          <div className="flex flex-col">
            <GenericTable
              columns={columns}
              rows={games}
              getKey={(g) => g.id}
              loading={gamesLoading}
              empty={filtered ? "No games match your filters." : "No games on your schedule yet."}
              onRowClick={(g) => setExpandedId((id) => (id === g.id ? null : g.id))}
              renderExpanded={(g) =>
                expandedId === g.id ? (
                  <div className="p-4 sm:pl-14 bg-black/30 border-b border-white/20">
                    <GameAttendance gameId={g.id} />
                  </div>
                ) : null
              }
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
              <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${total} games`}</span>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
