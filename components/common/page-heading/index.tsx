import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PageHeadingProps {
  title: string;
  description?: ReactNode;
  // Shown beside the title on wider screens (e.g. a "Create" button), under it on phones.
  actions?: ReactNode;
  className?: string;
}

// A page's big uppercase title with its one-line description (Fundraising, Sponsor AI Agent, …).
export default function PageHeading({ title, description, actions, className }: PageHeadingProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-6", className)}>
      <div className="flex flex-col text-white">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          {title}
        </h2>
        {description && <p className="text-base leading-[26px] max-w-[720px]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
