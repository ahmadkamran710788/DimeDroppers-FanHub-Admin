"use client";

import { useEffect, useState } from "react";
import { Dices, Heart, QrCode, Settings, Vote } from "lucide-react";
import type { Column } from "@/components/common/generic-table";
import GenericTable from "@/components/common/generic-table";
import Pagination from "@/components/common/pagination";
import StatCard, { type Stat } from "@/components/common/stat-card";
import ChallengeSettingsModal from "@/components/organization/engagement/challenge-settings-modal";
import { ENGAGEMENT_PAGE_SIZE } from "@/components/organization/engagement/settings-table";
import { useAllChallenges } from "@/components/organization/engagement/use-all-challenges";
import { cn } from "@/utils/cn";
import type { ChallengeCampaign, ChallengeStats } from "@/utils/types/engagement";

const CHIPS = ["All", "Active", "Ended"] as const;
type Chip = (typeof CHIPS)[number];

type Category = ChallengeCampaign["category"];

const ICON: Record<Category, typeof Heart> = { PREDICTION: Dices, DONATION: Heart, VOTING: Vote, SCAN_BOOTH: QrCode };

// "Goal: 3 correct predictions": what the target counts, by category (and "correct" for predictions that must
// come true).
const NOUN: Record<Category, [string, string]> = {
  PREDICTION: ["prediction", "predictions"],
  DONATION: ["donation", "donations"],
  VOTING: ["vote", "votes"],
  SCAN_BOOTH: ["booth scan", "booth scans"],
};
function goal(c: ChallengeCampaign) {
  const [one, many] = NOUN[c.category];
  const noun = c.targetCount === 1 ? one : many;
  const what = c.criteriaType === "COUNT_SUCCESSFUL" ? `correct ${noun}` : noun;
  const suffix =
    c.criteriaType === "COUNT_PER_DAY"
      ? " in one day"
      : c.criteriaType === "STREAK_DAYS"
        ? ", days in a row"
        : c.criteriaType === "COUNT_DISTINCT_TARGET"
          ? ", each to a different team"
          : "";
  return `Goal: ${c.targetCount} ${what}${suffix}`;
}

// Active while it's switched on and hasn't passed its end date; otherwise Ended.
const isActive = (c: ChallengeCampaign, now: number) =>
  c.status === "ACTIVE" && (!c.endDate || new Date(c.endDate).getTime() > now);

const count = (n: number) => n.toLocaleString("en-US");
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// The coin next to a Dime amount.
function DimeMark() {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full border-2 border-[#9D62C1] text-xs font-bold text-[#B18CFF]">
      D
    </span>
  );
}

function cards(stats: ChallengeStats | null, dimesPaid: number | null): Stat[] {
  const v = (n: number | null | undefined) => (n == null ? "—" : count(n));
  return [
    { label: "Active Challenges", value: v(stats?.active), tint: "#3B4C9B", caption: stats ? `of ${count(stats.available)} created` : "" },
    { label: "Fans Checked In", value: v(stats?.participants), tint: "#3E7B3B", caption: "Joined a challenge" },
    { label: "Completed", value: v(stats?.totalCompletions.value), tint: "#5B3A7E", caption: "Fans who finished one" },
    { label: "Dimes Paid Out", value: v(dimesPaid), tint: "#4A5263", caption: "Dimes × fans who completed" },
  ];
}

