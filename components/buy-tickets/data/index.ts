// Ticket campaign shown on the Buy Tickets page. There is no campaigns endpoint yet, so the
// campaign itself is demo data; its schedules are the real games from the Schedule API.
// Replace DEMO_CAMPAIGN with an API call once the backend exposes campaigns.

export type CampaignStatus = "Active" | "Draft" | "Ended";

export interface TicketCampaign {
  id: string;
  name: string;
  provider: string;
  season: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
}

export const DEMO_CAMPAIGN: TicketCampaign = {
  id: "campaign-1",
  name: "2026 Season Tickets",
  provider: "GoFan",
  season: "Winter 25-26",
  startDate: "2026-01-05",
  endDate: "2026-03-15",
  status: "Active",
};

export const CAMPAIGN_STATUS_COLOR: Record<CampaignStatus, string> = {
  Active: "bg-success",
  Draft: "bg-white/30",
  Ended: "bg-white/30",
};

export const HOME_AWAY_LABEL: Record<"home" | "away" | "neutral", string> = {
  home: "Home",
  away: "Away",
  neutral: "Neutral",
};

// Same colour language as the Schedule page legend.
export const HOME_AWAY_COLOR: Record<"home" | "away" | "neutral", string> = {
  home: "bg-green-400",
  away: "bg-violet-500",
  neutral: "bg-teal-400",
};
