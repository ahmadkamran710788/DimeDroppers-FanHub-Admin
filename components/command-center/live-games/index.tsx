import StatusPill from "@/components/common/status-pill";
import { GAME_STATUS_COLOR, LIVE_GAMES } from "@/components/command-center/data";
import { cn } from "@/utils/cn";

// Games in play right now: one card per game with the score and how far it has got.
export default function LiveGames() {
  const liveCount = LIVE_GAMES.filter((g) => g.status === "Live").length;
  return (
    <section className="rounded-[8px] p-6 flex flex-col gap-5 bg-surface-07 backdrop-blur-[24px]">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">Live Games</h3>
        <span className="text-xs text-white/50 whitespace-nowrap">{`${liveCount} live · updated seconds ago`}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        {LIVE_GAMES.map((game) => {
          const homeLeads = game.homeScore >= game.awayScore;
          return (
            <div key={game.id} className="rounded-[8px] p-4 flex flex-col gap-3 bg-white/5 border border-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/50">{game.court}</span>
                <StatusPill
                  label={game.status}
                  color={GAME_STATUS_COLOR[game.status]}
                  className="h-5 px-2"
                  textClassName="text-[11px] uppercase"
                />
              </div>
              {/* Score lines; the leading team is in full white. */}
              <div className="flex flex-col gap-1">
                {[
                  { team: game.home, score: game.homeScore, leads: homeLeads },
                  { team: game.away, score: game.awayScore, leads: !homeLeads },
                ].map((side) => (
                  <div
                    key={side.team}
                    className={cn("flex items-center justify-between gap-3", side.leads ? "text-white" : "text-white/60")}
                  >
                    <span className="text-base font-semibold truncate">{side.team}</span>
                    <span className="font-display font-extrabold text-2xl leading-none">{side.score}</span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-black/40">
                <div className="h-1.5 rounded-full bg-steel-blue" style={{ width: `${game.progress}%` }} />
              </div>
              <span className="text-xs text-white/60">{game.detail}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
