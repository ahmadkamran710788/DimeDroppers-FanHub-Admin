import type { ReactNode } from "react";
import StatCard, { type Stat } from "@/components/common/stat-card";

// Stat cards above a titled settings table — the layout every engagement tab shares.
export default function TabBody({ stats, title, children }: { stats: Stat[]; title: string; children: ReactNode }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} twoLineTitle />
        ))}
      </div>

      <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[24px] bg-surface-06">
        <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">{title}</h3>
        {children}
      </div>
    </>
  );
}
