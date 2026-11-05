import Image from "next/image";
import { HOME_TEAM, MUSTANGS, type RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import { TEMPLATES } from "@/components/organization/recognition/templates";
import { cn } from "@/utils/cn";

export type PlayerTemplate = "Profile & Game" | "Game" | "Profile";

export const PLAYER_TEMPLATES: { name: PlayerTemplate; description: string; gradient: string }[] = [
  {
    name: "Profile & Game",
    description: "The player, the game, their badge and the shout-out.",
    gradient: "linear-gradient(160deg,#2563EB,#1D4ED8 55%,#1E3A8A)",
  },
  {
    name: "Game",
    description: "A large photo of the player with the badge, then the game, the shout-out and who gave it.",
    gradient: "linear-gradient(160deg,#0F766E,#115E59 60%,#134E4A)",
  },
  {
    name: "Profile",
    description: "The player's photo, badge and details, then the shout-out and who gave it.",
    gradient: "linear-gradient(160deg,#7C3AED,#6D28D9 55%,#4C1D95)",
  },
];

export interface PlayerRecognition {
  // Number, position, grade, sport, school and photo are left out when unknown.
  player: {
    name: string;
    number?: number;
    position?: string;
    team: string;
    grade?: string;
    sport?: string;
    school?: string;
    photo?: string;
  };
  // null until a game is picked. `opponent` is the other team's name, when known.
  game: { date: string; home: { name: string; logo: string }; away: { name: string; logo: string }; opponent?: string } | null;
  badge: RecognitionTemplate;
  description: string;
  // "Athlete of the Month": the month it's for, "YYYY-MM".
  period?: string;
  // Who gave it, and when (ISO), for the footer.
  recognizedBy?: { name: string; role?: string; at?: string };
}

export const SAMPLE_PLAYER: PlayerRecognition = {
  player: { name: "Jordan Smith", number: 12, position: "Point Guard", team: "TLAM Boys Basketball", sport: "Basketball", school: "Twin Lakes Academy" },
  game: { date: "2026-06-30T22:00:00", home: HOME_TEAM, away: MUSTANGS, opponent: MUSTANGS.name },
  badge: "Hustle",
  description: "Jordan never gave up. Played all 4 quarters with everything he had — real leader on the floor.",
  recognizedBy: { name: "Twin Lakes Academy", at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// "2026-10" → "October 2026".
const monthLabel = (period: string) => {
  const [y, m] = period.split("-").map(Number);
  return y && m ? new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
};

// Against the current time: "Just now", "5m", "2h" up to 6 hours, then the date ("Nov 4").
const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 6 * 3600) return `${Math.floor(s / 3600)}h`;
  // From 6 hours on, the date (with the year when it isn't this year's).
  const at = new Date(iso);
  return at.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(at.getFullYear() !== new Date().getFullYear() && { year: "numeric" }) });
};

// "#12 · Basketball · Twin Lakes Academy" (the team name when the school isn't known).
const detailsOf = (player: PlayerRecognition["player"]) =>
  [player.number !== undefined ? `#${player.number}` : "", player.sport, player.school || player.team].filter(Boolean).join(" · ");

// Only a full http(s) link or a site path can be drawn; anything else (e.g. a bare S3 key) falls back to initials.
const photoUrlOf = (photo?: string) => {
  if (!photo) return "";
  if (photo.startsWith("/")) return photo;
  try {
    return /^https?:$/.test(new URL(photo).protocol) ? photo : "";
  } catch {
    return "";
  }
};

// The player's photo, or their initials when there's none.
function Photo({ player, sizes, className, initialsClassName }: { player: PlayerRecognition["player"]; sizes: string; className?: string; initialsClassName?: string }) {
  const src = photoUrlOf(player.photo);
  return (
    <div className={cn("relative overflow-hidden bg-white/10", className)}>
      {src ? (
        // Player photos are presigned S3 URLs: loaded as they are, not through the optimizer.
        <Image src={src} alt={player.name} fill sizes={sizes} unoptimized={src.startsWith("http")} className="object-cover" />
      ) : (
        <span className={cn("absolute inset-0 flex items-center justify-center font-bold text-white/70", initialsClassName)}>{initials(player.name)}</span>
      )}
    </div>
  );
}

