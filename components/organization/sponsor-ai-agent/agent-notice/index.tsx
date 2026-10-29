import Link from "next/link";
import { CircleAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/utils/cn";

export interface NoticeItem {
  message: string;
  // Where the organisation fixes it.
  action?: { label: string; href: string };
}

interface AgentNoticeProps {
  // "error": what stops a search or made it fail. "warning": a search that finished with gaps.
  tone: "error" | "warning";
  items: NoticeItem[];
  className?: string;
}

const TONE = {
  error: { box: "border-[#ffa3a3]/30 bg-[#3f1416]/60 text-[#ffd0d0]", icon: CircleAlert },
  warning: { box: "border-[#f0c36a]/30 bg-[#3d2a12]/60 text-[#ffe2b8]", icon: TriangleAlert },
};

// The Sponsor AI messages to act on, each written for the organisation as the API sends it.
export default function AgentNotice({ tone, items, className }: AgentNoticeProps) {
  if (items.length === 0) return null;
  const { box, icon: Icon } = TONE[tone];
  return (
    <ul role={tone === "error" ? "alert" : "status"} className={cn("flex flex-col gap-2 rounded-[8px] border px-4 py-3 text-sm", box, className)}>
      {items.map((item) => (
        <li key={item.message} className="flex flex-wrap items-start gap-x-3 gap-y-1">
          <Icon className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="flex-1 min-w-[200px]">{item.message}</span>
          {item.action && (
            <Link href={item.action.href} className="font-semibold underline underline-offset-2 hover:text-white">
              {item.action.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
