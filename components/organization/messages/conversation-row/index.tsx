import ContactAvatar from "@/components/organization/messages/contact-avatar";
import { conversationName, formatListTime, previewText } from "@/components/organization/messages/helpers";
import type { OrgConversation } from "@/components/organization/messages/types";
import { cn } from "@/utils/cn";

interface ConversationRowProps {
  conversation: OrgConversation;
  onClick: () => void;
  className?: string;
}

// One chat in a list: avatar, name, last message, time, unread count and team.
// Used by the Communications chats list and the header's messages box.
export default function ConversationRow({ conversation: c, onClick, className }: ConversationRowProps) {
  const unread = c.unreadCount > 0;
  const at = c.lastMessageAt ?? c.createdAt;
  return (
    // A whole clickable row (avatar, text, badges), not an action button, so it stays a native <button>.
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors",
        className
      )}
    >
      <ContactAvatar
        name={conversationName(c)}
        src={c.type === "DIRECT" ? c.participants[0]?.fan.avatarUrl : null}
        group={c.type === "GROUP"}
      />
      <span className="flex-1 flex flex-col min-w-0">
        <span className="flex items-center gap-2">
          <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{conversationName(c)}</span>
          <span className="shrink-0 text-[11px] text-white/40">{formatListTime(at)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className={cn("flex-1 min-w-0 text-xs truncate", unread ? "font-medium text-white" : "text-white/50")}>
            {previewText(c)}
          </span>
          {unread && (
            <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[11px] font-bold leading-none flex items-center justify-center">
              {c.unreadCount}
            </span>
          )}
        </span>
        {c.team && <span className="text-[11px] text-white/40 truncate">{c.team.name}</span>}
      </span>
    </button>
  );
}