// Engagement → Challenges: four cards, then every challenge with All / Active / Ended chips, its check-ins,
// completions against its goal, the Dimes it pays and a gear for its settings.
export default function ChallengesTab() {
  const { stats, challenges, loading, reload } = useAllChallenges();
  const [chip, setChip] = useState<Chip>("All");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ChallengeCampaign | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Rechecked each minute, so a challenge moves to Ended when its end date passes.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const active = challenges.filter((c) => isActive(c, now));
  const byChip: Record<Chip, ChallengeCampaign[]> = {
    All: challenges,
    Active: active,
    Ended: challenges.filter((c) => !isActive(c, now)),
  };
  const shown = byChip[chip];
  const pageCount = Math.max(1, Math.ceil(shown.length / ENGAGEMENT_PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = shown.slice((current - 1) * ENGAGEMENT_PAGE_SIZE, current * ENGAGEMENT_PAGE_SIZE);
  // Hidden completion numbers count as none.
  const dimesPaid = loading ? null : challenges.reduce((sum, c) => sum + (c.completedCount ?? 0) * c.baseDimeReward, 0);

  const columns: Column<ChallengeCampaign>[] = [
    {
      header: "Challenge",
      cls: "flex-1 min-w-[280px] py-5 px-4",
      cell: (c) => {
        const Icon = ICON[c.category] ?? Dices;
        const meta = [c.sponsorName && `Presented by ${c.sponsorName}`, c.endDate && `Ends ${day(c.endDate)}`].filter(Boolean).join(" · ");
        return (
          <div className="flex items-start gap-4 min-w-0">
            <span className="size-14 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
              <Icon className="size-6 text-white" strokeWidth={1.5} />
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-base font-semibold leading-6 text-white">{c.title}</span>
              {c.description && <span className="text-sm leading-5 text-white/80 whitespace-normal">{c.description}</span>}
              {meta && <span className="text-sm text-white/50">{meta}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: "Fans Checked In",
      cls: "w-[150px] shrink-0 py-5 px-4 justify-end text-right",
      cell: (c) => (
        <div className="flex flex-col items-end gap-1">
          <span className="font-display text-[28px] font-extrabold leading-none text-white">{count(c.startedCount)}</span>
          <span className="text-sm text-white/60">fans checked in</span>
        </div>
      ),
    },
    {
      header: "Completed",
      cls: "w-[240px] shrink-0 py-5 px-4",
      cell: (c) => {
        const done = c.completedCount;
        const pct = done != null && c.startedCount > 0 ? Math.round((done / c.startedCount) * 100) : 0;
        return (
          <div className="flex w-full flex-col gap-2">
            <span className="text-sm leading-5 text-white/80 whitespace-normal">
              {done == null ? (
                "Hidden from fans"
              ) : (
                <>
                  <span className="font-semibold text-white">{count(done)}</span> of {count(c.startedCount)}
                  {c.startedCount === 0 ? " · no check-ins yet" : ` · ${pct}%`}
                </>
              )}
            </span>
            <span className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-sm text-white/60 whitespace-normal">{goal(c)}</span>
          </div>
        );
      },
    },
    {
      header: "Dimes Offered",
      cls: "w-[160px] shrink-0 py-5 px-4 justify-end text-right",
      cell: (c) => (
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-2 font-display text-[28px] font-extrabold leading-none text-white">
            {count(c.baseDimeReward)}
            <DimeMark />
          </span>
          <span className="text-sm leading-5 text-white/60 whitespace-normal">per fan who completes</span>
        </div>
      ),
    },
    {
      header: "Status",
      cls: "w-[120px] shrink-0 py-5 px-4 items-start",
      cell: (c) => (
        <span
          className={cn(
            "rounded-md px-2 py-1 text-sm font-semibold whitespace-nowrap",
            isActive(c, now) ? "bg-success/20 text-success" : "bg-white/10 text-white/70"
          )}
        >
          {isActive(c, now) ? "Active" : "Ended"}
        </span>
      ),
    },
    {
      header: "",
      cls: "w-[80px] shrink-0 py-5 px-4 items-start justify-end",
      cell: (c) => (
        <button
          type="button"
          aria-label={`Settings for ${c.title}`}
          onClick={() => setEditing(c)}
          className="cursor-pointer size-12 rounded-[8px] border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/10"
        >
          <Settings className="size-5 text-white" strokeWidth={1.5} />
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {cards(stats, dimesPaid).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">Challenges</h3>
          <div role="group" aria-label="Status" className="inline-flex gap-1 rounded-full border border-white/15 p-1">
            {CHIPS.map((c) => {
              const on = chip === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setChip(c);
                    setPage(1);
                  }}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-2 text-base transition-colors",
                    on ? "bg-white text-midnight-navy" : "text-white hover:bg-white/10"
                  )}
                >
                  {c} {!loading && <span className={on ? "text-midnight-navy/60" : "text-white/50"}>{byChip[c].length}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <GenericTable
          columns={columns}
          rows={visible}
          getKey={(c) => c.id}
          loading={loading}
          empty={chip === "All" ? "No challenges yet." : `No ${chip.toLowerCase()} challenges.`}
          className="rounded-[8px] border border-white/10"
        />

        {pageCount > 1 && <Pagination page={current} pageCount={pageCount} onChange={setPage} className="self-end" />}
      </div>

      {editing && <ChallengeSettingsModal challenge={editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}
