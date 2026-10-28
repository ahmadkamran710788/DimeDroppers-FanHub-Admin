"use client";

import StatusPill from "@/components/common/status-pill";
import ContactAvatar from "@/components/organization/messages/contact-avatar";
import { agentReplyText, type AgentSponsor } from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorAgent } from "@/context/sponsor-agent";
import { cn } from "@/utils/cn";

interface ThreadRowProps {
  sponsor: AgentSponsor;
  selected: boolean;
  onSelect: () => void;
}

// One thread in the list: the business, the latest message and whether the agent has replied.
export default function ThreadRow({ sponsor, selected, onSelect }: ThreadRowProps) {
  const { event, orgName, bodyOf, repliesOf } = useSponsorAgent();
  const replied = !!sponsor.seed;
  const lastReply = repliesOf(sponsor.id).at(-1);
  const preview = lastReply
    ? `You: ${lastReply}`
    : replied
      ? `Agent: ${agentReplyText(sponsor, event, orgName)}`
      : `You: ${bodyOf(sponsor)}`;
  const time = lastReply || !sponsor.seed ? "Just now" : sponsor.seed.agentReplyAt.replace("Today ", "");

  return (
    // A clickable row (avatar, lines of text, a badge), not an action button.
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "cursor-pointer w-full flex items-start gap-3 px-3 py-3 rounded-[8px] border text-left transition-colors",
        selected ? "bg-white/10 border-[#8b6dff]" : "border-transparent hover:bg-white/5"
      )}
    >
      <ContactAvatar name={sponsor.business} />
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-white truncate">{sponsor.business}</span>
          <span className="shrink-0 text-[11px] text-white/40">{time}</span>
        </span>
        <span className="text-xs text-white/60 truncate">{preview}</span>
        <StatusPill
          label={replied ? "Agent replied" : "Awaiting reply"}
          color={replied ? "bg-[#2a2148]" : "bg-white/10"}
          className="self-start h-auto px-2 py-0.5"
          textClassName={cn("text-[11px] font-semibold", replied ? "text-[#d9ccff]" : "text-white/80")}
        />
      </span>
    </button>
  );
}
