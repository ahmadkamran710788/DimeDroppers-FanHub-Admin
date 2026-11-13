"use client";

import StatusPill from "@/components/common/status-pill";
import ContactAvatar from "@/components/organization/messages/contact-avatar";
import { formatListTime } from "@/components/organization/messages/helpers";
import { conversationStyle, formatDay, needsReply } from "@/components/organization/sponsor-messages/data";
import { cn } from "@/utils/cn";
import type { MessageSender, ThreadSummary } from "@/utils/types/sponsor-ai";

// Who wrote last, before the preview.
const PREVIEW_PREFIX: Record<MessageSender, string> = {
  ORGANISATION: "You",
  AGENT: "Agent",
  SPONSOR: "They replied",
};

interface ThreadRowProps {
  thread: ThreadSummary;
  selected: boolean;
  onSelect: () => void;
}

// One conversation in the list: the business and contact, who wrote last, its status, replies, whether
// it's waiting on the organisation's answer, and the next follow-up.
export default function ThreadRow({ thread, selected, onSelect }: ThreadRowProps) {
  const { business, contact, lastMessage } = thread;
  const style = conversationStyle(thread.status);
  const preview = lastMessage ? `${PREVIEW_PREFIX[lastMessage.sender]}: ${lastMessage.preview}` : null;

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
          {needsReply(thread) && (
            <StatusPill
              label="Needs your reply"
              color="bg-[#3d2a12]"
              className="h-auto px-2 py-0.5"
              textClassName="text-[11px] font-semibold text-[#ffc999]"
            />
          )}
          {thread.call?.status === "BOOKED" && (
            <StatusPill
              label="Call booked"
              color="bg-[#1d3a1e]"
              className="h-auto px-2 py-0.5"
              textClassName="text-[11px] font-semibold text-[#a3e3a5]"
            />
          )}
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
