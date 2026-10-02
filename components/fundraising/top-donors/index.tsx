import RankedList from "@/components/common/ranked-list";
import type { TopDonor } from "@/components/fundraising/data";

interface TopDonorsProps {
  donors: TopDonor[];
  onViewAll: () => void;
}

export default function TopDonors({ donors, onViewAll }: TopDonorsProps) {
  return <RankedList title="Top Donors" items={donors} onViewAll={onViewAll} />;
}
