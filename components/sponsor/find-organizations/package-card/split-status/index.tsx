import { cn } from "@/utils/cn";

// A package part's status as the sponsor (or the organisation) sees it.
export type SplitStatus = "Open" | "In cart" | "Active" | "Payment pending" | "Sold";

const STATUS_STYLE: Record<SplitStatus, string> = {
  Open: "bg-[#052e16] text-[#86efac]",
  "In cart": "bg-[#2a2148] text-[#d9ccff]",
  Active: "bg-[#2a2148] text-[#d9ccff]",
  "Payment pending": "bg-[#2b1d05] text-[#fcd34d]",
  Sold: "bg-[#1e222a] text-[#a8a8a8]",
};

// A part's (or a package pod's) status as a small pill.
export default function StatusPill({ status, className }: { status: SplitStatus; className?: string }) {
  return (
    <span
      className={cn(
        "text-[11px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap",
        STATUS_STYLE[status],
        className
      )}
    >
      {status}
    </span>
  );
}
