// SAMPLE DATA — Sponsor Messages has no API yet (approving a Sponsor AI draft and the threads it opens
// come later). Mirrors the design canvas (Fan Hub – Sponsor AI Agent); replace with the threads API.

import type { PackageTier } from "@/utils/types/sponsor-packages";

export interface AgentEvent {
  id: string;
  name: string;
  dates: string;
  venue: string;
}

// A business the agent emailed, and the conversation it already has.
export interface AgentSponsor {
  id: string;
  business: string;
  contact: string;
  // How the email greets them.
  firstName: string;
  role: string;
  email: string;
  // The package the agent recommends.
  tier: PackageTier;
  // Why they'd sponsor, finishing the email's first paragraph.
  why: string;
  seed?: { sentAt: string; reply: string; replyAt: string; agentReply: string; agentReplyAt: string };
}

// The packages named in the approved email (the chips under it).
export interface SamplePackage {
  tier: PackageTier;
  name: string;
  totalCents: number;
  currency: string;
}

export const SAMPLE_EVENT: AgentEvent = {
  id: "e1",
  name: "Jacksonville Fall Classic",
  dates: "Nov 13–15, 2026",
  venue: "River City Fieldhouse, Jacksonville",
};

export const SAMPLE_PACKAGES: SamplePackage[] = [
  { tier: "COMMUNITY_PARTNER", name: "Community Partner", totalCents: 5000, currency: "USD" },
  { tier: "FAN_ENGAGEMENT_PARTNER", name: "Fan Engagement Partner", totalCents: 14000, currency: "USD" },
  { tier: "PRESENTING_PARTNER", name: "Presenting / Category Partner", totalCents: 16000, currency: "USD" },
];

// The threads Sponsor Messages opens with.
export const SAMPLE_SPONSORS: AgentSponsor[] = [
  {
    id: "s1",
    business: "River City Smokehouse",
    contact: "Maria Lopez",
    firstName: "Maria",
    role: "Owner",
    email: "maria@[business-domain].com",
    tier: "FAN_ENGAGEMENT_PARTNER",
    why: "you’re just a few minutes from our venue, where hundreds of players and families eat between games",
    seed: {
      sentAt: "Today 10:02 AM",
      reply: "Thanks for reaching out! We’re interested. What does the Fan Engagement Partner package actually look like for fans, and when is your next tournament?",
      replyAt: "Today 1:18 PM",
      agentReply:
        "Hi Maria, great to hear from you! With the Fan Engagement Partner package ($140), River City Smokehouse is the sponsor behind our live predictions, fan votes, game threads, trivia and challenges in the Fan Hub, so families see your name every time they play along during games.\n\nThe {EVENT} runs {DATES} at {VENUE}. Would a quick 15-minute call on [DAY / TIME] work to lock it in?",
      agentReplyAt: "Today 1:19 PM",
    },
  },
];

const packageName = (tier: PackageTier) => SAMPLE_PACKAGES.find((p) => p.tier === tier)?.name ?? "";

// The follow-up the organiser approved for one business.
export const draftBody = (s: AgentSponsor, event: AgentEvent, orgName: string) =>
  `Hi ${s.firstName},\n\nWe’re ${orgName}. We run youth basketball tournaments here in Jacksonville, and ${s.why}.\n\nWe’d love to have ${s.business} as a sponsor of our ${event.name}, ${event.dates} at ${event.venue}.\n\nOur three sponsorship packages are below, starting at $50. We think the ${packageName(s.tier)} package would be a great fit for you.\n\nWould you be open to a quick call next week?\n\nBest,\n${orgName}`;

// The agent's answer to the first reply, with the event filled in.
export const agentReplyText = (s: AgentSponsor, event: AgentEvent, orgName: string) =>
  `${(s.seed?.agentReply ?? "")
    .replace("{EVENT}", event.name)
    .replace("{DATES}", event.dates)
    .replace("{VENUE}", event.venue)}\n\nSponsor AI Agent, on behalf of ${orgName}`;
