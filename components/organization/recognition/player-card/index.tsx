import { Volleyball } from "lucide-react";
import TeamAvatar from "@/components/common/team-avatar";
import { HOME_TEAM, MUSTANGS, type RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import { TEMPLATES } from "@/components/organization/recognition/templates";
import { cn } from "@/utils/cn";

// SAMPLE DATA — there is no player recognitions endpoint yet. One player's recognition, used by the
// player templates and their preview until the backend exists.

export type PlayerTemplate = "Profile & Game" | "Game" | "Profile";

export const PLAYER_TEMPLATES: { name: PlayerTemplate; description: string; gradient: string }[] = [
  {
    name: "Profile & Game",
    description: "The player, the game, their badge and the shout-out.",
    gradient: "linear-gradient(160deg,#2563EB,#1D4ED8 55%,#1E3A8A)",
  },
  {
    name: "Game",
    description: "Leads with the game, then the badge, the shout-out and the player.",
    gradient: "linear-gradient(160deg,#0F766E,#115E59 60%,#134E4A)",
  },
  {
    name: "Profile",
    description: "Leads with the player, then the badge and the shout-out.",
    gradient: "linear-gradient(160deg,#7C3AED,#6D28D9 55%,#4C1D95)",
  },
];

export interface PlayerRecognition {
  // Number, position and grade are left out when unknown.
  player: { name: string; number?: number; position?: string; team: string; grade?: string };
  // null until a game is picked.
  game: { date: string; home: { name: string; logo: string }; away: { name: string; logo: string } } | null;
  badge: RecognitionTemplate;
  description: string;
}

export const SAMPLE_PLAYER: PlayerRecognition = {
  player: { name: "Jordan Smith", number: 12, position: "Point Guard", team: "TLAM Boys Basketball", grade: "Grade 11" },
  game: { date: "2026-06-30T22:00:00", home: HOME_TEAM, away: MUSTANGS },
  badge: "Hustle",
  description: "Jordan never gave up. Played all 4 quarters with everything he had — real leader on the floor.",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const DIVIDER = "pb-4 border-b border-white/20";

function Profile({ player, className }: { player: PlayerRecognition["player"]; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="size-14 shrink-0 rounded-full bg-white/15 ring-2 ring-white/30 flex items-center justify-center text-lg font-bold">
        {initials(player.name)}
      </span>
      <div className="flex flex-col min-w-0">
        <span className="flex items-center gap-2 text-lg font-bold leading-tight">
          {player.number !== undefined && <span className="px-2 py-0.5 rounded-md bg-white/15 text-sm">{`#${player.number}`}</span>}
          <span className="truncate">{player.name}</span>
        </span>
        <span className="text-xs text-white/75 truncate">{[player.position, player.grade, player.team].filter(Boolean).join(" · ")}</span>
      </div>
    </div>
  );
}

function Crest({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-24 text-center">
      <TeamAvatar name={name} logo={logo} size={48} className="size-12 ring-2 ring-white/30" />
      <span className="text-sm font-semibold leading-tight">{name}</span>
    </div>
  );
}

function Game({ game }: { game: NonNullable<PlayerRecognition["game"]> }) {
  const at = new Date(game.date);
  return (
    <div className={cn("flex items-start justify-between gap-2", DIVIDER)}>
      <Crest {...game.home} />
      <div className="flex flex-col items-center gap-1.5">
        <Volleyball className="size-5" strokeWidth={1.75} />
        <span className="px-2 py-0.5 rounded-full bg-white/15 text-xs font-medium uppercase">
          {at.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </span>
        <span className="text-xl font-bold whitespace-nowrap">{at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
      </div>
      <Crest {...game.away} />
    </div>
  );
}

interface PlayerCardProps {
  template: PlayerTemplate;
  data: PlayerRecognition;
  // A colour picked in Details, in place of the template's.
  gradient?: string;
  className?: string;
}

// A player recognition as fans will see it. "Profile & Game" opens with the player then the game, "Game"
// opens with the game and ends with the player (the original shout-out card), "Profile" has no game.
// Every template shows the badge and the shout-out.
export default function PlayerCard({ template, data, gradient, className }: PlayerCardProps) {
  const style = PLAYER_TEMPLATES.find((t) => t.name === template) ?? PLAYER_TEMPLATES[0];
  return (
    <div className={cn("rounded-[14px] p-5 flex flex-col gap-4 text-white text-left", className)} style={{ background: gradient || style.gradient }}>
      {template !== "Game" && <Profile player={data.player} className={DIVIDER} />}
      {template !== "Profile" &&
        (data.game ? (
          <Game game={data.game} />
        ) : (
          <span className={cn("text-sm font-semibold text-white/75", DIVIDER)}>Select a game</span>
        ))}

      <span className="self-start h-9 px-3 rounded-full flex items-center gap-1.5 bg-white/15 text-sm font-semibold">
        {TEMPLATES[data.badge].icon("size-4 shrink-0")}
        {data.badge}
      </span>
      <p className={cn("text-[15px] font-semibold leading-snug", template === "Game" && DIVIDER)}>{data.description}</p>

      {template === "Game" && <Profile player={data.player} />}
    </div>
  );
}
