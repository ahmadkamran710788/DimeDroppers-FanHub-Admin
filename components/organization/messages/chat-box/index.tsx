"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Paperclip, SendHorizontal } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { fetchMessages, markRead, MESSAGES_PAGE_SIZE, sendMessage } from "@/components/organization/messages/chat-api";
import ContactAvatar from "@/components/organization/messages/contact-avatar";
import { attachmentPreview, conversationName, formatBubbleTime } from "@/components/organization/messages/helpers";
import type { OrgChatMessage, OrgConversation } from "@/components/organization/messages/types";
import { cn } from "@/utils/cn";

const byTime = (a: OrgChatMessage, b: OrgChatMessage) => a.createdAt.localeCompare(b.createdAt);

// Folds a fetched page into what's shown: the server's copy wins, and an optimistic bubble
// goes once its echoed clientMessageId comes back.
const merge = (current: OrgChatMessage[], page: OrgChatMessage[]) => {
  const ids = new Set(page.map((m) => m.id));
  const clientIds = new Set(page.map((m) => m.clientMessageId).filter(Boolean));
  const kept = current.filter((m) => !ids.has(m.id) && !(m.pending && clientIds.has(m.clientMessageId)));
  return [...kept, ...page].sort(byTime);
};

// crypto.randomUUID only exists in secure contexts (https or localhost).
const newClientId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const pendingMessage = (conversationId: string, body: string, clientMessageId: string): OrgChatMessage => ({
  id: clientMessageId,
  conversationId,
  senderIsOrg: true,
  sender: null,
  body,
  attachmentUrl: null,
  attachmentType: null,
  attachmentMimeType: null,
  attachmentFileName: null,
  attachmentThumbnailUrl: null,
  clientMessageId,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  pending: true,
});

