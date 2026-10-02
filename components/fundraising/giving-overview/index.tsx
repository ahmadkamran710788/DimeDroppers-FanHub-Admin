import DonutBreakdown from "@/components/common/donut-breakdown";
import type { GivingSlice } from "@/components/fundraising/data";
import { formatMoney } from "@/utils/helper";

interface GivingOverviewProps {
  total: number;
  slices: GivingSlice[];
  onViewReports: () => void;
}

export default function GivingOverview({ total, slices, onViewReports }: GivingOverviewProps) {
  return (
    <DonutBreakdown
      title="Giving Overview"
      centerValue={formatMoney(total)}
      centerLabel="Total Raised"
      slices={slices.map((s) => ({ label: s.type, detail: formatMoney(s.amount), percent: s.percent, color: s.color }))}
      actionLabel="View Donation Reports"
      onAction={onViewReports}
    />
  );
}
