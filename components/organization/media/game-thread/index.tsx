"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Clock3, Zap } from "lucide-react";
import Loader from "@/components/common/loader";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SegmentedControl from "@/components/common/segmented-control";
import type { GamePhase, MediaGame, PlayEvent, Quarter } from "@/components/organization/media/data";
import { useGameDetail } from "@/components/organization/media/use-game-detail";
import { routes } from "@/utils/routes";
import type { GameThreadDetail, ThreadItem } from "@/utils/types/game-detail";

const PHASES: readonly GamePhase[] = ["Pre-Game", "Live Game", "Final"];
const QUARTERS: readonly Quarter[] = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

const MENU_TRIGGER =
  "size-auto h-[52px] px-4 gap-2 rounded-full outline-0 border border-white/10 bg-white/[0.06] text-base text-white whitespace-nowrap";

function EventRow({ event }: { event: PlayEvent }) {
  return (
    <li className="grid grid-cols-[76px_1px_44px_minmax(0,1fr)_auto] items-center gap-4 rounded-[10px] bg-white/[0.06] px-5 py-4">
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

const FALLBACK_LOGO = "/images/preview-crest.png";
const THREAD_LIMIT = 200;
// The thread's sponsor until the API sends one.
const DEFAULT_SPONSOR = "Subway";

// Small label above a thread item, e.g. "2PT Made", "Prediction".
const TYPE_LABELS: Record<string, string> = {
  twoPointMade: "2PT Made",
  threePointMade: "3PT Made",
  timeout: "Timeout",
  tipoff: "Phase",
  periodStart: "Phase",
  periodEnd: "Phase",
  halftime: "Phase",
  final: "Phase",
};
const KIND_LABELS: Record<ThreadItem["kind"], string> = {
  phase: "Phase",
  play: "Play",
  highlight: "Highlight",
  prediction: "Prediction",
  poll: "Poll",
  sponsorOffer: "Sponsor Offer",
  challenge: "Challenge",
  donation: "Donation",
};
// Items fans answer (shown as a card with their choices), not timeline rows.
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

// An engagement item's choices; the API's shape isn't fixed, so strings and { label | name | text } both work.
const optionsOf = (data: ThreadItem["data"]) => {
  const raw = data.options;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((o) => {
      if (typeof o === "string") return { label: o, sub: undefined };
      const r = (o ?? {}) as Record<string, unknown>;
      const label = String(r.label ?? r.name ?? r.text ?? r.title ?? "");
      const sub = r.subtitle ?? r.description ?? r.subLabel;
      return { label, sub: typeof sub === "string" ? sub : undefined };
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

function TimelineCard({ item, detail }: { item: ThreadItem; detail: GameThreadDetail }) {
  const side = item.data.teamSide === "HOME" ? detail.Home : item.data.teamSide === "AWAY" ? detail.Away : null;
  const logo = side ? side.Logo || FALLBACK_LOGO : null;
  return (
    <li className="flex gap-4 rounded-2xl bg-white/6 p-5">
      {logo ? (
        <Image src={logo} alt="" unoptimized={logo.startsWith("http")} width={56} height={56} className="size-14 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="size-14 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
          <Clock3 className="size-7 text-white" strokeWidth={1.5} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm text-white/60">
          <span>{TYPE_LABELS[item.subKind] ?? KIND_LABELS[item.kind] ?? item.kind}</span>
          <span>{atLabel(item.at)}</span>
        </div>
        <p className="text-lg leading-7 text-white">{item.title}</p>
        {item.body && <p className="text-sm text-white/70">{item.body}</p>}
      </div>
      {item.data.score && <span className="self-center pl-2 text-lg font-semibold text-white whitespace-nowrap">{item.data.score}</span>}
    </li>
  );
}

// A prediction, poll, offer, …: read-only here (fans answer it in the app).
function EngagementCard({ item }: { item: ThreadItem }) {
  const options = optionsOf(item.data);
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/3 p-5">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-medium text-white">{item.title}</p>
        {item.body && <p className="text-sm text-white/70">{item.body}</p>}
      </div>
      {options.length > 0 && (
        <ul className="flex flex-col gap-2">
          {options.map((o, i) => (
            <li key={`${o.label}-${i}`} className="flex flex-col rounded-[10px] bg-white/8 px-5 py-3">
              <span className="text-base text-white">{o.label}</span>
              {o.sub && <span className="text-sm text-white/60">{o.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// A game's whole thread (pre-game, live, post-game) in one list from GET /game-detail/games/{id}/thread,
// under its sections' headers. Quarters narrows it to one section, Engagement to kinds of fan items.
function ApiThread({ gameId }: { gameId: string }) {
  const [period, setPeriod] = useState("");
  const [engagement, setEngagement] = useState("");
  const { data, error, loading } = useGameDetail<GameThreadDetail>(routes.api.gameDetailThread(gameId), {
    ...(period && { period }),
    ...(engagement && { engagement }),
    page: 1,
    limit: THREAD_LIMIT,
  });

  const periodOptions = [
    { value: "", label: "All Quarters" },
    { value: "pregame", label: "Pre-Game" },
    ...(data?.boundaries.periods ?? []).map((p) => ({ value: String(p.period), label: cleanLabel(p.label) })),
    { value: "halftime", label: "Halftime" },
    { value: "final", label: "Final" },
  ];
  const periodLabel = periodOptions.find((p) => p.value === period)?.label ?? "Quarters";
  const engagementLabel = ENGAGEMENT_OPTIONS.find((o) => o.value === engagement)?.label ?? "Engagement";

  // The items in feed order, cut where the section changes.
  const groups: { key: string; label: string; items: ThreadItem[] }[] = [];
  for (const item of data?.items ?? []) {
    const last = groups[groups.length - 1];
    if (last?.key === item.periodKey) last.items.push(item);
    else {
      const label = data?.sections.find((s) => s.key === item.periodKey)?.label ?? item.periodLabel;
      groups.push({ key: item.periodKey, label: cleanLabel(label), items: [item] });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
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

      <SponsorBanner name={data?.presentedBy?.name || DEFAULT_SPONSOR} />

      {loading ? (
        <Loader className="m-10" />
      ) : data && groups.length > 0 ? (
        groups.map((g, i) => (
          <section key={`${g.key}-${i}`} className="flex flex-col gap-4">
            <h3 className="font-display font-extrabold text-[32px] uppercase leading-none text-white">{g.label}</h3>
            <ul className="flex flex-col gap-3">
              {g.items.map((item) =>
                ENGAGEMENT_KINDS.includes(item.kind) ? (
                  <EngagementCard key={item.id} item={item} />
                ) : (
                  <TimelineCard key={item.id} item={item} detail={data} />
                ),
              )}
            </ul>
          </section>
        ))
      ) : (
        <p className="py-10 text-center text-sm text-white/50">
          {error ?? (period || engagement ? "Nothing in the thread matches these filters." : "Nothing posted in this game's thread yet.")}
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
