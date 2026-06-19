import type { ScrapedEvent } from "@/components/common/SchedulePreviewModal";

/**
 * The saved school returned by `GET /fanhub/schools/{id}?schedule=N`
 * (via the `proxyGetSchool` route). Only the fields the Setup Wizard reads when
 * rehydrating Steps 1–3 are typed here; the API returns more. All optional/nullable
 * because a freshly-created school may have most fields empty.
 */
export interface SavedSchool {
  id: string;

  // Step 1 — Organization & Team Info
  name: string | null;
  teamName: string | null;
  mascot: string | null;
  sportsType: string | null;
  season: string | null;
  overallRecord: string | null;
  level: string | null;
  organizationType: string | null;
  eventType: string | null;
  league: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  description: string | null;

  // Step 1 — Contact
  contactName: string | null;
  contactPosition: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;

  // Step 1 — Social
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;

  // Step 1 — Branding
  colors: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
  } | null;
  logoUrl: string | null;

  // Step 3 — Activation feature links. Most are `<key>Link`, but the backend remaps
  // two: buy-tickets → `gofanSchoolPage`, watch-game → `nfhsNetworkLink` (verified live).
  gofanSchoolPage: string | null; // buy-tickets
  nfhsNetworkLink: string | null; // watch-game
  partnerOffersLink: string | null;
  highlightsStatsLink: string | null;
  supportTeamLink: string | null;
  shoutOutWallLink: string | null;
  teamStoresLink: string | null;
  recordGameLink: string | null;
  scoreGameLink: string | null;
  predictLink: string | null;
  voteLink: string | null;
  arcadeLink: string | null;
  challengesQuestsLink: string | null;
  fanWallLink: string | null;
  chatLink: string | null;

  // Step 2 — Schedule
  scheduleEvents: ScrapedEvent[];
}
