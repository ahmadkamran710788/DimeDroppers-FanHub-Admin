import DonutBreakdown, { type DonutSlice } from "@/components/common/donut-breakdown";
import { formatMoney } from "@/utils/helper";
import type { TeamDonations } from "@/utils/types/campaign";

// Teams beyond this many are summed into one "Other teams" slice.
const MAX_SLICES = 5;
const COLORS = ["#3030FF", "#FF8D2A", "#65C162", "#9D62C1", "#638BFE", "#B8B8B8"];

const percentOf = (amount: number, total: number) => Math.round((amount / total) * 1000) / 10;

// Biggest teams first; only teams that raised something get a slice.
function teamSlices(teams: TeamDonations[], total: number): DonutSlice[] {
  if (total <= 0) return [];
  const raised = teams.filter((t) => t.totalRaised > 0).sort((a, b) => b.totalRaised - a.totalRaised);
  const shown = raised.length > MAX_SLICES ? raised.slice(0, MAX_SLICES - 1) : raised;
  const otherAmount = raised.slice(shown.length).reduce((sum, t) => sum + t.totalRaised, 0);
  const slices = shown.map((t, i) => ({
    label: t.team.name,
    detail: formatMoney(t.totalRaised),
    percent: percentOf(t.totalRaised, total),
    color: COLORS[i],
  }));
  if (otherAmount > 0) {
    slices.push({
      label: "Other teams",
      detail: formatMoney(otherAmount),
      percent: percentOf(otherAmount, total),
      color: COLORS[COLORS.length - 1],
    });
  }
  return slices;
}

interface GivingOverviewProps {
  teams: TeamDonations[];
  loading: boolean;
}

// Total raised and how it splits across the organisation's teams (paid donations).
export default function GivingOverview({ teams, loading }: GivingOverviewProps) {
  const total = teams.reduce((sum, t) => sum + t.totalRaised, 0);
  return (
    <DonutBreakdown
      title="Giving Overview"
      centerValue={loading ? "—" : formatMoney(total)}
      centerLabel="Total Raised"
      slices={teamSlices(teams, total)}
      emptyText={loading ? "Loading donations…" : "No donations yet."}
    />
  );
}
