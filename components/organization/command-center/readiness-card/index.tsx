import { Check } from "lucide-react";
import Loader from "@/components/common/loader";
import { cn } from "@/utils/cn";
import type { CommandCenterOverview } from "@/utils/types/command-center";

interface ReadinessCardProps {
  readiness: CommandCenterOverview["readiness"] | null;
  loading: boolean;
}

// Event readiness score (games in the next 7 days with an official scorekeeper) and the queues
// behind it. A request row at 0 shows a tick; pending requests show in red.
export default function ReadinessCard({ readiness, loading }: ReadinessCardProps) {
  const percent = readiness?.percent ?? 0;
  const items = readiness
    ? [
        { label: "Pending Scorekeeper Requests", value: readiness.pendingScorekeeperRequests, warn: true },
        { label: "Pending Videographer Requests", value: readiness.pendingVideographerRequests, warn: true },
        { label: "Pending Message Requests", value: readiness.pendingMessageRequests, warn: true },
        { label: "Active Donations", value: readiness.activeDonations, warn: false },
      ]
    : [];

  return (
    <section className="rounded-[8px] p-6 flex flex-col gap-4 bg-surface-07 backdrop-blur-[24px]">
      <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">Event Readiness</h3>
      {loading ? (
        <Loader />
      ) : !readiness ? (
        <p className="py-6 text-center text-sm text-white/60">Readiness isn&apos;t available right now.</p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <span className="font-display font-extrabold text-[40px] text-white leading-none">{`${percent}%`}</span>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Event readiness"
              className="flex-1 h-2 rounded-full bg-black/40"
            >
              <div className="h-2 rounded-full" style={{ width: `${percent}%`, background: "var(--gradient-cta)" }} />
            </div>
          </div>
          <span className="text-xs text-white/60">
            {readiness.upcomingGames === 0
              ? "No games in the next 7 days"
              : `${readiness.upcomingGamesWithScorekeeper} of ${readiness.upcomingGames} games in the next 7 days have a scorekeeper`}
          </span>
          <ul className="flex flex-col rounded-[8px] overflow-hidden border border-white/10">
            {items.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-4 px-4 py-3 bg-white/5 border-b border-white/10 last:border-b-0 text-sm text-white"
              >
                {item.label}
                {item.warn && item.value === 0 ? (
                  <Check className="size-4 text-success" strokeWidth={3} aria-label="None pending" />
                ) : (
                  <span className={cn("font-semibold", item.warn ? "text-error" : "text-white")}>{item.value.toLocaleString("en-US")}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
