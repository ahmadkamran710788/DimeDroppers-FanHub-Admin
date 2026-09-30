import { type ReactNode } from "react";
import { ShieldQuestionMark } from "lucide-react";
import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import type { TopDonor } from "@/components/fundraising/data";
import { formatMoney } from "@/utils/helper";

const divider = <hr className="border-white/10" />;

interface TopDonorsProps {
  donors: TopDonor[];
  onViewAll: () => void;
}

export function TopDonors({ donors, onViewAll }: TopDonorsProps) {
  return (
    <SectionCard title="Top Donors" className="bg-surface-08 lg:p-6">
      {divider}
      <ol className="flex flex-col gap-6">
        {donors.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-white whitespace-nowrap">
            <span className="text-base leading-6 font-semibold">{i + 1}.</span>
            <span className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <span className="text-base leading-6 font-semibold truncate">{d.name}</span>
              <span className="text-sm leading-5 opacity-40">{formatMoney(d.amount)}</span>
            </span>
          </li>
        ))}
      </ol>
      {divider}
      <Button label="View All" fullWidth onClick={onViewAll} />
    </SectionCard>
  );
}

export interface QuickLink {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
}


export function QuickLinks({ links }: { links: QuickLink[] }) {
  return (
    <SectionCard title="Quick Links" className="bg-surface-08 lg:p-6">
      {divider}
      <ul className="flex flex-col gap-6">
        {links.map((link) => (
          <li key={link.label}>
            <button
              type="button"
              onClick={link.onSelect}
              className="flex items-center gap-2 text-base leading-6 font-semibold text-white hover:opacity-80 transition-opacity"
            >
              {link.icon}
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function HelpCard({ onLearnMore }: { onLearnMore: () => void }) {
  return (
    <SectionCard className="lg:p-6">
      <div className="flex items-start gap-2 text-white">
        <ShieldQuestionMark className="size-10 shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col gap-2">
          <p className="text-2xl leading-8 font-bold">Need help with Fundraising?</p>
          <p className="text-base leading-6">Visit our Help Center to learn more.</p>
        </div>
      </div>
      {divider}
      <Button label="Learn More" fullWidth onClick={onLearnMore} />
    </SectionCard>
  );
}
