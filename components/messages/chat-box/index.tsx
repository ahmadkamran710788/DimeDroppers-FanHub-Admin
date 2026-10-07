"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import ContactAvatar from "@/components/messages/contact-avatar";
import { GROUP_LABEL, type Conversation } from "@/components/messages/types";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

interface ChatBoxProps {
  conversation: Conversation;
  onSend: (text: string) => void;
  // Back to the chats list.
  onBack: () => void;
}

// Chat with the chosen team member: header, message bubbles and a composer.
export default function ChatBox({ conversation, onSend, onBack }: ChatBoxProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

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
        <ContactAvatar name={conversation.contactName} src={conversation.contactAvatar} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-white truncate">{conversation.contactName}</span>
          <span className="text-xs text-white/50 truncate">{`${conversation.teamName} · ${GROUP_LABEL[conversation.group]}`}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {conversation.messages.length === 0 ? (
          <p className="m-auto text-center text-sm text-white/50">
            {`Say hello to ${conversation.contactName}.`}
          </p>
        ) : (
          conversation.messages.map((m) => (
            <div key={m.id} className="self-end max-w-[80%] flex flex-col items-end gap-1">
              <p
                className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white whitespace-pre-wrap break-words"
                style={{ background: "var(--gradient-cta)" }}
              >
                {m.text}
              </p>
              <span className="text-[11px] text-white/40">{formatTime(m.sentAt)}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
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
              send();
            }
          }}
          rows={1}
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
