"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Clock3 } from "lucide-react";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SegmentedControl from "@/components/common/segmented-control";
import type { GamePhase, MediaGame, PlayEvent, Quarter } from "@/components/media/data";

const PHASES: readonly GamePhase[] = ["Pre-Game", "Live Game", "Final"];
const QUARTERS: readonly Quarter[] = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

function EventRow({ event }: { event: PlayEvent }) {
  return (
    <li className="grid grid-cols-[76px_1px_44px_minmax(0,1fr)_auto] items-center gap-4 rounded-[10px] bg-white/[0.06] px-5 py-4">
      <span className="text-[15px] text-white whitespace-nowrap">{event.time}</span>
      <span className="self-stretch bg-white/15" />
      {event.teamLogo ? (
        <Image src={event.teamLogo} alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
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

// "Game Thread" tab: play-by-play for a phase of the game, one quarter at a time.
export default function GameThread({ game }: { game: MediaGame }) {
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
