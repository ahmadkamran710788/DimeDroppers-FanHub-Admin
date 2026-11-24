// GET /fanhub/org/sponsor-packages/sponsors: the sponsors shown on the organisation (fields the panel uses).

// Where a sponsor's logo belongs: HEADER ("Presented by …"), the game screens per phase, cards, the strip.
export type SponsorPlacement = "HEADER" | "ENGAGEMENT" | "GAME_PRE" | "GAME_LIVE" | "GAME_POST" | "SPONSOR_STRIP";

// A sponsor's logo set: the landscape logo, a white one for dark backgrounds, the round badge (the circular logo,
// else the icon; Partner Offers), and the text shown before it (e.g. "Presented by"). Links are stable API URLs
// (versioned with ?v=), not signed ones.
export interface SponsorLogos {
  logoUrl: string | null;
  logoWhiteUrl: string | null;
  badgeUrl: string | null;
  label: string | null;
}

// One placement a package bought, e.g. PREDICTIONS (on screen, with its own logos) or BANNER_FENCE
// (a physical asset: logos is null).
export interface SponsorSlot {
  catalogKey: string;
  name: string;
  category: string;
  logos: SponsorLogos | null;
}

// An order the sponsor placed with the organisation (fields the panel uses).
export interface SponsorPackage {
  orderId: string;
  packageName: string;
  status: string;
  visibleToFans: boolean;
  endsAt: string | null;
  slots: SponsorSlot[];
}

export interface OrgSponsor {
  sponsorId: string;
  name: string;
  // Same as logos.logoUrl.
  logoUrl: string | null;
  logos: SponsorLogos | null;
  tier: "PRESENTING_PARTNER" | "FAN_ENGAGEMENT_PARTNER" | "COMMUNITY_PARTNER" | null;
  tierLabel: string;
  visibleToFans: boolean;
  // Empty for a sponsor no fan can see right now. In this fixed order.
  placements: SponsorPlacement[];
  packages?: SponsorPackage[];
}

export interface OrgSponsors {
  event: { id: string; name: string | null } | null;
  summary: { visibleSponsors: number; pendingPayment: number; endingSoon: number };
  // Presenting Partner first, then by tier, then who bought first.
  sponsors: OrgSponsor[];
}
