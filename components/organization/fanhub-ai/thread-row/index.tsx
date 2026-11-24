"use client";

import RowActionsMenu from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import { STATE_STYLE } from "@/components/organization/fanhub-ai/data";
import { formatListTime } from "@/components/organization/messages/helpers";
import { cn } from "@/utils/cn";
import type { ThreadSummary } from "@/utils/types/organiser-agent";

interface ThreadRowProps {
  thread: ThreadSummary;
  selected: boolean;
  onSelect: () => void;
  // Asks to delete this chat (the page confirms first).
  onDelete: () => void;
}

// One chat in the list: its first message as the title, when it was last active and how its last reply ended,
// with a ⋮ menu to delete it.
export default function ThreadRow({ thread, selected, onSelect, onDelete }: ThreadRowProps) {
  const style = thread.lastState ? STATE_STYLE[thread.lastState] : null;
  // A one-line preview of the last message; the organiser's own gets a "You:" prefix.
  const lastText = thread.lastMessage?.text?.trim();
  const preview = lastText ? (thread.lastMessage?.role === "USER" ? `You: ${lastText}` : lastText) : null;
  return (
    <div
      className={cn(
        "flex items-start gap-1 rounded-[8px] border transition-colors",
        selected ? "bg-white/10 border-[#8b6dff]" : "border-transparent hover:bg-white/5"
      )}
    >
      {/* A clickable row (title, state badge, time and a preview), not an action button. */}
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className="cursor-pointer min-w-0 flex-1 flex flex-col gap-1 pl-3 py-3 text-left"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-white">{thread.title || "New chat"}</span>
            {style && (
              <StatusPill
                label={style.label}
                color={style.color}
                className="shrink-0 h-auto px-1.5 py-0.5"
                textClassName={cn("text-[10px] font-semibold", style.text)}
              />
            )}
          </span>
          <span className="shrink-0 text-[11px] text-white/40">{formatListTime(thread.updatedAt)}</span>
        </span>
        {preview && <span className="block truncate text-xs text-white/50">{preview}</span>}
      </button>
      <RowActionsMenu
        items={[{ label: "Delete chat", variant: "destructive", onSelect: onDelete }]}
        ariaLabel={`Actions for ${thread.title || "this chat"}`}
        className="mt-2 mr-1 shrink-0"
      />
    </div>
  );
}
