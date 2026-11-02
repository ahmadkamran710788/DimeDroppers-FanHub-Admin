"use client";

import { useState } from "react";
import { CalendarClock, FileText, Octagon, SendHorizontal, Sparkles, UserRound } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import StatusPill from "@/components/common/status-pill";
import Textarea from "@/components/common/textarea";
import ContactAvatar from "@/components/organization/messages/contact-avatar";
import { formatBubbleTime } from "@/components/organization/messages/helpers";
import { usePackagePdf } from "@/components/organization/sponsor-ai-agent/use-package-pdf";
import MessageBubble from "@/components/organization/sponsor-messages/message-bubble";
import {
  HANDLER_LABEL,
  KIND_LABEL,
  MESSAGE_STATUS_LABEL,
  REPLY_MAX_CHARS,
  STOP_REASON_LABEL,
  canReply,
  conversationStyle,
  formatDay,
  isOpen,
  messageTime,
} from "@/components/organization/sponsor-messages/data";
import { threadReplySchema } from "@/components/organization/sponsor-messages/schema";
import { useSponsorThread } from "@/components/organization/sponsor-messages/use-sponsor-thread";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import type { MessageSender, ThreadMessage, ThreadSummary } from "@/utils/types/sponsor-ai";

interface ThreadPaneProps {
  id: string;
  // The conversation's row in the list, when it's on the page shown; its activity reloads the pane.
  summary: ThreadSummary | null;
  // A stop, take over, hand back or reply changes the list's row and counts.
  onChanged: () => void;
}

// The agent's follow-ups and answers sit on the organisation's side, in their own colour.
const SIDE: Record<MessageSender, "org" | "agent" | "sponsor"> = {
  ORGANISATION: "org",
  AGENT: "agent",
  SPONSOR: "sponsor",
};

// The sponsor sees the organisation contact on every email; here it says who actually wrote it.
const writer = (m: ThreadMessage) =>
  m.sender.type === "ORGANISATION"
    ? "You"
    : m.sender.type === "AGENT"
      ? "Sponsor AI Agent"
      : (m.sender.name ?? m.sender.email ?? "Unknown sender");

