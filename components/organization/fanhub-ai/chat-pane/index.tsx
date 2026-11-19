"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, CircleAlert, Clock, Power, SendHorizontal, Sparkles, Trash2 } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Textarea from "@/components/common/textarea";
import AgentMessage, { AGENT_NAME } from "@/components/organization/fanhub-ai/agent-message";
import { MESSAGE_MAX_CHARS, STARTER_PROMPTS } from "@/components/organization/fanhub-ai/data";
import { agentMessageSchema } from "@/components/organization/fanhub-ai/schema";
import type { TurnNotice } from "@/components/organization/fanhub-ai/use-agent-thread";
import MessageBubble from "@/components/organization/sponsor-messages/message-bubble";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import type { AgentOption, Thread } from "@/utils/types/organiser-agent";

interface ChatPaneProps {
  // null for a new chat (made with its first message).
  thread: Thread | null;
  title: string;
  loading: boolean;
  loadError: string | null;
  // A reply is due in this chat.
  waiting: boolean;
  notice: TurnNotice | null;
  // The organiser's message until the thread has it.
  outgoing: string | null;
  expiredTokens: ReadonlySet<string>;
  // The agent is switched off in the settings.
  agentOff: boolean;
  onSend: (text: string, optionId?: string | null) => Promise<boolean>;
  onAnswer: (token: string, decision: "CONFIRM" | "CANCEL") => Promise<boolean>;
  onRefresh: () => void;
  // Sends a message the agent couldn't run again (offered when `canRetry`).
  canRetry: boolean;
  onRetry: () => void;
  // Left out for a new chat.
  onDelete?: () => void;
  // Back to the chats list (phones and tablets).
  onBack: () => void;
  onOpenSettings: () => void;
  className?: string;
}

