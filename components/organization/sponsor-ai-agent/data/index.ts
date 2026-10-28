// SAMPLE DATA — there is no Sponsor AI Agent endpoint yet. Mirrors the design canvas
// (Fan Hub – Sponsor AI Agent); replace with API calls once the backend finds and drafts sponsors.

import { CATEGORY_LABELS } from "@/components/sponsor/find-organizations/data";
import type { PackageSlot, PackageTier, SponsorPackage } from "@/utils/types/sponsor-packages";

export interface AgentEvent {
  id: string;
  name: string;
  dates: string;
  venue: string;
  city: string;
  teams: string;
  divisions: string;
  sponsorCount: number;
}

// A local business the agent matched, and the conversation it already has (only the first one).
export interface AgentSponsor {
  id: string;
  business: string;
  // One of SPONSOR_CATEGORY_OPTIONS.
  category: string;
  miles: number;
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

export type FollowUpStatus = "draft" | "sent" | "rejected";

export const SAMPLE_EVENTS: AgentEvent[] = [
  {
    id: "e1",
    name: "Jacksonville Fall Classic",
    dates: "Nov 13–15, 2026",
    venue: "River City Fieldhouse, Jacksonville",
    city: "Jacksonville, FL",
    teams: "48 teams",
    divisions: "Boys & Girls · 10U–17U",
    sponsorCount: 0,
  },
  {
    id: "e2",
    name: "Holiday Hoops Showcase",
    dates: "Dec 18–20, 2026",
    venue: "First Coast Sports Center, Jacksonville",
    city: "Jacksonville, FL",
    teams: "64 teams",
    divisions: "Boys · 12U–17U",
    sponsorCount: 1,
  },
  {
    id: "e3",
    name: "MLK Weekend Shootout",
    dates: "Jan 15–17, 2027",
    venue: "River City Fieldhouse, Jacksonville",
    city: "Jacksonville, FL",
    teams: "40 teams",
    divisions: "Girls · 10U–16U",
    sponsorCount: 0,
  },
  {
    id: "e4",
    name: "Spring Kickoff",
    dates: "Mar 5–7, 2027",
    venue: "Southside Rec Center, Jacksonville",
    city: "Jacksonville, FL",
    teams: "32 teams",
    divisions: "Coed · 8U–12U",
    sponsorCount: 2,
  },
];

// Per-placement values aren't shown on these cards, so only the package total is set.
const slot = (category: string, name: string): PackageSlot => ({
  activationId: null,
  catalogKey: `${category}-${name}`,
  name,
  category,
  categoryLabel: CATEGORY_LABELS[category],
  unitValueCents: 0,
  lineTotalCents: 0,
});

const pkg = (tier: PackageTier, name: string, purpose: string, description: string, totalCents: number, slots: PackageSlot[]): SponsorPackage => ({
  tier,
  name,
  purpose,
  description,
  isAvailable: true,
  unavailableReason: null,
  unavailableMessage: null,
  slotCount: slots.length,
  slots,
  factors: [],
  slotValueTotalCents: totalCents,
  totalCents,
  currency: "USD",
});

export const SAMPLE_PACKAGES: SponsorPackage[] = [
  pkg("COMMUNITY_PARTNER", "Community Partner", "Accessible local sponsorship", "Your name on the schedule, team pages, the fan wall and partner offers.", 5000, [
    slot("PRE_GAME", "Schedule"),
    slot("POST_GAME", "Schedule"),
    slot("ADD_ON", "Team Info"),
    slot("ADD_ON", "Recognition & Fan Wall"),
    slot("ADD_ON", "Partner Offers"),
  ]),
  pkg("FAN_ENGAGEMENT_PARTNER", "Fan Engagement Partner", "Core interactive fan sponsorship", "The sponsor behind predictions, votes, game threads, trivia and challenges.", 14000, [
    slot("PRE_GAME", "Predictions"),
    slot("LIVE", "Live Predictions"),
    slot("LIVE", "Live Vote"),
    slot("POST_GAME", "Vote"),
    slot("LIVE", "Engage Live"),
    slot("LIVE", "Game Thread"),
    slot("ADD_ON", "Challenges & Quests"),
    slot("ADD_ON", "Fan Booth"),
    slot("ADD_ON", "Trivia"),
    slot("ADD_ON", "Arcade"),
  ]),
  pkg("PRESENTING_PARTNER", "Presenting / Category Partner", "Premium sponsorship", "The schedule, scoreboard, game details, tickets and team shops, plus recorded and scored games.", 16000, [
    slot("LIVE", "Schedule"),
    slot("LIVE", "Scoreboard"),
    slot("POST_GAME", "Game Details"),
    slot("POST_GAME", "Game Thread"),
    slot("ADD_ON", "Support a Team"),
    slot("ADD_ON", "Buy Tickets"),
    slot("ADD_ON", "Team Shops"),
    slot("PRE_GAME", "Record Game"),
    slot("LIVE", "Record Game"),
    slot("PRE_GAME", "Score Game"),
    slot("LIVE", "Score Game"),
    slot("ADD_ON", "Scorekeeper Device"),
  ]),
];

export const SAMPLE_SPONSORS: AgentSponsor[] = [
  {
    id: "s1",
    business: "River City Smokehouse",
    category: "Food, Beverage & Nutrition",
    miles: 2,
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
  { id: "s2", business: "Southside Pizza Co.", category: "Food, Beverage & Nutrition", miles: 6, contact: "Dan Kim", firstName: "Dan", role: "General Manager", email: "dan@[business-domain].com", tier: "COMMUNITY_PARTNER", why: "pizza is the unofficial fuel of youth basketball weekends" },
  { id: "s3", business: "First Coast Community Credit Union", category: "Banking, Finance & Payments", miles: 4, contact: "Angela Brooks", firstName: "Angela", role: "Community Relations", email: "angela@[business-domain].com", tier: "PRESENTING_PARTNER", why: "your community programs line up closely with what we do for local youth" },
  { id: "s4", business: "Duval Sports Outfitters", category: "Sports & Athletic Apparel", miles: 8, contact: "Kevin Price", firstName: "Kevin", role: "Store Manager", email: "kevin@[business-domain].com", tier: "PRESENTING_PARTNER", why: "our players and parents are exactly the people who shop for basketball gear" },
  { id: "s5", business: "Peak Performance Training", category: "Fitness, Health & Recovery", miles: 12, contact: "Tasha Green", firstName: "Tasha", role: "Founder", email: "tasha@[business-domain].com", tier: "FAN_ENGAGEMENT_PARTNER", why: "many of our athletes are looking for off-season training" },
  { id: "s6", business: "First Coast Auto Group", category: "Automotive & Transportation", miles: 9, contact: "Derek Hall", firstName: "Derek", role: "Marketing Manager", email: "derek@[business-domain].com", tier: "PRESENTING_PARTNER", why: "our tournaments bring families from all over North Florida" },
  { id: "s7", business: "Bayside Family Dental", category: "Local Businesses & Community Partners", miles: 3, contact: "Dr. Priya Shah", firstName: "Dr. Shah", role: "Practice Owner", email: "priya@[business-domain].com", tier: "COMMUNITY_PARTNER", why: "families with young athletes are your core patients" },
  { id: "s8", business: "Harbor Insurance Agency", category: "Insurance & Professional Services", miles: 15, contact: "Tom Reyes", firstName: "Tom", role: "Agency Owner", email: "tom@[business-domain].com", tier: "COMMUNITY_PARTNER", why: "our families are local homeowners and drivers" },
  { id: "s9", business: "Northside Law Group", category: "Insurance & Professional Services", miles: 7, contact: "Rachel Moore", firstName: "Rachel", role: "Partner", email: "rachel@[business-domain].com", tier: "COMMUNITY_PARTNER", why: "you’ve supported Jacksonville youth programs before" },
  { id: "s10", business: "Coastline Tech Solutions", category: "Technology & Consumer Electronics", miles: 22, contact: "Sam Patel", firstName: "Sam", role: "CEO", email: "sam@[business-domain].com", tier: "FAN_ENGAGEMENT_PARTNER", why: "our live streams and Fan Hub reach a young, tech-savvy audience" },
  { id: "s11", business: "Sunshine HVAC & Plumbing", category: "Home, Retail & Consumer Goods", miles: 18, contact: "Luis Ortega", firstName: "Luis", role: "Owner", email: "luis@[business-domain].com", tier: "COMMUNITY_PARTNER", why: "our families are local homeowners" },
  { id: "s12", business: "Jax Learning Center", category: "Education & Career Development", miles: 5, contact: "Nina Carter", firstName: "Nina", role: "Director", email: "nina@[business-domain].com", tier: "COMMUNITY_PARTNER", why: "student-athletes and their parents care about grades as much as games" },
  { id: "s13", business: "Atlantic Realty Partners", category: "Local Businesses & Community Partners", miles: 40, contact: "Chris Lane", firstName: "Chris", role: "Broker", email: "chris@[business-domain].com", tier: "PRESENTING_PARTNER", why: "our tournaments bring hundreds of local families together every month" },
];

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_RADIUS = 25;

// Picked when the page opens: together they match a handful of the sample businesses.
export const DEFAULT_CATEGORIES = [
  "Food, Beverage & Nutrition",
  "Banking, Finance & Payments",
  "Sports & Athletic Apparel",
  "Fitness, Health & Recovery",
];

export const STATUS_STYLE: Record<FollowUpStatus, { label: string; color: string; text: string }> = {
  draft: { label: "Draft", color: "bg-[#3d2a12]", text: "text-[#ffc999]" },
  sent: { label: "Approved · Sent", color: "bg-[#1d3a1e]", text: "text-[#a3e3a5]" },
  rejected: { label: "Rejected", color: "bg-[#3f1416]", text: "text-[#ffa3a3]" },
};

export const packageName = (tier: PackageTier) => SAMPLE_PACKAGES.find((p) => p.tier === tier)?.name ?? "";

// The follow-up the agent drafts for one business.
export const draftBody = (s: AgentSponsor, event: AgentEvent, orgName: string) =>
  `Hi ${s.firstName},\n\nWe’re ${orgName}. We run youth basketball tournaments here in Jacksonville, and ${s.why}.\n\nWe’d love to have ${s.business} as a sponsor of our ${event.name}, ${event.dates} at ${event.venue} (${event.teams}).\n\nOur three sponsorship packages are below, starting at $50. We think the ${packageName(s.tier)} package would be a great fit for you.\n\nWould you be open to a quick call next week?\n\nBest,\n${orgName}`;

// The agent's answer to the first reply, with the event filled in.
export const agentReplyText = (s: AgentSponsor, event: AgentEvent, orgName: string) =>
  `${(s.seed?.agentReply ?? "")
    .replace("{EVENT}", event.name)
    .replace("{DATES}", event.dates)
    .replace("{VENUE}", event.venue)}\n\nSponsor AI Agent, on behalf of ${orgName}`;
