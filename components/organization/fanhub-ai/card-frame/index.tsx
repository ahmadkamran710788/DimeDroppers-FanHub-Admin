import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface CardFrameProps {
  title: string;
  // E.g. "3 more not shown" beside the title.
  aside?: ReactNode;
  children: ReactNode;
  // Red edge for a removal.
  tone?: "default" | "danger";
  className?: string;
}

// The box every card of an agent reply sits in.
export default function CardFrame({ title, aside, children, tone = "default", className }: CardFrameProps) {
  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-[8px] border bg-black/25 p-3 flex flex-col gap-3",
        tone === "danger" ? "border-[#ff9c9c]/40" : "border-white/10",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-xs font-bold tracking-[1.2px] uppercase text-white/60">{title}</h4>
        {aside}
      </div>
      {children}
    </div>
  );
}
