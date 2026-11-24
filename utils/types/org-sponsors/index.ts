// GET /fanhub/org/sponsor-packages/sponsors: the sponsors shown on the organisation (fields the panel uses).

// Where a sponsor's logo belongs: HEADER ("Presented by …"), the game screens per phase, cards, the strip.
export type SponsorPlacement = "HEADER" | "ENGAGEMENT" | "GAME_PRE" | "GAME_LIVE" | "GAME_POST" | "SPONSOR_STRIP";

// A sponsor's logo set: the landscape logo, a white one for dark backgrounds, a small badge, and the text
// shown before it (e.g. "Presented by"). Links are stable API URLs (versioned with ?v=), not signed ones.
export interface SponsorLogos {
  // Which logo the sponsor chose as its main one in Brand Assets (missing on servers before 24 Nov 2026).
  mainLogo?: "LANDSCAPE" | "CIRCULAR";
  // The logo to draw where a screen shows one: the circular one when that's the main logo (and uploaded),
  // else the landscape one; null with no logo at all.
  mainLogoUrl?: string | null;
  // The landscape logo.
  logoUrl: string | null;
  // Usually null when the main logo is circular (no white version is made for it).
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
  // The games this order (a part of a package) is shown at. Empty for physical assets and whole-package
  // orders, which count for every game.
  games?: SponsorGame[];
}

// A game a sponsor is shown at (`SchoolScheduleEvent`).
export interface SponsorGame {
  id: string | null;
  startsAt: string | null;
  title: string | null;
}

export interface OrgSponsor {
  sponsorId: string;
  name: string;
  // Same as logos.logoUrl (the landscape logo).
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
  // The game asked for with `gameId`, else null.
  game?: SponsorGame | null;
  summary: { visibleSponsors: number; pendingPayment: number; endingSoon: number };
  // Presenting Partner first, then by tier, then who bought first.
  sponsors: OrgSponsor[];
}
