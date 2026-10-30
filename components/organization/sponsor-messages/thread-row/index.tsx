"use client";

import StatusPill from "@/components/common/status-pill";
import ContactAvatar from "@/components/organization/messages/contact-avatar";
import { formatListTime } from "@/components/organization/messages/helpers";
import { conversationStyle, formatDay } from "@/components/organization/sponsor-messages/data";
import { cn } from "@/utils/cn";
import type { ThreadSummary } from "@/utils/types/sponsor-ai";

interface ThreadRowProps {
  thread: ThreadSummary;
  selected: boolean;
  onSelect: () => void;
}

// One conversation in the list: the business and contact, who wrote last, its status, replies and the
// next follow-up.
export default function ThreadRow({ thread, selected, onSelect }: ThreadRowProps) {
  const { business, contact, lastMessage } = thread;
  const style = conversationStyle(thread.status);
  const preview = lastMessage ? `${lastMessage.sender === "SPONSOR" ? "They replied" : "You"}: ${lastMessage.preview}` : null;

  return (
    // A clickable row (avatar, lines of text, badges), not an action button.
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "cursor-pointer w-full flex items-start gap-3 px-3 py-3 rounded-[8px] border text-left transition-colors",
        selected ? "bg-white/10 border-[#8b6dff]" : "border-transparent hover:bg-white/5"
      )}
    >
      <ContactAvatar name={business.name} />
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-white truncate">{business.name}</span>
          <span className="shrink-0 text-[11px] text-white/40">{formatListTime(lastMessage?.at ?? thread.lastActivityAt)}</span>
        </span>
        {contact?.name && (
          <span className="text-xs text-white/50 truncate">{[contact.name, contact.title].filter(Boolean).join(", ")}</span>
        )}
        {preview && <span className="text-xs text-white/70 truncate">{preview}</span>}
        <span className="flex flex-wrap items-center gap-1.5">
          <StatusPill
            label={style.label}
            color={style.color}
            className="h-auto px-2 py-0.5"
            textClassName={cn("text-[11px] font-semibold", style.text)}
          />
          {thread.replyCount > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
              {`${thread.replyCount} ${thread.replyCount === 1 ? "reply" : "replies"}`}
            </span>
          )}
          {thread.nextFollowUpAt && (
            <span className="text-[11px] text-white/50">{`Next follow-up ${formatDay(thread.nextFollowUpAt)}`}</span>
          )}
        </span>
      </span>
    </button>
  );
}
