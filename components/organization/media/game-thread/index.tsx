"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Clock3, Trophy, Zap } from "lucide-react";
import Loader from "@/components/common/loader";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SegmentedControl from "@/components/common/segmented-control";
import type { GamePhase, MediaGame, PlayEvent, Quarter } from "@/components/organization/media/data";
import { useGameDetail } from "@/components/organization/media/use-game-detail";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import type { GameThreadDetail, ThreadItem, ThreadPhase } from "@/utils/types/game-detail";

const PHASES: readonly GamePhase[] = ["Pre-Game", "Live Game", "Final"];
const QUARTERS: readonly Quarter[] = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

const MENU_TRIGGER =
  "size-auto h-[52px] px-4 gap-2 rounded-full outline-0 border border-white/10 bg-white/[0.06] text-base text-white whitespace-nowrap";

// A play: time | team logo | what happened, and the score after it.
function EventRow({ event }: { event: PlayEvent }) {
  return (
    <li className="grid grid-cols-[76px_1px_44px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl bg-white/6 px-5 py-4">
      <span className="text-[15px] text-white whitespace-nowrap">{event.time}</span>
      <span className="self-stretch bg-white/15" />
      {event.teamLogo ? (
        <Image src={event.teamLogo} alt="" unoptimized={event.teamLogo.startsWith("http")} width={44} height={44} className="size-11 rounded-full object-cover" />
      ) : (
        <span className="size-11 rounded-full bg-white/10 flex items-center justify-center">
          <Clock3 className="size-6 text-white" strokeWidth={1.5} />
        </span>
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm text-white/60">{event.type}</span>
        <span className="text-base leading-6 text-white">{event.text}</span>
      </div>
      {event.score && <span className="pl-4 text-lg font-semibold text-white whitespace-nowrap">{event.score}</span>}
    </li>
  );
}

// The thread's tabs, as the app names them, and the API phase each shows.
const THREAD_TABS = ["Pre-Game", "Live-Game", "Post-Game"] as const;
type ThreadTab = (typeof THREAD_TABS)[number];
const TAB_PHASE: Record<ThreadTab, ThreadPhase> = { "Pre-Game": "pre", "Live-Game": "live", "Post-Game": "final" };
const PHASE_TAB: Record<ThreadPhase, ThreadTab> = { pre: "Pre-Game", live: "Live-Game", final: "Post-Game" };
const EMPTY_TEXT: Record<ThreadPhase, string> = {
  pre: "No pre-game posts yet. They will appear here before the game starts.",
  live: "No live updates yet. They will appear here once the game starts.",
  final: "No post-game recap yet. It will appear here once the game ends.",
};

const FALLBACK_LOGO = "/images/preview-crest.png";
const THREAD_LIMIT = 200;
// The thread's sponsor until the API sends one.
const DEFAULT_SPONSOR = "Subway";

// Small label above a play, e.g. "2PT Made".
const TYPE_LABELS: Record<string, string> = {
  twoPointMade: "2PT Made",
  threePointMade: "3PT Made",
  freeThrowMade: "FT Made",
  timeout: "Timeout",
};
// Items fans answer (a card with their choices), not timeline rows.
const ENGAGEMENT_KINDS: readonly ThreadItem["kind"][] = ["prediction", "poll", "sponsorOffer", "challenge", "donation"];

// The Engagement menu's choices (the API's `engagement` param); "" = all.
const ENGAGEMENT_OPTIONS = [
  { value: "", label: "All Engagement" },
  { value: "highlight", label: "Highlights" },
  { value: "prediction", label: "Predictions" },
  { value: "poll", label: "Polls" },
  { value: "sponsorOffer", label: "Sponsor Offers" },
  { value: "challenge", label: "Challenges" },
  { value: "donation", label: "Donations" },
  { value: "none", label: "No Engagement" },
];

// "1-st Quarter" → "1st Quarter".
const cleanLabel = (label: string) => label.replace(/(\d)-(st|nd|rd|th)\b/gi, "$1$2");

// "Oct 29 at 6:00 PM".
const atLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

interface ChoiceOption {
  id: string;
  label: string;
  sub?: string;
}

// A prediction's or poll's choices (FanHubVotingCampaign.options): a team ("HOME" / "AWAY", with its
// team name) or a player (with jersey number and position).
const optionsOf = (data: ThreadItem["data"]): ChoiceOption[] => {
  if (!Array.isArray(data.options)) return [];
  return data.options
    .map((o) => {
      const r = (o ?? {}) as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
      const label = str(r.label) ?? str(r.name) ?? "";
      const player = [str(r.number) && `#${str(r.number)}`, str(r.position)].filter(Boolean).join(" • ");
      return { id: String(r.id ?? label), label, sub: player || str(r.teamName) || str(r.schoolName) };
    })
    .filter((o) => o.label);
};

function SponsorBanner({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[10px] bg-white px-5 py-3">
      <span className="text-base text-black">Presented by</span>
      <span className="font-display text-[28px] font-extrabold uppercase italic leading-none tracking-tight">
        {name.toLowerCase() === "subway" ? (
          <>
            <span className="text-[#FFC20D]">Sub</span>
            <span className="text-[#008C15]">way</span>
          </>
        ) : (
          <span className="text-black">{name}</span>
        )}
      </span>
    </div>
  );
}

// A phase change, or anything else that isn't a play: clock, "Phase" and when, then the text.
function PhaseCard({ item }: { item: ThreadItem }) {
  return (
    <li className="flex gap-4 rounded-2xl bg-white/6 p-5">
      <span className="size-14 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
        <Clock3 className="size-7 text-white" strokeWidth={1.5} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm text-white/60">
          <span>{item.kind === "phase" ? "Phase" : item.kind.charAt(0).toUpperCase() + item.kind.slice(1)}</span>
          <span>{atLabel(item.at)}</span>
        </div>
        <p className="text-lg leading-7 text-white">{item.title}</p>
        {item.body && <p className="text-sm text-white/70">{item.body}</p>}
      </div>
    </li>
  );
}

const playOf = (item: ThreadItem, detail: GameThreadDetail): PlayEvent => {
  const side = item.data.teamSide === "HOME" ? detail.Home : item.data.teamSide === "AWAY" ? detail.Away : null;
  return {
    id: item.id,
    time: new Date(item.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    type: TYPE_LABELS[item.subKind] ?? "Play",
    text: item.body ? `${item.title} ${item.body}` : item.title,
    teamLogo: side ? side.Logo || FALLBACK_LOGO : undefined,
    score: item.data.score ?? undefined,
  };
};

// A prediction, poll, offer, …: read-only here (fans answer it in the app). Once it is resolved, the
// winning choice is outlined in green with a trophy and the others are dimmed.
function EngagementCard({ item }: { item: ThreadItem }) {
  const options = optionsOf(item.data);
  const winners = Array.isArray(item.data.winningOptionIds) ? (item.data.winningOptionIds as string[]) : [];
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/3 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xl font-medium text-white">{item.title}</p>
        {item.body && <p className="text-sm text-white/70">{item.body}</p>}
      </div>
      {options.length > 0 && (
        <ul className="flex flex-col gap-2">
          {options.map((o) => {
            const won = winners.includes(o.id);
            return (
              <li
                key={o.id}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] border bg-white/8 px-5 py-3",
                  won ? "border-success" : "border-transparent",
                  winners.length > 0 && !won && "opacity-60"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-lg text-white">{o.label}</span>
                  {o.sub && <span className="text-sm text-white/60">{o.sub}</span>}
                </div>
                {won && <Trophy className="size-5 shrink-0 text-success" strokeWidth={2} aria-label="Winner" />}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function ThreadItemView({ item, detail }: { item: ThreadItem; detail: GameThreadDetail }) {
  if (ENGAGEMENT_KINDS.includes(item.kind) && item.subKind !== "resolved") return <EngagementCard item={item} />;
  if (item.kind === "play") return <EventRow event={playOf(item, detail)} />;
  return <PhaseCard item={item} />;
}

// A game's thread from GET /game-detail/games/{id}/thread: the whole thread comes in one list and the
// Pre-Game / Live-Game / Post-Game tabs show one phase of it (opening on the game's current one).
// The live phase is under its quarters' headers and can be narrowed to one; Engagement narrows the
// kinds of fan items.
function ApiThread({ gameId }: { gameId: string }) {
  // null: the game's current phase.
  const [tab, setTab] = useState<ThreadTab | null>(null);
  const [period, setPeriod] = useState("");
  const [engagement, setEngagement] = useState("");
  const { data, error, loading } = useGameDetail<GameThreadDetail>(routes.api.gameDetailThread(gameId), {
    ...(period && { period }),
    ...(engagement && { engagement }),
    page: 1,
    limit: THREAD_LIMIT,
  });

  const activeTab = tab ?? (data ? PHASE_TAB[data.currentPhase] : "Pre-Game");
  const phase = TAB_PHASE[activeTab];
  const items = (data?.items ?? []).filter((i) => i.phase === phase);

  const periodOptions = [
    { value: "", label: "All Quarters" },
    ...(data?.boundaries.periods ?? []).map((p) => ({ value: String(p.period), label: cleanLabel(p.label) })),
    { value: "halftime", label: "Halftime" },
  ];
  const periodLabel = periodOptions.find((p) => p.value === period)?.label;
  const engagementLabel = ENGAGEMENT_OPTIONS.find((o) => o.value === engagement)?.label;

  // Live items in feed order, cut where the quarter changes.
  const groups: { key: string; label: string; items: ThreadItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.key === item.periodKey) last.items.push(item);
    else {
      const label = data?.sections.find((s) => s.key === item.periodKey)?.label ?? item.periodLabel;
      groups.push({ key: item.periodKey, label: cleanLabel(label), items: [item] });
    }
  }

  const filtered = !!(period || engagement);

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        options={THREAD_TABS}
        active={activeTab}
        onChange={(t) => {
          setTab(t);
          setPeriod("");
        }}
        ariaLabel="Game phase"
        variant="light"
        fullWidth
      />

      {(items.length > 0 || filtered) && (
        <div className="flex flex-wrap gap-3">
          {phase === "live" && (
            <RowActionsMenu
              ariaLabel="Choose quarter"
              className={MENU_TRIGGER}
              trigger={
                <>
                  <Clock3 className="size-5" strokeWidth={1.5} />
                  {period ? periodLabel : "Quarters"}
                  <ChevronDown className="size-5" strokeWidth={2} />
                </>
              }
              items={periodOptions.map((p) => ({ label: p.label, onSelect: () => setPeriod(p.value) }))}
            />
          )}
          <RowActionsMenu
            ariaLabel="Choose engagement"
            className={MENU_TRIGGER}
            trigger={
              <>
                <Zap className="size-5" strokeWidth={1.5} />
                {engagement ? engagementLabel : "Engagement"}
                <ChevronDown className="size-5" strokeWidth={2} />
              </>
            }
            items={ENGAGEMENT_OPTIONS.map((o) => ({ label: o.label, onSelect: () => setEngagement(o.value) }))}
          />
        </div>
      )}

      <SponsorBanner name={data?.presentedBy?.name || DEFAULT_SPONSOR} />

      {loading ? (
        <Loader className="m-10" />
      ) : data && items.length > 0 ? (
        phase === "live" ? (
          groups.map((g, i) => (
            <section key={`${g.key}-${i}`} className="flex flex-col gap-4">
              <h3 className="font-display font-extrabold text-[32px] uppercase leading-none text-white">{g.label}</h3>
              <ul className="flex flex-col gap-3">
                {g.items.map((item) => (
                  <ThreadItemView key={item.id} item={item} detail={data} />
                ))}
              </ul>
            </section>
          ))
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <ThreadItemView key={item.id} item={item} detail={data} />
            ))}
          </ul>
        )
      ) : (
        <p className="py-10 text-center text-base text-white/50">
          {error ?? (filtered ? "Nothing in this part of the thread matches these filters." : EMPTY_TEXT[phase])}
        </p>
      )}
    </div>
  );
}

// "Game Thread" tab: the game's thread (sample games: play-by-play one quarter at a time).
export default function GameThread({ game }: { game: MediaGame }) {
  if (game.fromApi) return <ApiThread key={game.id} gameId={game.id} />;
  return <SampleThread game={game} />;
}

function SampleThread({ game }: { game: MediaGame }) {
  const [phase, setPhase] = useState<GamePhase>("Live Game");
  const [quarter, setQuarter] = useState<Quarter>("1st Quarter");
  const events = game.thread[phase]?.[quarter] ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <SegmentedControl
          options={PHASES}
          active={phase}
          onChange={setPhase}
          ariaLabel="Game phase"
          variant="light"
          fullWidth
        />
        <RowActionsMenu
          ariaLabel="Choose quarter"
          className="size-auto h-[52px] px-4 gap-2 rounded-[10px] outline-0 border border-white/10 bg-white/[0.06] text-base text-white whitespace-nowrap"
          trigger={
            <>
              <Clock3 className="size-6" strokeWidth={1.5} />
              Quarters
              <ChevronDown className="size-5" strokeWidth={2} />
            </>
          }
          items={QUARTERS.map((q) => ({ label: q, onSelect: () => setQuarter(q) }))}
        />
      </div>

      <h3 className="font-display font-extrabold text-[32px] uppercase leading-none text-white">
        {quarter}
      </h3>

      {events.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-white/50">No plays posted for this part of the game yet.</p>
      )}
    </div>
  );
}
