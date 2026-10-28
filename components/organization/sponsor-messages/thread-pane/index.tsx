"use client";

import { useState } from "react";
import { FileText, SendHorizontal, Sparkles } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import StatusPill from "@/components/common/status-pill";
import ContactAvatar from "@/components/organization/messages/contact-avatar";
import MessageBubble from "@/components/organization/sponsor-messages/message-bubble";
import { SAMPLE_PACKAGES, agentReplyText, type AgentSponsor } from "@/components/organization/sponsor-ai-agent/data";
import { formatCents } from "@/components/sponsor/sponsor-api";
import { useSponsorAgent } from "@/context/sponsor-agent";
import { cn } from "@/utils/cn";

interface ThreadPaneProps {
  sponsor: AgentSponsor;
}

// The open thread: who it's with, the conversation, and either the agent's note or a reply box once
// the organiser has taken over.
export default function ThreadPane({ sponsor }: ThreadPaneProps) {
  const { event, orgName, bodyOf, repliesOf, addReply, agentOn, toggleAgent } = useSponsorAgent();
  const [draft, setDraft] = useState("");
  const on = agentOn(sponsor.id);
  const seed = sponsor.seed;

  function send() {
    const text = draft.trim();
    if (!text) return;
    addReply(sponsor.id, text);
    setDraft("");
  }

  return (
    <section
      aria-label={`Conversation with ${sponsor.business}`}
      className="min-w-0 rounded-[8px] flex flex-col backdrop-blur-[48px] bg-surface-06"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
        <div className="flex items-start gap-3 min-w-0">
          <ContactAvatar name={sponsor.business} />
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-base font-semibold text-white">{sponsor.business}</h3>
            <span className="text-xs text-white/60">{`${sponsor.contact}, ${sponsor.role} · ${sponsor.email}`}</span>
            <span className="self-start rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{`Event: ${event.name}`}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill
            label={on ? "Agent handling" : "You’re handling"}
            color={on ? "bg-[#2a2148]" : "bg-[#3d2a12]"}
            className="h-auto px-2.5 py-1"
            textClassName={cn("text-xs font-bold", on ? "text-[#d9ccff]" : "text-[#ffc999]")}
          />
          <Button
            size="sm"
            label={on ? "Take over" : "Hand back to agent"}
            onClick={() => toggleAgent(sponsor.id)}
            className="h-10 px-4 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        <MessageBubble kind="org" who="You · approved" time={seed?.sentAt ?? "Just now"} text={bodyOf(sponsor)}>
          <div className="flex flex-wrap justify-end gap-2">
            {SAMPLE_PACKAGES.map((p) => (
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
        </MessageBubble>
        {seed && (
          <>
            <MessageBubble kind="sponsor" who={sponsor.contact} time={seed.replyAt} text={seed.reply} />
            <MessageBubble kind="agent" who="Sent by Sponsor AI Agent" time={seed.agentReplyAt} text={agentReplyText(sponsor, event, orgName)} />
          </>
        )}
        {repliesOf(sponsor.id).map((text, i) => (
          <MessageBubble key={i} kind="org" who="You" time="Just now" text={text} />
        ))}
        {!seed && (
          <div className="self-center flex items-center gap-2 rounded-full border border-dashed border-white/30 px-4 py-2 text-xs text-white/60">
            <span className="size-2 rounded-full bg-[#f0c36a]" />
            {`Waiting for ${sponsor.firstName} to reply. The agent will answer automatically.`}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        {on ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#d9ccff]" aria-hidden="true" />
              The agent answers package questions and books calls for you.
            </span>
            <span className="text-xs text-white/50">You’ll be notified when a sponsor commits.</span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-3"
          >
            <Input
              label="Your reply"
              name={`sponsor-reply-${sponsor.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply…"
              variant="dark"
              className="flex-1 min-w-0"
              labelClassName="sr-only"
            />
            <Button
              type="submit"
              variant="cta"
              label="Send"
              icon={<SendHorizontal className="size-5" strokeWidth={2} />}
              iconPosition="end"
              disabled={!draft.trim()}
              className="h-[52px] px-6"
            />
          </form>
        )}
      </div>
    </section>
  );
}
