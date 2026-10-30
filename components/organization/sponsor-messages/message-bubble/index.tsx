import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface MessageBubbleProps {
  // "org": our emails, on the right. "sponsor": their replies, on the left.
  side: "org" | "sponsor";
  who: string;
  time: string;
  text: string;
  // Under an email we sent: "Delivered", "Opened"…
  status?: string | null;
  // Shown under the bubble, e.g. the packages sent with the first email.
  children?: ReactNode;
}

// One message in a sponsor conversation, styled like the Communications chat.
export default function MessageBubble({ side, who, time, text, status, children }: MessageBubbleProps) {
  const right = side === "org";
  return (
    <div className={cn("max-w-[90%] lg:max-w-[640px] flex flex-col gap-1.5", right ? "self-end items-end" : "self-start items-start")}>
      <span className="text-[11px] text-white/50">{`${who} · ${time}`}</span>
      <div
        className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-[1.55] text-white whitespace-pre-line break-words",
          right ? "rounded-br-sm" : "rounded-bl-sm bg-white/10"
        )}
        style={right ? { background: "var(--gradient-cta)" } : undefined}
      >
        {text}
      </div>
      {status && <span className="text-[11px] text-white/50">{status}</span>}
      {children}
    </div>
  );
}