// Body of one bubble: a deleted marker, or the fan's attachment with the text as its caption.
function MessageContent({ message: m }: { message: OrgChatMessage }) {
  if (m.deletedAt) return <p className="italic text-white/50">This message was deleted</p>;
  const preview = attachmentPreview(m);
  return (
    <>
      {m.attachmentUrl &&
        (preview ? (
          <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" aria-label={m.attachmentFileName ?? "Open attachment"}>
            <Image
              src={preview}
              alt={m.attachmentFileName ?? ""}
              width={240}
              height={160}
              // Presigned S3 URLs, valid for an hour; no remote image host is configured.
              unoptimized
              className="w-60 h-40 rounded-xl object-cover bg-black/30"
            />
          </a>
        ) : (
          <a
            href={m.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 underline underline-offset-2"
          >
            <Paperclip className="size-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{m.attachmentFileName ?? "Attachment"}</span>
          </a>
        ))}
      {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
    </>
  );
}

interface ChatBoxProps {
  conversation: OrgConversation;
  // Back to the chats list.
  onBack: () => void;
  // Refetches the chats list, after a send or a read receipt.
  onActivity: () => void;
}

// One conversation: header, the messages (both sides) and a composer. The org sends text only.
export default function ChatBox({ conversation, onBack, onActivity }: ChatBoxProps) {
  const { id, lastMessageAt } = conversation;
  const isGroup = conversation.type === "GROUP";
  const name = conversationName(conversation);

  const [messages, setMessages] = useState<OrgChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const loadedOnce = useRef(false);
  // Distance from the bottom, saved before older messages go on top so the view doesn't jump.
  const keepFromBottom = useRef<number | null>(null);
  const prevLastId = useRef<string | undefined>(undefined);

  // The latest page: on open, and again whenever polling moves the conversation's lastMessageAt.
  useEffect(() => {
    let cancelled = false;
    fetchMessages(id).then((page) => {
      if (cancelled) return;
      setLoading(false);
      if (!page) return;
      const firstLoad = !loadedOnce.current;
      loadedOnce.current = true;
      if (firstLoad) setHasOlder(page.length === MESSAGES_PAGE_SIZE);
      setMessages((prev) => merge(prev, page));
      // Read on open, and whenever a fan's message arrives while the chat is open.
      if (firstLoad || page[page.length - 1]?.senderIsOrg === false) {
        void markRead(id).then(() => onActivity());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, lastMessageAt, onActivity]);

  const lastId = messages[messages.length - 1]?.id;
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (keepFromBottom.current !== null) {
      list.scrollTop = list.scrollHeight - keepFromBottom.current;
      keepFromBottom.current = null;
    } else if (lastId !== prevLastId.current) {
      list.scrollTop = list.scrollHeight;
    }
    prevLastId.current = lastId;
  }, [messages, lastId]);

  const loadOlder = async () => {
    const oldest = messages.find((m) => !m.pending);
    if (!oldest) return;
    setLoadingOlder(true);
    const page = await fetchMessages(id, oldest.id);
    setLoadingOlder(false);
    if (!page) return;
    if (listRef.current) keepFromBottom.current = listRef.current.scrollHeight - listRef.current.scrollTop;
    setHasOlder(page.length === MESSAGES_PAGE_SIZE);
    setMessages((prev) => merge(prev, page));
  };

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const clientMessageId = newClientId();
    setDraft("");
    setMessages((prev) => [...prev, pendingMessage(id, text, clientMessageId)]);

    const sent = await sendMessage(id, text, clientMessageId);
    if (!sent) {
      // chat-api has toasted the reason; put the text back so it isn't lost.
      setMessages((prev) => prev.filter((m) => m.id !== clientMessageId));
      setDraft((current) => current || text);
      return;
    }
    // The send response has no status; a new message is SENT until a fan reads it.
    setMessages((prev) => merge(prev.filter((m) => m.id !== clientMessageId), [{ ...sent, status: sent.status ?? "SENT" }]));
    onActivity();
  };

  const statusLabel = (m: OrgChatMessage) => {
    if (m.pending) return "Sending…";
    if (isGroup) {
      const seen = m.seenBy?.length ?? 0;
      return seen > 0 ? `Seen by ${seen}` : "Sent";
    }
    return m.status === "SEEN" ? "Seen" : "Sent";
  };

  const fan = conversation.participants[0]?.fan;
  const subtitle = isGroup
    ? [`${conversation.participants.length} people`, conversation.team?.name].filter(Boolean).join(" · ")
    : (conversation.team?.name ?? "");

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Recipient */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chats"
          className="cursor-pointer size-9 shrink-0 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
        </button>
        <ContactAvatar name={name} src={isGroup ? null : fan?.avatarUrl} group={isGroup} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-white truncate">{name}</span>
          <span className="text-xs text-white/50 truncate">{subtitle}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {loading ? (
          <Loader className="m-auto" />
        ) : messages.length === 0 ? (
          <p className="m-auto text-center text-sm text-white/50">
            {isGroup ? "Send the first message to the group." : `Say hello to ${name}.`}
          </p>
        ) : (
          <>
            {hasOlder && (
              <Button
                size="sm"
                label={loadingOlder ? "Loading…" : "Load older messages"}
                onClick={() => void loadOlder()}
                disabled={loadingOlder}
                className="cursor-pointer self-center text-white/70 bg-white/5 hover:bg-white/10"
              />
            )}
            {messages.map((m) =>
              m.senderIsOrg ? (
                <div key={m.id} className="self-end max-w-[80%] flex flex-col items-end gap-1">
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white flex flex-col gap-2",
                      m.pending && "opacity-70"
                    )}
                    style={{ background: "var(--gradient-cta)" }}
                  >
                    <MessageContent message={m} />
                  </div>
                  <span className="text-[11px] text-white/40">{`${formatBubbleTime(m.createdAt)} · ${statusLabel(m)}`}</span>
                </div>
              ) : (
                <div key={m.id} className="self-start max-w-[80%] flex flex-col items-start gap-1">
                  {isGroup && m.sender && <span className="px-1 text-xs font-semibold text-white/60">{m.sender.name}</span>}
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/10 text-sm text-white flex flex-col gap-2">
                    <MessageContent message={m} />
                  </div>
                  <span className="text-[11px] text-white/40">{formatBubbleTime(m.createdAt)}</span>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-end gap-2 px-4 py-4 border-t border-white/10"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter adds a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Type a message"
          aria-label="Message"
          className="flex-1 max-h-32 resize-none rounded-2xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="cursor-pointer size-11 shrink-0 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-cta)" }}
        >
          <SendHorizontal className="size-5" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
