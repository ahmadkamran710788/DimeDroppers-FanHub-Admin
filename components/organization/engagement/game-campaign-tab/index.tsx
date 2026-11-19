"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Column } from "@/components/common/generic-table";
import GenericTable from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";
import StatCard, { type Stat } from "@/components/common/stat-card";
import { ENGAGEMENT_PAGE_SIZE } from "@/components/organization/engagement/settings-table";
import { useCampaignCounts } from "@/components/organization/engagement/use-campaign-counts";
import { useEngagementCampaigns } from "@/components/organization/engagement/use-engagement-campaigns";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";
import { FALLBACK_CREST } from "@/utils/constants/fallback-crest";
import type { CampaignMatch, GamePhase, PredictionCampaign, PredictionStats, VotingCampaign, VotingStats } from "@/utils/types/engagement";

export type GameTab = "predictions" | "voting";
type Row = PredictionCampaign | VotingCampaign;

// What differs between the two tabs: names, and where the entry counts live.
const COPY: Record<
  GameTab,
  { title: string; column: string; plural: string; entries: string; rowEntries: (r: Row) => number; total: (s: PredictionStats | VotingStats) => number }
> = {
  predictions: {
    title: "Predictions",
    column: "Prediction Campaign",
    plural: "predictions",
    entries: "Entries",
    rowEntries: (r) => (r as PredictionCampaign).entriesCount,
    total: (s) => (s as PredictionStats).totalEntries.value,
  },
  voting: {
    title: "Voting",
    column: "Voting Campaign",
    plural: "polls",
    entries: "Votes",
    rowEntries: (r) => (r as VotingCampaign).votesCount,
    total: (s) => (s as VotingStats).totalVotes.value,
  },
};

// The status chips and the API status each one asks for ("" = all). Active asks for OPEN (on and not yet
// locked, matching the Active card) where the API knows it, else ACTIVE.
const STATUS_CHIPS = [
  { label: "All", status: "", key: "all" },
  { label: "Active", status: "ACTIVE", key: "active" },
  { label: "Finalized", status: "RESOLVED", key: "finalized" },
] as const;
type StatusChip = (typeof STATUS_CHIPS)[number]["label"];

// The game phase chips ("" = all phases).
const PHASE_CHIPS: { label: string; phase: GamePhase | ""; dot: string }[] = [
  { label: "All phases", phase: "", dot: "bg-white/50" },
  { label: "Pre-game", phase: "PRE_GAME", dot: "bg-[#638BFE]" },
  { label: "Live game", phase: "LIVE", dot: "bg-[#FF6B6B]" },
  { label: "Post-game", phase: "POST_GAME", dot: "bg-[#B18CFF]" },
];

// The Game Phase badge.
const PHASE_BADGE: Record<GamePhase, { label: string; cls: string }> = {
  PRE_GAME: { label: "Pre-game", cls: "bg-[#638BFE]/20 text-[#8FB0FF]" },
  LIVE: { label: "Live game", cls: "bg-[#FF6B6B]/20 text-[#FF8A8A]" },
  POST_GAME: { label: "Post-game", cls: "bg-[#B18CFF]/20 text-[#C9AEFF]" },
};

// One side of a match: its logo, else the organisation's (like the other pages), else the neutral crest; and name.
function Side({ team, reverse }: { team: CampaignMatch["home"]; reverse?: boolean }) {
  const { savedSchool } = useSetup();
  const src = team.logoUrl || savedSchool?.logoUrl || FALLBACK_CREST;
  return (
    <span className={cn("flex min-w-0 items-center gap-2", reverse && "flex-row-reverse text-right")}>
      <Image
        src={src}
        alt=""
        width={28}
        height={28}
        unoptimized={src.startsWith("http")}
        className="size-7 shrink-0 rounded-full bg-white object-contain p-0.5"
      />
      <span className="text-sm font-semibold leading-5 text-white">{team.name}</span>
    </span>
  );
}

