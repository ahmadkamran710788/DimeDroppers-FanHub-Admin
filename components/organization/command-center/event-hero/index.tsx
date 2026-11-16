"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import { orgKindOf, useAuth } from "@/context/auth";
import { routes } from "@/utils/routes";
import type { CommandCenterOverview } from "@/utils/types/command-center";

// The live operations board isn't built yet.
const comingSoon = () => toast("Coming soon.");

const n = (v: number) => v.toLocaleString("en-US");
const plural = (count: number, word: string) => `${n(count)} ${word}${count === 1 ? "" : "s"}`;

// What still stands between the event and ready, from the same numbers as Event Readiness: games in the
// next 7 days without a scorekeeper, and pending scorekeeper / videographer / message requests.
const openItems = (r: CommandCenterOverview["readiness"]) =>
  Math.max(0, r.upcomingGames - r.upcomingGamesWithScorekeeper) +
  r.pendingScorekeeperRequests +
  r.pendingVideographerRequests +
  r.pendingMessageRequests;

// Headline card: is the event ready, plus shortcuts into the live tools. While the overview loads it
// shows placeholders; if it couldn't load, says so with a retry — never zeros or a "ready" it doesn't know.
export default function EventHero({
  overview,
  loading,
  onRetry,
}: {
  overview: CommandCenterOverview | null;
  loading: boolean;
  onRetry: () => void;
}) {
  const router = useRouter();
  // A tournament's Schedule page lists its events, so the button says so.
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";

  let body;
  if (loading) {
    body = (
      <div className="flex flex-col gap-5 animate-pulse" aria-label="Loading event status">
        <span className="h-7 w-56 rounded-full bg-white/10" />
        <span className="h-10 w-4/5 rounded-lg bg-white/10" />
        <span className="h-5 w-3/5 rounded-lg bg-white/10" />
      </div>
    );
  } else if (!overview) {
    body = (
      <>
        <h3 className="font-display font-extrabold text-[28px] lg:text-[40px] uppercase text-white leading-none">
          Couldn&apos;t load event status
        </h3>
        <p className="max-w-2xl text-base leading-[26px] text-white/80">
          The live games and readiness for this event aren&apos;t available right now.
        </p>
      </>
    );
  } else {
    const { games, teams } = overview.cards;
    const active = (games.live ?? 0) + (games.startingSoon ?? 0);
    // The picked event's name, else the organisation's.
    const name = overview.event?.name ?? overview.organisation.name;
    const open = openItems(overview.readiness);
    body = (
      <>
        {active > 0 ? (
          <span className="self-start inline-flex items-center gap-2 h-7 px-3 rounded-full bg-success/20 text-success text-xs font-semibold">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            {`${plural(active, "game")} live or starting soon`}
          </span>
        ) : (
          <span className="self-start inline-flex items-center h-7 px-3 rounded-full bg-white/10 text-white/70 text-xs font-semibold">
            No games live right now
          </span>
        )}
        <h3 className="font-display font-extrabold text-[28px] lg:text-[40px] uppercase text-white leading-none">
          {open === 0 ? `${name} is operationally ready` : `${name} has ${plural(open, "item")} to handle`}
        </h3>
        <p className="max-w-2xl text-base leading-[26px] text-white/80">
          {`${plural(teams.total, "team")}${teams.divisions != null ? ` across ${plural(teams.divisions, "division")}` : ""}. Monitor court status, Dime Vision streams, score feeds, sponsor activations and fan engagement without leaving the ${isTournament ? "tournament" : "school"} workspace.`}
        </p>
      </>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-[8px] p-6 lg:p-8 flex flex-col justify-center gap-5 bg-surface-07 backdrop-blur-[24px] outline outline-1 outline-white/10"
      style={{ backgroundImage: "radial-gradient(circle at 85% 20%, rgba(157,98,193,0.45), transparent 55%)" }}
    >
      {body}
      <div className="flex flex-wrap gap-3">
        {!loading && !overview && <Button variant="cta" label="Try again" onClick={onRetry} />}
        <Button variant={!loading && !overview ? "ghost" : "cta"} label="Open Live Operations Board" onClick={comingSoon} />
        <Button variant="ghost" label={isTournament ? "View Events" : "View Schedule"} onClick={() => router.push(routes.ui.schedule)} />
        <Button variant="ghost" label="Sponsor Inventory" onClick={() => router.push(routes.ui.inventory)} />
      </div>
    </section>
  );
}
