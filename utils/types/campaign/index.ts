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
  // SchoolTeam id belonging to the signed-in org's school.
  teamId: string;
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
  teamId: string;
  // Set on game-day donation drives opened by the live scorekeeper flow; leave those alone.
  scheduleEventId: string | null;
  createdAt: string;
  daysLeft: number;
  progressPercent: number;
  // ENDED, CANCELLED, or an endDate in the past (an ACTIVE campaign can be past its end date).
  isEnded: boolean;
  team: { id: string; name: string; logoUrl: string | null } | null;
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
