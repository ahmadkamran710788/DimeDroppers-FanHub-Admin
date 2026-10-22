"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Clock3 } from "lucide-react";
import Loader from "@/components/common/loader";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SegmentedControl from "@/components/common/segmented-control";
import type { GamePhase, MediaGame, PlayEvent, Quarter } from "@/components/organization/media/data";
import { useGameDetail } from "@/components/organization/media/use-game-detail";
import { routes } from "@/utils/routes";
import type { GameThreadDetail, ThreadItem, ThreadPhase } from "@/utils/types/game-detail";

const PHASES: readonly GamePhase[] = ["Pre-Game", "Live Game", "Final"];
const QUARTERS: readonly Quarter[] = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

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

const PHASE_OF: Record<GamePhase, ThreadPhase> = { "Pre-Game": "pre", "Live Game": "live", Final: "final" };
const PHASE_LABEL: Record<ThreadPhase, GamePhase> = { pre: "Pre-Game", live: "Live Game", final: "Final" };
const FALLBACK_LOGO = "/images/preview-crest.png";
const THREAD_LIMIT = 200;

// Small label above a thread item, e.g. "2PT Made", "Prediction".
const TYPE_LABELS: Record<string, string> = {
  twoPointMade: "2PT Made",
  threePointMade: "3PT Made",
  timeout: "Timeout",
  tipoff: "Game Update",
  periodStart: "Period",
  periodEnd: "Period",
  halftime: "Halftime",
  final: "Final",
};
const KIND_LABELS: Record<ThreadItem["kind"], string> = {
  phase: "Game Update",
  play: "Play",
  highlight: "Highlight",
  prediction: "Prediction",
  poll: "Poll",
  challenge: "Challenge",
  donation: "Donation",
};

const toEvent = (item: ThreadItem, detail: GameThreadDetail): PlayEvent => {
  const side = item.data.teamSide === "HOME" ? detail.Home : item.data.teamSide === "AWAY" ? detail.Away : null;
  return {
    id: item.id,
    time: new Date(item.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    type: TYPE_LABELS[item.subKind] ?? KIND_LABELS[item.kind] ?? item.kind,
    text: item.body ? `${item.title} — ${item.body}` : item.title,
    teamLogo: side ? side.Logo || FALLBACK_LOGO : undefined,
    score: item.data.score ?? undefined,
  };
};

// A school game's thread from GET /game-detail/games/{id}/thread. The phase opens on the game's current
// one; during the live phase the plays can be narrowed to one period (or halftime).
function ApiThread({ gameId }: { gameId: string }) {
  // null: let the API pick the game's current phase.
  const [phase, setPhase] = useState<ThreadPhase | null>(null);
  const [period, setPeriod] = useState<string>("");
  const { data, error, loading } = useGameDetail<GameThreadDetail>(routes.api.gameDetailThread(gameId), {
    ...(phase && { phase }),
    ...(phase === "live" && period && { period }),
    page: 1,
    limit: THREAD_LIMIT,
  });
  const periods = data?.boundaries.periods.length
    ? [...data.boundaries.periods.map((p) => ({ value: String(p.period), label: p.label })), { value: "halftime", label: "Halftime" }]
    : [];

  const activePhase = phase ?? data?.phase ?? "live";
  const periodLabel = periods.find((p) => p.value === period)?.label;
  const events = data ? data.items.map((i) => toEvent(i, data)) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <SegmentedControl
          options={PHASES}
          active={PHASE_LABEL[activePhase]}
          onChange={(p) => {
            setPhase(PHASE_OF[p]);
            setPeriod("");
          }}
          ariaLabel="Game phase"
          variant="light"
          fullWidth
        />
        {activePhase === "live" && periods.length > 0 && (
          <RowActionsMenu
            ariaLabel="Choose period"
            className="size-auto h-[52px] px-4 gap-2 rounded-[10px] outline-0 border border-white/10 bg-white/[0.06] text-base text-white whitespace-nowrap"
            trigger={
              <>
                <Clock3 className="size-6" strokeWidth={1.5} />
                {periodLabel ?? "All periods"}
                <ChevronDown className="size-5" strokeWidth={2} />
              </>
            }
            items={[{ value: "", label: "All periods" }, ...periods].map((p) => ({
              label: p.label,
              onSelect: () => {
                setPhase("live");
                setPeriod(p.value);
              },
            }))}
          />
        )}
      </div>

      <h3 className="font-display font-extrabold text-[32px] uppercase leading-none text-white">
        {activePhase === "live" ? (periodLabel ?? "Live Game") : PHASE_LABEL[activePhase]}
      </h3>
      {data?.presentedBy && <p className="-mt-3 text-sm text-white/60">{`Presented by ${data.presentedBy.name}`}</p>}

      {loading ? (
        <Loader className="m-10" />
      ) : events.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-white/50">{error ?? "No plays posted for this part of the game yet."}</p>
      )}
    </div>
  );
}

// "Game Thread" tab: play-by-play for a phase of the game, one quarter at a time.
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
