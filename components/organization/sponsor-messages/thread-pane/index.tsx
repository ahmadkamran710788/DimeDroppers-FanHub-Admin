"use client";

import { useState } from "react";
import { CalendarClock, FileText, Octagon, SendHorizontal } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Input from "@/components/common/input";
import Loader from "@/components/common/loader";
import StatusPill from "@/components/common/status-pill";
import Tooltip from "@/components/common/tooltip";
import ContactAvatar from "@/components/organization/messages/contact-avatar";
import { formatBubbleTime } from "@/components/organization/messages/helpers";
import MessageBubble from "@/components/organization/sponsor-messages/message-bubble";
import {
  KIND_LABEL,
  MESSAGE_STATUS_LABEL,
  STOP_REASON_LABEL,
  conversationStyle,
  formatDay,
  messageTime,
} from "@/components/organization/sponsor-messages/data";
import { useSponsorThread } from "@/components/organization/sponsor-messages/use-sponsor-thread";
import { formatCents } from "@/components/sponsor/sponsor-api";
import { cn } from "@/utils/cn";
import type { ThreadSummary } from "@/utils/types/sponsor-ai";

interface ThreadPaneProps {
  id: string;
  // The conversation's row in the list, when it's on the page shown; its activity reloads the pane.
  summary: ThreadSummary | null;
  // A stop changes the list's status and counts.
  onStopped: () => void;
}

// The open conversation: who it's with, every email and reply with its delivery status, and Stop. Taking
// over and replying from here aren't in the API yet, so they show disabled.
export default function ThreadPane({ id, summary, onStopped }: ThreadPaneProps) {
  const { thread, loading, notSent, error, stop } = useSponsorThread(id, summary?.lastActivityAt, onStopped);
  const [confirmStop, setConfirmStop] = useState(false);
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
  const stoppable = shown.status === "ACTIVE" || shown.status === "REPLIED";
  const contactLine = contact
    ? [[contact.name, contact.title].filter(Boolean).join(", "), contact.email].filter(Boolean).join(" · ")
    : "No contact";

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
              {shown.event?.name && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{`Event: ${shown.event.name}`}</span>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tooltip label="Coming soon">
            <Button size="sm" label="Take over" disabled className="h-10 px-4 text-sm" />
          </Tooltip>
          {stoppable && (
            <Button
              size="sm"
              variant="danger"
              label="Stop conversation"
              icon={<Octagon className="size-4" />}
              onClick={() => setConfirmStop(true)}
              className="h-10 px-4 text-sm"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        {!thread ? (
          loading ? <Loader /> : <p className="py-8 text-center text-sm text-white/60">{error ?? "Couldn’t load the conversation."}</p>
        ) : (
          thread.messages.map((m) => (
            <MessageBubble
              key={m.id}
              side={m.sender.type === "ORGANISATION" ? "org" : "sponsor"}
              who={`${m.sender.name ?? m.sender.email ?? "Unknown sender"} · ${KIND_LABEL[m.kind]}`}
              time={formatBubbleTime(messageTime(m))}
              text={m.body ?? ""}
              status={m.direction === "OUTBOUND" ? MESSAGE_STATUS_LABEL[m.status] : null}
            >
              {m.kind === "INITIAL" && thread.packages.length > 0 && (
                <div className="flex flex-wrap justify-end gap-2">
                  {thread.packages.map((p) => (
                    <span
                      key={p.tier}
                      className="flex items-center gap-2 rounded-[8px] border border-white/15 bg-black/30 px-3 py-2 text-xs text-white"
                    >
                      <FileText className="size-3.5 text-white/60" aria-hidden="true" />
                      <span className="font-medium">{p.name}</span>
                      <span className="font-semibold text-[#f9a8d4]">{formatCents(p.totalCents, p.currency)}</span>
                    </span>
                  ))}
                </div>
              )}
            </MessageBubble>
          ))
        )}
        {shown.nextFollowUpAt && (
          <div className="self-center flex items-center gap-2 rounded-full border border-dashed border-white/30 px-4 py-2 text-xs text-white/60">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {`No reply yet. Next follow-up on ${formatDay(shown.nextFollowUpAt)}.`}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-end gap-3">
          <Input
            label="Your reply"
            name={`sponsor-reply-${id}`}
            placeholder="Replying from here is coming soon"
            // Disabled until there's a reply API, so nothing can be typed.
            value=""
            onChange={() => {}}
            disabled
            variant="dark"
            className="flex-1 min-w-0"
            labelClassName="sr-only"
          />
          <Tooltip label="Coming soon" side="top">
            <Button
              variant="cta"
              label="Send"
              icon={<SendHorizontal className="size-5" strokeWidth={2} />}
              iconPosition="end"
              disabled
              className="h-[52px] px-6"
            />
          </Tooltip>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Stop this conversation?"
        message={`No more emails go to ${business.name}: follow-ups that haven’t gone out are cancelled. This can’t be undone.`}
        confirmLabel="Stop conversation"
        busyLabel="Stopping…"
        onConfirm={stop}
        destructive
      />
    </section>
  );
}
