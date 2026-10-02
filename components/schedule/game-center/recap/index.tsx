import type { ReactNode } from "react";
import { CalendarDays, Clock3, MapPin, Share2, Trophy, Users } from "lucide-react";
import type { GameTeam, GameRecap, TeamLeader } from "@/components/schedule/game-center/data";

interface RecapSectionProps {
  recap: GameRecap;
  home: GameTeam;
  away: GameTeam;
  onShare: () => void;
}

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const PANEL = "rounded-[8px] border border-white/10 bg-[#0E1A2B] p-6";
const ICON = "size-5 shrink-0";

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] items-center gap-4 text-sm">
      <span className="flex items-center gap-3 text-white/60">
        {icon}
        {label}
      </span>
      <div className="text-white min-w-0">{children}</div>
    </div>
  );
}

function TeamChip({ team }: { team: GameTeam }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={team.logo} alt="" className="size-7 shrink-0 rounded-full object-cover" />
      <span className="truncate">{team.name}</span>
    </span>
  );
}

function Leader({ team, leader }: { team: GameTeam; leader: TeamLeader | null }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      <div className="text-xs font-semibold text-white">
        <TeamChip team={team} />
      </div>
      {leader ? (
        <div className="flex flex-col gap-1 pl-9">
          <span className="text-sm text-white/80">{leader.name}</span>
          <span className="flex flex-wrap gap-x-3 text-sm text-white/60">
            {leader.stats.map((s) => (
              <span key={s.label}>
                <span className="font-semibold text-white">{s.value}</span> {s.label}
              </span>
            ))}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 pl-9 text-sm text-white/40">
          <span>Top Scorer</span>
          <span>—</span>
        </div>
      )}
    </div>
  );
}

// "Recap" tab: the written game story with a quick-summary sidebar.
export default function RecapSection({ recap, home, away, onShare }: RecapSectionProps) {
  return (
    <div className="p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] gap-4 lg:gap-6 items-start">
      {/* Story */}
      <article className={`${PANEL} grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)] gap-6`}>
        <div className="flex flex-col gap-5 min-w-0">
          <span className="self-start px-3 py-1 rounded-[6px] bg-[#5B2BB5] text-xs font-semibold uppercase tracking-wide text-white">
            Recap
          </span>
          <h3 className="font-display font-extrabold text-[28px] lg:text-[36px] leading-tight text-white">
            {recap.headline}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <CalendarDays className={ICON} strokeWidth={1.5} />
              {fmtDate(recap.date)}
            </span>
            <span className="h-4 w-px bg-white/20" />
            <span className="flex items-center gap-2">
              <MapPin className={ICON} strokeWidth={1.5} />
              {recap.venue}
            </span>
          </div>
          <div className="flex flex-col gap-4 text-base leading-7 text-white/80">
            {recap.paragraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={recap.photo} alt="" className="w-full h-full max-h-[480px] rounded-[8px] object-cover" />
      </article>

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        <section className={`${PANEL} flex flex-col gap-5`}>
          <div className="flex items-start gap-3 pb-4 border-b border-white/10 text-white">
            <CalendarDays className="size-6 shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col">
              <h4 className="text-lg font-semibold">Game Details</h4>
              <span className="text-sm text-white/60">Quick Summary</span>
            </div>
          </div>
          <DetailRow icon={<CalendarDays className={ICON} strokeWidth={1.5} />} label="Date">
            {fmtDate(recap.date)}
          </DetailRow>
          <DetailRow icon={<MapPin className={ICON} strokeWidth={1.5} />} label="Venue">
            {recap.venue}
          </DetailRow>
          <DetailRow icon={<Users className={ICON} strokeWidth={1.5} />} label="Teams">
            <div className="flex flex-col gap-2">
              <TeamChip team={home} />
              <TeamChip team={away} />
            </div>
          </DetailRow>
          <DetailRow icon={<Clock3 className={ICON} strokeWidth={1.5} />} label="Final Score">
            {`${home.score} – ${away.score}`}
          </DetailRow>
        </section>

        <section className={`${PANEL} flex flex-col gap-5`}>
          <h4 className="flex items-center gap-3 text-lg font-semibold text-white">
            <Trophy className="size-6 shrink-0" strokeWidth={1.5} />
            Team Leaders
          </h4>
          <div className="flex divide-x divide-white/10">
            <div className="flex-1 min-w-0 flex pr-4">
              <Leader team={home} leader={recap.leaders.home} />
            </div>
            <div className="flex-1 min-w-0 flex pl-4">
              <Leader team={away} leader={recap.leaders.away} />
            </div>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="h-12 px-5 rounded-[8px] border border-white/20 flex items-center gap-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            <Share2 className="size-5" strokeWidth={1.5} />
            Share
          </button>
        </section>
      </div>
    </div>
  );
}
