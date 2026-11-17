// GET /fanhub/org/sponsor-packages/sponsors: the sponsors shown on the organisation (fields the panel uses).

// Where a sponsor's logo belongs: HEADER ("Presented by …"), the game screens per phase, cards, the strip.
export type SponsorPlacement = "HEADER" | "ENGAGEMENT" | "GAME_PRE" | "GAME_LIVE" | "GAME_POST" | "SPONSOR_STRIP";

export interface OrgSponsor {
  sponsorId: string;
  name: string;
  // Signed link, valid 1 hour from the call.
  logoUrl: string | null;
  tier: "PRESENTING_PARTNER" | "FAN_ENGAGEMENT_PARTNER" | "COMMUNITY_PARTNER" | null;
  tierLabel: string;
  visibleToFans: boolean;
  // Empty for a sponsor no fan can see right now. In this fixed order.
  placements: SponsorPlacement[];
  endsAt: string | null;
}

export interface OrgSponsors {
  event: { id: string; name: string | null } | null;
  summary: { visibleSponsors: number; pendingPayment: number; endingSoon: number };
  // Presenting Partner first, then by tier, then who bought first.
  sponsors: OrgSponsor[];
}
