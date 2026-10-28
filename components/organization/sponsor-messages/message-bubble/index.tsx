import { type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";

interface MessageBubbleProps {
  // "org" and "agent" sit on the right, the sponsor's on the left.
  kind: "org" | "sponsor" | "agent";
  who: string;
  time: string;
  text: string;
  // Shown under the bubble, e.g. the packages sent with the first email.
  children?: ReactNode;
}

// One message in a sponsor thread, styled like the Communications chat.
export default function MessageBubble({ kind, who, time, text, children }: MessageBubbleProps) {
  const right = kind !== "sponsor";
  return (
    <div className={cn("max-w-[90%] lg:max-w-[640px] flex flex-col gap-1.5", right ? "self-end items-end" : "self-start items-start")}>
      <span className="flex items-center gap-1.5 text-[11px] text-white/50">
        {kind === "agent" && <Sparkles className="size-3.5 text-[#d9ccff]" aria-hidden="true" />}
        {`${who} · ${time}`}
      </span>
      <div
        className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-[1.55] text-white whitespace-pre-line",
          kind === "org" && "rounded-br-sm",
          kind === "sponsor" && "rounded-bl-sm bg-white/10",
          kind === "agent" && "rounded-br-sm bg-[#2a2148] border border-[#4a3f7a]"
        )}
        style={kind === "org" ? { background: "var(--gradient-cta)" } : undefined}
      >
        {text}
      </div>
      {children}
    </div>
  );
}
