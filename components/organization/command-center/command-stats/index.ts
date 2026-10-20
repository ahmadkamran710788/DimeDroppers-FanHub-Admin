import type { Stat } from "@/components/common/stat-card";
import { formatMoney } from "@/utils/helper";
import type { CommandCenterOverview } from "@/utils/types/command-center";

const n = (v: number) => v.toLocaleString("en-US");

// The five stat cards from the overview; "—" values while it loads or when it failed.
export function commandStats(overview: CommandCenterOverview | null): Stat[] {
  const c = overview?.cards;
  const followerChange = c?.followers.changeLast30DaysPercent;
  return [
    {
      label: "Teams",
      value: c ? n(c.teams.total) : "—",
      tint: "rgba(101,193,98,0.5)",
      trend: "up",
      caption: c ? `+${n(c.teams.addedLast12Months)} vs prior year` : "vs prior year",
    },
    { label: "Games", value: c ? n(c.games.total) : "—", tint: "rgba(99,139,254,0.5)", caption: c ? `${n(c.games.today)} today` : "today" },
    {
      label: "Live Viewers",
      value: c ? n(c.liveViewers.now) : "—",
      tint: "rgba(157,98,193,0.5)",
      caption: c ? `${n(c.liveViewers.liveGames)} ${c.liveViewers.liveGames === 1 ? "game" : "games"} live` : "live now",
    },
    {
      label: "Tickets Sold",
      value: c ? n(c.tickets.sold) : "—",
      tint: "rgba(184,184,184,0.5)",
      caption: c ? `${formatMoney(c.tickets.grossUsd)} gross` : "gross",
    },
    {
      label: "Total Followers",
      value: c ? n(c.followers.total) : "—",
      tint: "rgba(184,184,184,0.5)",
      // No arrow when there is nothing to compare against.
      ...(followerChange != null && { change: followerChange }),
      caption: c && followerChange == null ? `+${n(c.followers.addedLast30Days)} in the last 30 days` : "vs Last 30 Days",
    },
  ];
}
