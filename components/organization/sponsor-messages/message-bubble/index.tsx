import { type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import LinkedText from "@/components/common/linked-text";
import { cn } from "@/utils/cn";

interface MessageBubbleProps {
  // "org": our emails, on the right. "agent": the Sponsor AI Agent's follow-ups and answers, on the right in
  // their own colour. "sponsor": their replies, on the left.
  side: "org" | "agent" | "sponsor";
  who: string;
  time: string;
  text: string;
  // Under an email we sent: "Delivered", "Opened"…
  status?: string | null;
  // Shown under the bubble, e.g. the package PDF sent with the first email.
  children?: ReactNode;
}

// One message in a sponsor conversation, styled like the Communications chat.
export default function MessageBubble({ side, who, time, text, status, children }: MessageBubbleProps) {
  const right = side !== "sponsor";
  return (
    <div className={cn("max-w-[90%] lg:max-w-[640px] flex flex-col gap-1.5", right ? "self-end items-end" : "self-start items-start")}>
      <span className="flex items-center gap-1 text-[11px] text-white/50">
        {side === "agent" && <Sparkles className="size-3 text-[#d9ccff]" aria-hidden="true" />}
        {`${who} · ${time}`}
      </span>
      <div
        className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-[1.55] text-white whitespace-pre-line break-words",
          right ? "rounded-br-sm" : "rounded-bl-sm bg-white/10",
          side === "agent" && "bg-[#2a2148] border border-[#8b6dff]/40"
        )}
        style={side === "org" ? { background: "var(--gradient-cta)" } : undefined}
      >
        {/* The agent's answer ends with the booking link, so links open from here. */}
        <LinkedText text={text} />
      </div>
      {status && <span className="text-[11px] text-white/50">{status}</span>}
      {children}
    </div>
  );
}