// Who gave it: role and time under the name (Profile), or on the right of it (`side`, Game).
function Footer({ by, side = false }: { by: NonNullable<PlayerRecognition["recognizedBy"]>; side?: boolean }) {
  const meta = [by.role, by.at ? timeAgo(by.at) : ""].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center gap-3">
      <span className="size-9 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold">{initials(by.name)}</span>
      <div className={cn("flex flex-1 min-w-0", side ? "items-center justify-between gap-2" : "flex-col")}>
        <span className="text-sm font-medium truncate">{by.name}</span>
        {meta && <span className={cn("text-xs text-white/70", side ? "shrink-0" : "truncate")}>{meta}</span>}
      </div>
    </div>
  );
}

// The shout-out, a few lines then faded.
const Description = ({ text }: { text: string }) => <p className="text-[15px] leading-snug text-white/95 line-clamp-4">{text}</p>;

// "Profile" (16.12): a photo beside the badge, month, name and details; then the shout-out and who gave it.
function ProfileCard({ data }: { data: PlayerRecognition }) {
  return (
    <>
      <div className="flex items-start gap-4 pb-4 border-b border-white/20">
        <Photo player={data.player} sizes="96px" className="w-24 aspect-4/5 shrink-0 rounded-[10px] ring-2 ring-white/40" initialsClassName="text-2xl" />
        <div className="flex flex-col gap-1 min-w-0 pt-1">
          <span className="self-start h-7 px-2.5 rounded-full flex items-center gap-1.5 bg-white/15 text-xs font-semibold">
            {TEMPLATES[data.badge].icon("size-3.5 shrink-0")}
            {data.badge}
          </span>
          {data.period && <span className="text-xs text-white/70">{monthLabel(data.period)}</span>}
          <span className="text-lg font-bold leading-tight truncate">{data.player.name}</span>
          <span className="text-xs text-white/75 truncate">{detailsOf(data.player)}</span>
        </div>
      </div>
      <Description text={data.description} />
      {data.recognizedBy && <Footer by={data.recognizedBy} />}
    </>
  );
}

// "Game" (16.13): a large photo with the badge, name and details (and the game) over it; then the shout-out
// and who gave it on a panel below.
function GameCard({ data }: { data: PlayerRecognition }) {
  // Like the Profile card: number, sport and the player's school (no matchup), and the month when set.
  const details = [detailsOf(data.player), data.period ? monthLabel(data.period) : ""].filter(Boolean).join(" · ");
  return (
    <>
      <div className="relative -mx-5 -mt-5">
        <Photo player={data.player} sizes="(max-width: 1280px) 100vw, 400px" className="aspect-4/3 max-h-80 w-full" initialsClassName="text-5xl" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-16 bg-linear-to-t from-black/85 via-black/50 to-transparent flex flex-col gap-1.5">
          <span className="self-start h-7 px-2.5 rounded-md bg-white text-black flex items-center gap-1.5 text-xs font-black uppercase tracking-wide">
            {TEMPLATES[data.badge].icon("size-3.5 shrink-0")}
            {data.badge}
          </span>
          <span className="text-lg font-bold leading-tight truncate">{data.player.name}</span>
          <span className="text-xs text-white/80 line-clamp-2">{details}</span>
        </div>
      </div>
      <Description text={data.description} />
      {data.recognizedBy && <Footer by={data.recognizedBy} side />}
    </>
  );
}

interface PlayerCardProps {
  template: PlayerTemplate;
  data: PlayerRecognition;
  // A colour picked in Details, in place of the template's.
  gradient?: string;
  className?: string;
}

// A player recognition as fans will see it (the Impact / Athlete Spotlight cards). "Profile" leads with a photo
// beside the player's details; "Game" (and the older "Profile & Game") with a large photo and the game.
// Both show the badge, the shout-out and who gave it.
export default function PlayerCard({ template, data, gradient, className }: PlayerCardProps) {
  const style = PLAYER_TEMPLATES.find((t) => t.name === template) ?? PLAYER_TEMPLATES[0];
  return (
    <div
      className={cn("rounded-[14px] p-5 flex flex-col gap-4 overflow-hidden text-white text-left", className)}
      style={{ background: gradient || style.gradient }}
    >
      {template === "Profile" ? <ProfileCard data={data} /> : <GameCard data={data} />}
    </div>
  );
}