// "Nov 10, 11:00 AM · River City Fieldhouse · Court 2".
const matchLine = (m: CampaignMatch) =>
  [
    m.startsAt && new Date(m.startsAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    m.venue,
    m.court,
  ]
    .filter(Boolean)
    .join(" · ");

// A campaign is Active while it's switched on and its entries haven't locked; otherwise Ended.
const isActive = (r: Row, now: number) => r.status === "ACTIVE" && new Date(r.endsAt).getTime() > now;

const count = (n: number) => n.toLocaleString("en-US");
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const lockLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// "0d 0h 12m 01s" until the entries lock; null once they have.
function timeLeft(endsAt: string, now: number) {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const [d, h, m, sec] = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
  return { text: `${d}d ${h}h ${m}m ${String(sec).padStart(2, "0")}s`, soon: ms < 3600_000 };
}

// The five cards. Finalized comes from its own count; Live Game needs the API to say where a campaign
// was generated, so it shows "—" for now.
function cards(tab: GameTab, stats: PredictionStats | VotingStats | null, finalized: number | null | undefined): Stat[] {
  const { title, plural, entries, total } = COPY[tab];
  const v = (n: number | null | undefined) => (n == null ? "—" : count(n));
  return [
    { label: `Available ${title}`, value: v(stats?.available), tint: "#3E7B3B", caption: "All generated, not cancelled" },
    {
      label: "Active",
      value: v(stats?.active),
      tint: "#3B4C9B",
      caption:
        stats?.lockingIn24h != null ? `${count(stats.lockingIn24h)} lock in the next 24 hours` : `Open for ${entries.toLowerCase()} now`,
    },
    { label: "Finalized", value: v(finalized), tint: "#4A5263", caption: "Results sent to fans" },
    { label: `Total ${entries}`, value: v(stats && total(stats)), tint: "#5B3A7E", caption: `Across all ${plural}` },
    { label: "Live Game", value: v(stats?.liveGame), tint: "#8B1E1E", caption: "Generated during games" },
  ];
}

// Engagement → Predictions or Voting: five cards, then the campaigns with search, status and phase chips,
// the game, when each was generated and how long until it locks.
export default function GameCampaignTab({ tab }: { tab: GameTab }) {
  const copy = COPY[tab];
  const [chip, setChip] = useState<StatusChip>("All");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  const [phase, setPhase] = useState<GamePhase | "">("");
  // Newer APIs send the chips' counts with the list; they also know OPEN and the phase filter.
  const [newApi, setNewApi] = useState(false);
  const picked = STATUS_CHIPS.find((c) => c.label === chip)?.status ?? "";
  const status = picked === "ACTIVE" && newApi ? "OPEN" : picked;
  const { stats: rawStats, campaigns, total, loading } = useEngagementCampaigns(tab, page, {
    search,
    status,
    phase: newApi ? phase : "",
  });
  const stats = rawStats as PredictionStats | VotingStats | null;
  if (stats?.counts && !newApi) setNewApi(true);
  // Older APIs: read each chip's total with a small list call.
  const fallback = useCampaignCounts(tab, search, !!stats && !stats.counts);
  const counts = stats?.counts ?? fallback;

  // Waits for a pause in typing before asking the API.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  // The countdowns tick every second.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = campaigns as Row[];
  const pageCount = Math.max(1, Math.ceil(total / ENGAGEMENT_PAGE_SIZE));

  const columns: Column<Row>[] = [
    {
      header: copy.column,
      cls: "flex-1 min-w-[220px] py-5 px-4",
      cell: (r) => (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-base font-semibold leading-6 text-white">{r.title}</span>
          <span className="text-sm text-white/60">{r.sponsorName ? `Presented by ${r.sponsorName}` : "No sponsor"}</span>
        </div>
      ),
    },
    {
      header: "Associated Match",
      cls: "w-[340px] shrink-0 py-5 px-4",
      cell: (r) =>
        r.match ? (
          <div className="flex w-full flex-col gap-1.5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <Side team={r.match.home} />
              <span className="text-xs text-white/50">vs</span>
              <Side team={r.match.away} reverse />
            </div>
            {matchLine(r.match) && <span className="text-sm text-white/60">{matchLine(r.match)}</span>}
          </div>
        ) : (
          <span className="text-sm text-white/40">—</span>
        ),
    },
    {
      header: "Game Phase",
      cls: "w-[140px] shrink-0 py-5 px-4",
      cell: (r) =>
        r.phase ? (
          <span className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold whitespace-nowrap", PHASE_BADGE[r.phase].cls)}>
            <span className="size-1.5 rounded-full bg-current" />
            {PHASE_BADGE[r.phase].label}
          </span>
        ) : (
          <span className="text-sm text-white/40">—</span>
        ),
    },
    {
      header: "Generated",
      cls: "w-[150px] shrink-0 py-5 px-4",
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-base leading-6 text-white">{day(r.createdAt)}</span>
          <span className="text-sm text-white/60">
            {[time(r.createdAt), r.generatedBy && (r.generatedBy.kind === "AUTO" ? "Auto-generated" : ["Admin", r.generatedBy.name].filter(Boolean).join(" · "))]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      ),
    },
    {
      header: "Time Left",
      cls: "w-[180px] shrink-0 py-5 px-4",
      cell: (r) => {
        const left = timeLeft(r.endsAt, now);
        return (
          <div className="flex flex-col gap-0.5">
            <span className={cn("text-base font-semibold leading-6", !left ? "text-white/40" : left.soon ? "text-[#FF6B6B]" : "text-white")}>
              {left ? left.text : "Locked"}
            </span>
            <span className="text-sm text-white/60">{left ? `Locks ${lockLabel(r.endsAt)}` : lockLabel(r.endsAt)}</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      cls: "w-[120px] shrink-0 py-5 px-4",
      cell: (r) => (
        <span
          className={cn(
            "rounded-md px-2 py-1 text-sm font-semibold whitespace-nowrap",
            isActive(r, now) ? "bg-success/20 text-success" : "bg-white/10 text-white/70"
          )}
        >
          {isActive(r, now) ? "Active" : "Ended"}
        </span>
      ),
    },
    {
      header: copy.entries,
      cls: "w-[100px] shrink-0 py-5 px-4",
      cell: (r) => <span className="text-base text-white">{count(copy.rowEntries(r))}</span>,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-6">
        {cards(tab, stats, stats?.finalized ?? counts.finalized).map((stat) => (
          <StatCard key={stat.label} {...stat} twoLineTitle />
        ))}
      </div>

      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">{copy.title}</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaign or team"
              className="sm:w-[300px]"
            />
            {/* The list asks for sort=newest; the API has no other order yet. */}
            <span className="h-12 rounded-[8px] bg-white px-4 flex items-center text-base text-midnight-navy whitespace-nowrap">
              Newest generated
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div role="group" aria-label="Status" className="inline-flex gap-1 rounded-full border border-white/15 p-1">
            {STATUS_CHIPS.map((c) => {
              const n = counts[c.key];
              const on = chip === c.label;
              return (
                <button
                  key={c.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setChip(c.label);
                    setPage(1);
                  }}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-2 text-base transition-colors",
                    on ? "bg-white text-midnight-navy" : "text-white hover:bg-white/10"
                  )}
                >
                  {c.label} {n != null && <span className={on ? "text-midnight-navy/60" : "text-white/50"}>{n}</span>}
                </button>
              );
            })}
          </div>

          <div role="group" aria-label="Game phase" className="flex flex-wrap gap-2">
            {PHASE_CHIPS.map((c) => (
              <button
                key={c.label}
                type="button"
                aria-pressed={phase === c.phase}
                // Older APIs can't filter by phase.
                disabled={!newApi && c.phase !== ""}
                title={!newApi && c.phase !== "" ? "Coming soon" : undefined}
                onClick={() => {
                  setPhase(c.phase);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-base text-white transition-colors",
                  phase === c.phase ? "border-[#638BFE] bg-[#638BFE]/15" : "border-white/15",
                  !newApi && c.phase !== "" ? "cursor-not-allowed" : "cursor-pointer hover:bg-white/5"
                )}
              >
                <span className={cn("size-2 rounded-full", c.dot)} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <GenericTable
          columns={columns}
          rows={rows}
          getKey={(r) => r.id}
          loading={loading}
          empty={search || status || phase ? `No ${copy.plural} match these filters.` : `No ${copy.plural} yet.`}
          className="rounded-[8px] border border-white/10"
        />

        {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onChange={setPage} className="self-end" />}
      </div>
    </>
  );
}
