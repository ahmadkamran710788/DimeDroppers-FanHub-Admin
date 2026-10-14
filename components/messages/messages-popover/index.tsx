"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import ConversationRow from "@/components/messages/conversation-row";
import type { OrgConversation } from "@/components/messages/types";

// Above the header (z-20) and page content; below the account menu's 9999.
const Z_INDEX = 9990;
const OFFSET = 8;

interface MessagesPopoverProps {
  // The header button the box hangs under; clicks on it don't count as "outside".
  anchorRef: RefObject<HTMLElement | null>;
  conversations: OrgConversation[];
  loading: boolean;
  // A chat was picked: the header opens it on the Communications page.
  onOpenChat: (conversationId: string) => void;
  onOpenAll: () => void;
  onClose: () => void;
}

// Small box under the header's chat icon listing the org's conversations, newest first.
export default function MessagesPopover({ anchorRef, conversations, loading, onOpenChat, onOpenAll, onClose }: MessagesPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  // Right-aligned under the icon, measured before paint so it never flashes at 0,0.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPosition({ top: rect.bottom + OFFSET, right: Math.max(8, document.documentElement.clientWidth - rect.right) });
  }, [anchorRef]);

  // Outside click, Escape and resize close it.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onClose);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Messages"
      className="fixed w-[min(380px,calc(100vw-16px))] flex flex-col rounded-[12px] overflow-hidden border border-white/10 bg-[rgba(11,28,45,0.96)] backdrop-blur-[48px] shadow-2xl"
      style={{ top: position?.top ?? 0, right: position?.right ?? 0, zIndex: Z_INDEX, visibility: position ? "visible" : "hidden" }}
    >
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="font-display font-black text-lg uppercase text-white leading-none">Messages</h2>
      </div>

      <div className="max-h-[420px] overflow-y-auto p-3 flex flex-col gap-2">
        {loading ? (
          <Loader />
        ) : conversations.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/50">No conversations yet.</p>
        ) : (
          conversations.map((c) => <ConversationRow key={c.id} conversation={c} onClick={() => onOpenChat(c.id)} />)
        )}
      </div>

      <Button
        variant="text"
        size="sm"
        label="Open Communications"
        icon={<ChevronRight className="size-4" />}
        iconPosition="end"
        onClick={onOpenAll}
        className="cursor-pointer w-full gap-1 px-4 py-3 rounded-none border-t border-white/10 text-sm hover:bg-white/5"
      />
    </div>,
    document.body
  );
}
