import { type ReactNode } from "react";
import SectionCard from "@/components/common/section-card";

export interface QuickLink {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
}

export default function QuickLinks({ links }: { links: QuickLink[] }) {
  return (
    <SectionCard title="Quick Links" className="bg-surface-08 lg:p-6">
      <hr className="border-white/10" />
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
