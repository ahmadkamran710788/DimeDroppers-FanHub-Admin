"use client";

import { createContext, useMemo, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth";
import {
  SAMPLE_EVENT,
  SAMPLE_SPONSORS,
  draftBody,
  type AgentEvent,
  type AgentSponsor,
} from "@/components/organization/sponsor-messages/data";

// SAMPLE DATA — the Sponsor Messages threads, until there is a threads API (approving a Sponsor AI draft
// opens one). It lives in memory and starts over on a reload; the Sponsor AI Agent page doesn't use it.

interface SponsorAgentContextValue {
  event: AgentEvent;
  orgName: string;
  // The email the organiser approved for each thread.
  bodyOf: (sponsor: AgentSponsor) => string;
  // One Sponsor Messages thread each.
  sentSponsors: AgentSponsor[];
  // What the organiser wrote in a thread after taking it over.
  repliesOf: (id: string) => string[];
  addReply: (id: string, text: string) => void;
  agentOn: (id: string) => boolean;
  toggleAgent: (id: string) => void;
}

const SponsorAgentContext = createContext<SponsorAgentContextValue | null>(null);

export function SponsorAgentProvider({ children }: { children: ReactNode }) {
  const { org } = useAuth();
  const orgName = org?.name || "our organization";
  const [replies, setReplies] = useState<Record<string, string[]>>({});
  const [agentOff, setAgentOff] = useState<Record<string, boolean>>({});

  const value = useMemo<SponsorAgentContextValue>(
    () => ({
      event: SAMPLE_EVENT,
      orgName,
      bodyOf: (s) => draftBody(s, SAMPLE_EVENT, orgName),
      sentSponsors: SAMPLE_SPONSORS,
      repliesOf: (id) => replies[id] ?? [],
      addReply: (id, text) => setReplies((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), text] })),
      agentOn: (id) => !agentOff[id],
      toggleAgent: (id) => setAgentOff((prev) => ({ ...prev, [id]: !prev[id] })),
    }),
    [orgName, replies, agentOff]
  );

  return <SponsorAgentContext.Provider value={value}>{children}</SponsorAgentContext.Provider>;
}

export function useSponsorAgent(): SponsorAgentContextValue {
  const ctx = useContext(SponsorAgentContext);
  if (!ctx) throw new Error("useSponsorAgent must be used inside SponsorAgentProvider");
  return ctx;
}
