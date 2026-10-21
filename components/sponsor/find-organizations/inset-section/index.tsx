import type { ReactNode } from "react";

interface InsetSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

// Near-black box inside a card, with a small-caps title and a muted line under it.
export default function InsetSection({ title, description, children }: InsetSectionProps) {
  return (
    <div className="min-w-0 bg-[#0b0b0b] border border-[#262626] rounded-[12px] p-3 sm:p-[18px] flex flex-col gap-3">
      <div>
        <div className="text-[13px] font-bold tracking-[1px]">{title}</div>
        <div className="text-sm text-[#a8a8a8] mt-[2px]">{description}</div>
      </div>
      {children}
    </div>
  );
}
