// Fundraising campaigns — /fanhub/org/campaigns.

// DRAFT is only seen by the organisation; CANCELLED is a deleted non-draft kept for its donations.
export type CampaignStatus = "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";

// POST /fanhub/org/campaigns request body.
export interface CreateCampaignPayload {
  title: string;
  description?: string;
  goalAmount: number;
  // ISO timestamp, e.g. "2026-11-30T23:59:59.000Z".
  endDate: string;
  sponsorName?: string;
  // School: the SchoolTeam id (required). A tournament leaves it out.
  teamId?: string;
  // Tournament: the game (required) and its home or away team (defaults to home).
  scheduleEventId?: string;
  fanHubTeamId?: string;
  // Tournament team campaign (POST /campaigns/tournament): the event the team plays in.
  eventId?: string;
  // Defaults to ACTIVE, which pushes "New fundraiser" to the school's followers.
  status?: "DRAFT" | "ACTIVE";
}

// PATCH /fanhub/org/campaigns/{id}: any field; null clears description / sponsorName.
export interface UpdateCampaignPayload {
  title?: string;
  description?: string | null;
  goalAmount?: number;
  endDate?: string;
  sponsorName?: string | null;
  teamId?: string;
  status?: "DRAFT" | "ACTIVE" | "ENDED";
}

// One campaign as the list, GET /{id}, POST and PATCH return it.
export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  // Dollars.
  goalAmount: number;
  currentAmount: number;
  donationCount: number;
  endDate: string;
  status: CampaignStatus;
  sponsorName: string | null;
  // null on a tournament campaign (it has fanHubTeamId instead).
  teamId: string | null;
  // A tournament campaign's team (home or away of its game).
  fanHubTeamId?: string | null;
  // The game: a tournament campaign's, or a school game-day drive opened by the live scorekeeper flow.
  scheduleEventId: string | null;
  createdAt: string;
  daysLeft: number;
  progressPercent: number;
  // ENDED, CANCELLED, or an endDate in the past (an ACTIVE campaign can be past its end date).
  isEnded: boolean;
  team: { id: string; name: string; logoUrl: string | null } | null;
  // A tournament campaign's team, its division and event.
  tournamentTeam?: TournamentTeamRef | null;
}

export interface TournamentTeamRef {
  id: string;
  name: string;
  division: { id: string; name: string | null } | null;
  event: { id: string; name: string | null; city: string | null; state: string | null };
}

// GET /fanhub/org/campaigns/tournament/events/{eventId}/teams (data[0]): the event's teams to raise for.
export interface TournamentCampaignTeam {
  // The team's fanHubTeamId (the same id as on the event's games).
  id: string;
  name: string;
  pool: string | null;
  grade: string | null;
  age: string | null;
  division: { id: string; name: string | null } | null;
  campaignCount: number;
  activeCampaignCount: number;
}

export interface TournamentCampaignTeams {
  event: { id: string; name: string | null; city: string | null; state: string | null; startDate: string | null; endDate: string | null };
  total: number;
  items: TournamentCampaignTeam[];
}

// GET /fanhub/org/campaigns/tournament/events/{eventId}/team-donations (data[0]). Paid totals.
export interface TeamDonationCampaign extends Campaign, EventDonationTotals {
  // TEAM: no game; GAME: for one of the team's games.
  kind: "TEAM" | "GAME";
}

export interface TournamentTeamDonations extends TournamentCampaignTeam, EventDonationTotals {
  goalAmount: number;
  campaigns: TeamDonationCampaign[];
}

export interface TournamentTeamDonationsResponse {
  event: TournamentCampaignTeams["event"];
  summary: EventDonationTotals & {
    teams: number;
    teamsWithCampaigns: number;
    campaigns: number;
    activeCampaigns: number;
    goalAmount: number;
  };
  items: TournamentTeamDonations[];
}

// ---- GET /fanhub/org/donations/events/{eventId} (tournament). Amounts sum PAID donations. ----

export interface EventDonationTotals {
  totalRaised: number;
  totalNet: number;
  donationCount: number;
}

export interface EventDonationGame {
  id: string;
  title: string | null;
  start: string | null;
  utcTime: string | null;
  location: string | null;
  result: string | null;
  matchStatus: string | null;
  home: { id: string | null; name: string | null } | null;
  away: { id: string | null; name: string | null } | null;
}

export interface EventDonationItem {
  id: string;
  amount: number;
  netAmount: number;
  side: "HOME" | "AWAY";
  opponentName: string | null;
  message: string | null;
  // "Anonymous" when the donor asked for it.
  donor: string;
  createdAt: string;
  campaign: { id: string; title: string; scheduleEventId: string | null; tournamentTeam: { id: string; name: string } | null } | null;
}

export interface OrgEventDonations {
  event: { id: string; schoolId: string; name: string | null; startDate: string | null; endDate: string | null; city: string | null; state: string | null };
  summary: EventDonationTotals & {
    gamesInEvent: number;
    gamesWithCampaigns: number;
    teamsWithCampaigns: number;
    campaigns: number;
    goalAmount: number;
    donorCount: number;
  };
  games: (EventDonationTotals & { game: EventDonationGame; campaigns: (Campaign & EventDonationTotals)[] })[];
  // Campaigns tied to a team but no single game.
  teams: (EventDonationTotals & {
    team: { id: string; name: string; division: { id: string; name: string | null } | null };
    campaigns: (Campaign & EventDonationTotals)[];
  })[];
  donations: {
    items: EventDonationItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
  };
}

// GET /fanhub/org/campaigns (data[0]). `summary` covers the whole organisation, not the filter.
export interface CampaignListPage {
  items: Campaign[];
  pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
  summary: { totalRaised: number; activeCount: number; draftCount: number; endedCount: number; cancelledCount: number };
}

// GET /fanhub/org/campaigns/stats (data[0]). Amounts sum paid donations.
export interface CampaignStats {
  totalRaised: number;
  totalNet: number;
  totalDonations: number;
  donors: number;
  averageDonation: number;
  last30Days: { raised: number; donations: number };
  campaigns: { total: number; active: number; draft: number; ended: number; cancelled: number };
  activeCampaigns: { goalTotal: number; raised: number; progressPercent: number };
}

// One team of GET /fanhub/org/donations/by-team (data[0].teams). Amounts sum paid donations.
export interface TeamDonations {
  team: { id: string; name: string; logoUrl: string | null };
  totalRaised: number;
  totalNet: number;
  donationCount: number;
}