// The open conversation: who it's with, who answers it (the agent or the organisation), every email and
// reply with its delivery status, and the package PDF the first email carried. The organisation can take
// over from the agent, reply, hand it back, or stop it.
export default function ThreadPane({ id, summary, onChanged }: ThreadPaneProps) {
  // The agent can hand a conversation over without writing, so the handler reloads it as well.
  const stamp = summary ? `${summary.lastActivityAt}|${summary.handler}` : undefined;
  const { thread, loading, notSent, error, stop, takeOver, handBack, reply } = useSponsorThread(id, stamp, onChanged);
  const pdf = usePackagePdf();
  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmHandBack, setConfirmHandBack] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const shown = thread ?? summary;

  if (!shown) {
    return (
      <section className="min-w-0 rounded-[8px] backdrop-blur-[48px] bg-surface-06 px-5 py-12 text-center text-sm text-white/60">
        {loading ? (
          <Loader />
        ) : notSent ? (
          "This email hasn’t gone out yet. The conversation appears here once it’s sent."
        ) : (
          (error ?? "Couldn’t load the conversation.")
        )}
      </section>
    );
  }

  const { business, contact } = shown;
  const style = conversationStyle(shown.status);
  const open = isOpen(shown);
  const byAgent = shown.handler === "AGENT";
  const contactLine = contact
    ? [[contact.name, contact.title].filter(Boolean).join(", "), contact.email].filter(Boolean).join(" · ")
    : "No contact";

  async function startHandling() {
    setTakingOver(true);
    await takeOver();
    setTakingOver(false);
  }

  // The text stays in the box until the reply is queued, so a failure can be sent again.
  async function send() {
    if (!(await validateAndSetErrors(threadReplySchema, { body: text }, setErrors))) return;
    setSending(true);
    const result = await reply(text.trim());
    setSending(false);
    if (result.sent) setText("");
    else if (result.error) setErrors({ body: result.error });
  }

  return (
    <section
      aria-label={`Conversation with ${business.name}`}
      className="min-w-0 rounded-[8px] flex flex-col backdrop-blur-[48px] bg-surface-06"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
        <div className="flex items-start gap-3 min-w-0">
          <ContactAvatar name={business.name} />
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-base font-semibold text-white">{business.name}</h3>
            <span className="text-xs text-white/60 break-words">{contactLine}</span>
            <span className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={shown.status === "STOPPED" && shown.stopReason ? STOP_REASON_LABEL[shown.stopReason] : style.label}
                color={style.color}
                className="h-auto px-2.5 py-1"
                textClassName={cn("text-xs font-bold", style.text)}
              />
              {open && (
                <StatusPill
                  label={HANDLER_LABEL[shown.handler]}
                  color={byAgent ? "bg-[#2a2148]" : "bg-white/10"}
                  className="h-auto px-2.5 py-1"
                  textClassName={cn("text-xs font-bold", byAgent ? "text-[#d9ccff]" : "text-white/80")}
                />
              )}
              {shown.event?.name && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{`Event: ${shown.event.name}`}</span>
              )}
            </span>
          </div>
        </div>
        {open && (
          <div className="flex flex-wrap items-center gap-3">
            {byAgent ? (
              <Button
                size="sm"
                label={takingOver ? "Taking over…" : "Take over"}
                icon={<UserRound className="size-4" />}
                onClick={startHandling}
                disabled={takingOver}
                className="h-10 px-4 text-sm"
              />
            ) : (
              <Button
                size="sm"
                label="Let the agent handle it"
                icon={<Sparkles className="size-4" />}
                onClick={() => setConfirmHandBack(true)}
                className="h-10 px-4 text-sm"
              />
            )}
            <Button
              size="sm"
              variant="danger"
              label="Stop conversation"
              icon={<Octagon className="size-4" />}
              onClick={() => setConfirmStop(true)}
              className="h-10 px-4 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        {!thread ? (
          loading ? <Loader /> : <p className="py-8 text-center text-sm text-white/60">{error ?? "Couldn’t load the conversation."}</p>
        ) : (
          thread.messages.map((m) => (
            <MessageBubble
              key={m.id}
              side={SIDE[m.sender.type]}
              who={`${writer(m)} · ${KIND_LABEL[m.kind]}`}
              time={formatBubbleTime(messageTime(m))}
              text={m.body ?? ""}
              status={m.direction === "OUTBOUND" ? MESSAGE_STATUS_LABEL[m.status] : null}
            >
              {m.kind === "INITIAL" && thread.packages.length > 0 && (
                // An attachment chip that opens the package PDF, not an action button.
                <button
                  type="button"
                  onClick={() => pdf.open(id)}
                  disabled={pdf.openingId === id}
                  className="cursor-pointer flex items-center gap-2 rounded-[8px] border border-white/15 bg-black/30 px-3 py-2 text-xs text-white transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                >
                  <FileText className="size-3.5 text-white/60" aria-hidden="true" />
                  <span className="font-medium">Sponsorship Packages.pdf</span>
                  <span className="text-white/60">
                    {pdf.openingId === id
                      ? "Opening…"
                      : `${thread.packages.length} ${thread.packages.length === 1 ? "package" : "packages"}`}
                  </span>
                </button>
              )}
            </MessageBubble>
          ))
        )}
        {open && byAgent && shown.lastMessage?.sender === "SPONSOR" && (
          <div className="self-center flex items-center gap-2 rounded-full border border-dashed border-[#8b6dff]/50 px-4 py-2 text-xs text-[#d9ccff]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Sponsor AI Agent answers this reply in about two minutes, or hands the conversation to you.
          </div>
        )}
        {shown.nextFollowUpAt && (
          <div className="self-center flex items-center gap-2 rounded-full border border-dashed border-white/30 px-4 py-2 text-xs text-white/60">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {`No reply yet. Next follow-up on ${formatDay(shown.nextFollowUpAt)}.`}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        {canReply(shown) ? (
          <div className="flex flex-col gap-3">
            <Textarea
              label="Your reply"
              name={`sponsor-reply-${id}`}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (errors.body) setErrors({});
              }}
              placeholder="Write your reply. It’s sent exactly as written, so add your sign-off."
              rows={4}
              maxLength={REPLY_MAX_CHARS}
              fieldVariant="dark"
              error={errors.body}
              labelClassName="sr-only"
              fieldClassName="text-sm font-normal leading-[1.55] resize-y"
            />
            <Button
              variant="cta"
              label={sending ? "Sending…" : "Send"}
              icon={<SendHorizontal className="size-5" strokeWidth={2} />}
              iconPosition="end"
              onClick={send}
              disabled={sending || !text.trim()}
              className="self-end h-[52px] px-6"
            />
          </div>
        ) : open ? (
          <p className="flex items-center gap-2 text-sm text-white/60">
            <Sparkles className="size-4 shrink-0 text-[#d9ccff]" aria-hidden="true" />
            Sponsor AI Agent answers the sponsor’s replies for you. Take over to reply yourself.
          </p>
        ) : (
          <p className="text-sm text-white/60">This conversation has stopped, so no more emails can go to this sponsor.</p>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Stop this conversation?"
        message={`No more emails go to ${business.name}: follow-ups and answers that haven’t gone out are cancelled. This can’t be undone.`}
        confirmLabel="Stop conversation"
        busyLabel="Stopping…"
        onConfirm={stop}
        destructive
      />

      <ConfirmModal
        isOpen={confirmHandBack}
        onClose={() => setConfirmHandBack(false)}
        title="Let the agent handle it?"
        message={`Sponsor AI Agent answers ${business.name}’s replies by email from now on. If their last reply hasn’t been answered, the agent answers it in about two minutes.`}
        confirmLabel="Hand back"
        busyLabel="Handing back…"
        onConfirm={handBack}
      />
    </section>
  );
}
