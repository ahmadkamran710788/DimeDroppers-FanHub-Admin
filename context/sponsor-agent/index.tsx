"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth";
import {
  SAMPLE_EVENTS,
  SAMPLE_SPONSORS,
  draftBody,
  type AgentEvent,
  type AgentSponsor,
  type FollowUpStatus,
} from "@/components/organization/sponsor-ai-agent/data";

// The Sponsor AI Agent's drafts and the Sponsor Messages threads they turn into once approved, shared by
// both pages. There is no API yet, so it lives in memory and starts over on a reload.

interface SponsorAgentContextValue {
  event: AgentEvent;
  setEventId: (id: string) => void;
  orgName: string;
  statusOf: (id: string) => FollowUpStatus;
  setStatus: (id: string, status: FollowUpStatus) => void;
  approveAll: (ids: string[]) => void;
  // The email as edited, else the agent's draft.
  bodyOf: (sponsor: AgentSponsor) => string;
  setBody: (id: string, body: string) => void;
  // Approved and sent: one Sponsor Messages thread each.
  sentSponsors: AgentSponsor[];
  // What the organiser wrote in a thread after taking it over.
  repliesOf: (id: string) => string[];
  addReply: (id: string, text: string) => void;
  agentOn: (id: string) => boolean;
  toggleAgent: (id: string) => void;
}

const SponsorAgentContext = createContext<SponsorAgentContextValue | null>(null);

// Sponsors with a conversation already start as sent, so Sponsor Messages opens with a thread.
const SEEDED_STATUSES: Record<string, FollowUpStatus> = Object.fromEntries(
  SAMPLE_SPONSORS.filter((s) => s.seed).map((s) => [s.id, "sent"])
);

export function SponsorAgentProvider({ children }: { children: ReactNode }) {
  const { org } = useAuth();
  const orgName = org?.name || "our organization";
  const [eventId, setEventIdState] = useState(SAMPLE_EVENTS[0].id);
  const [statuses, setStatuses] = useState<Record<string, FollowUpStatus>>(SEEDED_STATUSES);
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string[]>>({});
  const [agentOff, setAgentOff] = useState<Record<string, boolean>>({});

  const event = SAMPLE_EVENTS.find((e) => e.id === eventId) ?? SAMPLE_EVENTS[0];

  // A new event redrafts every email, so edits made for the old one are dropped.
  const setEventId = useCallback((id: string) => {
    setEventIdState(id);
    setBodies({});
  }, []);

  const setStatus = useCallback((id: string, status: FollowUpStatus) => setStatuses((prev) => ({ ...prev, [id]: status })), []);

  const approveAll = useCallback(
    (ids: string[]) =>
      setStatuses((prev) => ({ ...prev, ...Object.fromEntries(ids.filter((id) => (prev[id] ?? "draft") === "draft").map((id) => [id, "sent"])) })),
    []
  );

  const value = useMemo<SponsorAgentContextValue>(
    () => ({
      event,
      setEventId,
      orgName,
      statusOf: (id) => statuses[id] ?? "draft",
      setStatus,
      approveAll,
      bodyOf: (s) => bodies[s.id] ?? draftBody(s, event, orgName),
      setBody: (id, body) => setBodies((prev) => ({ ...prev, [id]: body })),
      sentSponsors: SAMPLE_SPONSORS.filter((s) => statuses[s.id] === "sent"),
      repliesOf: (id) => replies[id] ?? [],
      addReply: (id, text) => setReplies((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), text] })),
      agentOn: (id) => !agentOff[id],
      toggleAgent: (id) => setAgentOff((prev) => ({ ...prev, [id]: !prev[id] })),
    }),
    [event, setEventId, orgName, statuses, setStatus, approveAll, bodies, replies, agentOff]
  );

  return <SponsorAgentContext.Provider value={value}>{children}</SponsorAgentContext.Provider>;
}

export function useSponsorAgent(): SponsorAgentContextValue {
  const ctx = useContext(SponsorAgentContext);
  if (!ctx) throw new Error("useSponsorAgent must be used inside SponsorAgentProvider");
  return ctx;
}