// The open chat with the agent: its messages and cards, what's happening with the reply that's due, and the box
// to write in.
export default function ChatPane({
  thread,
  title,
  loading,
  loadError,
  waiting,
  notice,
  outgoing,
  expiredTokens,
  agentOff,
  onSend,
  onAnswer,
  onRefresh,
  canRetry,
  onRetry,
  onDelete,
  onBack,
  onOpenSettings,
  className,
}: ChatPaneProps) {
  const [draft, setDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const messages = thread?.messages ?? [];
  const lastAssistant = messages.findLastIndex((m) => m.role === "ASSISTANT");
  const busy = waiting || sending;
  const empty = !loading && !loadError && messages.length === 0 && !outgoing;

  // Keep the newest message in view as messages, the reply that's due and its notices come in.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [thread?.id, messages.length, outgoing, waiting, notice]);

  // The box empties once the message has gone; on a failure it keeps the text to send again.
  async function submit(text: string, optionId: string | null = null) {
    setSending(true);
    const sent = await onSend(text, optionId);
    setSending(false);
    return sent;
  }

  async function sendDraft() {
    if (busy || agentOff) return;
    if (!(await validateAndSetErrors(agentMessageSchema, { text: draft }, setErrors))) return;
    if (await submit(draft.trim())) setDraft("");
  }

  const pick = (option: AgentOption) => {
    if (!busy) void submit(option.label, option.id);
  };

  return (
    <section aria-label={title} className={cn("min-w-0 min-h-0 flex flex-col", className)}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <Button
          variant="text"
          size="icon"
          icon={<ArrowLeft className="size-5" strokeWidth={2} />}
          aria-label="Back to chats"
          onClick={onBack}
          className="xl:hidden size-9 text-white hover:bg-white/10"
        />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sparkles className="size-4 shrink-0 text-[#d9ccff]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
        </div>
        {onDelete && (
          <Button
            variant="text"
            size="icon"
            icon={<Trash2 className="size-4" />}
            aria-label="Delete chat"
            title="Delete chat"
            onClick={onDelete}
            className="size-9 hover:bg-white/10"
          />
        )}
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        {loading ? (
          <Loader className="m-auto" />
        ) : loadError && !thread ? (
          <div className="m-auto flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-white/60">{loadError}</p>
            <Button size="sm" label="Try again" onClick={onRefresh} className="h-9 px-4 text-sm" />
          </div>
        ) : empty ? (
          <div className="m-auto max-w-[480px] flex flex-col items-center gap-4 text-center">
            <span className="size-14 rounded-full bg-[#2a2148] border border-[#8b6dff]/40 flex items-center justify-center">
              <Sparkles className="size-6 text-[#d9ccff]" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-base font-semibold text-white">Ask your agent</h4>
              <p className="text-sm text-white/60">
                It looks up, adds and changes your games, teams, campaigns, tickets and more, only in your organization.
                Nothing changes until you confirm.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  size="sm"
                  variant="outline"
                  label={prompt}
                  onClick={() => void submit(prompt)}
                  disabled={busy || agentOff}
                  className="h-9 px-4 text-sm"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <AgentMessage
                key={message.id}
                message={message}
                active={index === lastAssistant && !busy && !agentOff}
                expiredTokens={expiredTokens}
                onPick={pick}
                onAnswer={onAnswer}
              />
            ))}
            {outgoing && (
              <MessageBubble side="org" who="You" time="Sending…" text={outgoing} className="opacity-70" />
            )}
            {waiting && (
              <div
                role="status"
                className="self-start flex items-center gap-2 rounded-full border border-dashed border-[#8b6dff]/50 px-4 py-2 text-xs text-[#d9ccff]"
              >
                <Sparkles className="size-3.5 animate-pulse" aria-hidden="true" />
                {`${AGENT_NAME} is working on it…`}
              </div>
            )}
            {notice?.kind === "late" && (
              <div className="self-start flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[8px] border border-dashed border-white/30 px-4 py-2 text-xs text-white/70">
                <span className="flex items-center gap-2">
                  <Clock className="size-3.5" aria-hidden="true" />
                  Still working. The reply will appear here when it’s ready.
                </span>
                <Button variant="text" size="sm" label="Check again" onClick={onRefresh} className="text-xs text-[#b9a6ff]" />
              </div>
            )}
            {notice?.kind === "failed" && (
              <div
                role="alert"
                className="self-start flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[8px] bg-[#3d1717] px-4 py-2 text-xs text-[#ff9c9c]"
              >
                <span className="flex items-start gap-2">
                  <CircleAlert className="size-3.5 shrink-0 mt-px" aria-hidden="true" />
                  {notice.error ?? "That didn’t go through. Please try again."}
                </span>
                {canRetry && !agentOff && (
                  <Button
                    variant="text"
                    size="sm"
                    label="Try again"
                    onClick={onRetry}
                    disabled={busy}
                    className="text-xs text-white hover:text-white/80"
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        {agentOff ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-white/60">
              <Power className="size-4 shrink-0" aria-hidden="true" />
              Your agent is turned off. Turn it on to send it messages.
            </p>
            <Button size="sm" variant="outline" label="Agent settings" onClick={onOpenSettings} className="h-9 px-4 text-sm" />
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <Textarea
              label="Message"
              name="organiser-agent-message"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (errors.text) setErrors({});
              }}
              onKeyDown={(e) => {
                // Enter sends; Shift+Enter adds a new line.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void sendDraft();
                }
              }}
              placeholder="Ask your agent, e.g. “Move Friday’s boys basketball game to 7 PM”"
              rows={2}
              maxLength={MESSAGE_MAX_CHARS}
              fieldVariant="dark"
              error={errors.text}
              showCounter={draft.length > MESSAGE_MAX_CHARS - 200}
              labelClassName="sr-only"
              fieldClassName="text-sm font-normal leading-[1.55]"
              disabled={loading}
              className="flex-1 min-w-0"
            />
            <Button
              variant="cta"
              size="icon"
              icon={<SendHorizontal className="size-5" strokeWidth={2} />}
              aria-label="Send message"
              onClick={() => void sendDraft()}
              disabled={busy || loading || !draft.trim()}
              className="size-12 mb-px"
            />
          </div>
        )}
      </div>
    </section>
  );
}
