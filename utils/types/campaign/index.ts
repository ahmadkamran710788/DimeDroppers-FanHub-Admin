// Fundraising campaign — POST /fanhub/org/campaigns request body.
export interface CreateCampaignPayload {
  title: string;
  description?: string;
  goalAmount: number;
  // ISO timestamp, e.g. "2026-11-30T23:59:59.000Z".
  endDate: string;
  sponsorName?: string;
  // SchoolTeam id belonging to the signed-in org's school.
  teamId: string;
}
