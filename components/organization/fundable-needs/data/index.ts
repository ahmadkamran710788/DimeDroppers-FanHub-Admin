import {
  Building2,
  Bus,
  GraduationCap,
  HeartPulse,
  Shirt,
  Sprout,
  Star,
  Ticket,
  UserPlus,
  Video,
  type LucideIcon,
} from "lucide-react";
import type {
  CardTransaction,
  FundableNeed,
  MccSlug,
  NeedStatus,
  NeedType,
  VirtualCard,
} from "@/utils/types/fundable-need";

// Mock data for Fundable Needs and Virtual Cards until their API exists, plus the sums both pages show.

export interface NeedTypeInfo {
  name: NeedType;
  description: string;
  icon: LucideIcon;
}

// Sponsors browse needs by these types.
export const NEED_TYPES: NeedTypeInfo[] = [
  { name: "Participation", description: "Registration fees and entry costs so every player can play.", icon: UserPlus },
  { name: "Equipment and uniforms", description: "Balls, jerseys, shoes and gear.", icon: Shirt },
  { name: "Travel and transport", description: "Buses, fuel, hotels and meals on the road.", icon: Bus },
  { name: "Media and streaming", description: "Cameras, live streams and game film.", icon: Video },
  { name: "Facility and operations", description: "Court time, officials, scorekeepers and staffing.", icon: Building2 },
  { name: "Family access", description: "Tickets and passes so families can attend.", icon: Ticket },
  { name: "Development and education", description: "Clinics, coaching and academic support.", icon: GraduationCap },
  { name: "Health and wellness", description: "Trainers, first aid and recovery.", icon: HeartPulse },
  { name: "Experiential", description: "Awards nights, fan events and memorable moments.", icon: Star },
  { name: "Program sustainability", description: "Long-term costs that keep the program running.", icon: Sprout },
];

export const NEED_TYPE_OPTIONS = NEED_TYPES.map((t) => ({ label: t.name, value: t.name }));

export const MCC_CATEGORIES: Record<MccSlug, { label: string; code: string }> = {
  bus_lines: { label: "Bus lines", code: "4131" },
  hotels_motels_and_resorts: { label: "Hotels, motels and resorts", code: "7011" },
  airlines_air_carriers: { label: "Airlines", code: "4511" },
  sporting_goods_stores: { label: "Sporting goods stores", code: "5941" },
  sports_and_riding_apparel_stores: { label: "Sports apparel stores", code: "5655" },
  camera_and_photographic_supply_stores: { label: "Camera and photo supply stores", code: "5946" },
  electronics_stores: { label: "Electronics stores", code: "5732" },
  membership_organizations: { label: "Membership organizations", code: "8699" },
  recreation_services: { label: "Recreation services", code: "7999" },
  commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters: {
    label: "Athletic fields and sports facilities",
    code: "7941",
  },
  theatrical_ticket_agencies: { label: "Ticket agencies", code: "7922" },
  schools_and_educational_services: { label: "Schools and educational services", code: "8299" },
  medical_services: { label: "Medical services", code: "8099" },
  drug_stores_and_pharmacies: { label: "Drug stores and pharmacies", code: "5912" },
  eating_places_restaurants: { label: "Restaurants", code: "5812" },
  caterers: { label: "Caterers", code: "5811" },
  business_services: { label: "Business services", code: "7399" },
  service_stations: { label: "Gas stations", code: "5541" },
  fast_food_restaurants: { label: "Fast food restaurants", code: "5814" },
};

// The merchant categories offered for each type of need; a new need starts with the first two.
export const TYPE_MCC: Record<NeedType, MccSlug[]> = {
  Participation: [
    "membership_organizations",
    "recreation_services",
    "commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters",
  ],
  "Equipment and uniforms": ["sporting_goods_stores", "sports_and_riding_apparel_stores", "business_services"],
  "Travel and transport": [
    "bus_lines",
    "hotels_motels_and_resorts",
    "airlines_air_carriers",
    "service_stations",
    "eating_places_restaurants",
    "fast_food_restaurants",
  ],
  "Media and streaming": ["camera_and_photographic_supply_stores", "electronics_stores", "business_services"],
  "Facility and operations": [
    "commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters",
    "recreation_services",
    "business_services",
  ],
  "Family access": [
    "theatrical_ticket_agencies",
    "commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters",
  ],
  "Development and education": ["schools_and_educational_services", "membership_organizations", "business_services"],
  "Health and wellness": ["medical_services", "drug_stores_and_pharmacies", "sporting_goods_stores"],
  Experiential: ["eating_places_restaurants", "caterers", "recreation_services", "theatrical_ticket_agencies"],
  "Program sustainability": ["business_services", "membership_organizations", "schools_and_educational_services"],
};

export interface MockEvent {
  name: string;
  dates: string;
  teams: string[];
}

// The events (and their registered teams) a need can be for.
export const MOCK_EVENTS: MockEvent[] = [
  {
    name: "Jacksonville Fall Classic",
    dates: "Nov 13–15, 2026",
    teams: [
      "Jax Elite 17U Boys",
      "First Coast Flight 14U Girls",
      "Duval Dawgs 15U Boys",
      "River City Lady Hoops 12U Girls",
      "Bold City Ballers 10U Boys",
    ],
  },
  {
    name: "Holiday Hoops Showcase",
    dates: "Dec 18–20, 2026",
    teams: ["Jax Elite 17U Boys", "Coastal Storm 16U Girls", "Northside Knights 14U Boys"],
  },
  {
    name: "MLK Weekend Shootout",
    dates: "Jan 15–17, 2027",
    teams: ["First Coast Flight 14U Girls", "Duval Dawgs 15U Boys", "Gateway Gators 13U Boys", "Jax Elite 17U Boys"],
  },
  {
    name: "Spring Kickoff",
    dates: "Mar 5–7, 2027",
    teams: ["Jax Elite 17U Boys", "Bold City Ballers 10U Boys", "River City Lady Hoops 12U Girls", "Coastal Storm 16U Girls"],
  },
];

export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  open: "Awaiting sponsor",
  sponsored: "Sponsored",
};

export type NeedStatusFilter = "all" | NeedStatus;

export const NEED_STATUS_FILTERS: { label: string; value: NeedStatusFilter }[] = [
  { label: "All statuses", value: "all" },
  { label: NEED_STATUS_LABELS.open, value: "open" },
  { label: NEED_STATUS_LABELS.sponsored, value: "sponsored" },
];

// The part of a mock card number before its last four digits.
export const MOCK_CARD_PREFIX = "4000 0091 2847";

const NOT_ALLOWED = "merchant category not allowed";

function mockCard(last4: string, cvc: string, issuedOn: string, transactions: Omit<CardTransaction, "id">[]): VirtualCard {
  return {
    last4,
    number: `${MOCK_CARD_PREFIX} ${last4}`,
    exp: "09/29",
    cvc,
    issuedOn,
    frozen: false,
    transactions: transactions.map((t, i) => ({ id: `${last4}-${i}`, ...t })),
  };
}

export const SEED_NEEDS: FundableNeed[] = [
  {
    id: "need-1",
    type: "Travel and transport",
    title: "Bus and hotel for the 17U Boys at Nationals",
    covers: "Charter bus round trip and two hotel nights for 12 players and 3 coaches",
    why: "",
    event: "Spring Kickoff",
    team: "Jax Elite 17U Boys",
    mccs: ["bus_lines", "hotels_motels_and_resorts", "eating_places_restaurants"],
    merchant: "",
    contributions: [
      { sponsor: "First Coast Community Credit Union", amount: 1000, date: "2026-09-18" },
      { sponsor: "Southside Pizza Co.", amount: 500, date: "2026-10-02" },
    ],
    card: mockCard("7302", "204", "2026-09-12", [
      { date: "2026-10-04", merchant: "Coastal Charter Bus Co.", mcc: "bus_lines", amount: 800, approved: true },
      { date: "2026-10-09", merchant: "Shell", mcc: "service_stations", amount: 62.4, approved: false, declineReason: NOT_ALLOWED },
    ]),
  },
  {
    id: "need-2",
    type: "Equipment and uniforms",
    title: "New reversible uniforms for 14U Girls",
    covers: "15 reversible jerseys and shorts with sponsor logo",
    why: "",
    event: "Jacksonville Fall Classic",
    team: "First Coast Flight 14U Girls",
    mccs: ["sporting_goods_stores", "sports_and_riding_apparel_stores"],
    merchant: "",
    contributions: [{ sponsor: "Duval Sports Outfitters", amount: 2400, date: "2026-10-28" }],
    card: mockCard("4821", "318", "2026-09-20", [
      {
        date: "2026-10-30",
        merchant: "Teamwork Athletic Apparel",
        mcc: "sports_and_riding_apparel_stores",
        amount: 1650,
        approved: true,
      },
      { date: "2026-11-02", merchant: "Shell", mcc: "service_stations", amount: 48.5, approved: false, declineReason: NOT_ALLOWED },
      { date: "2026-11-03", merchant: "Big Box Sports", mcc: "sporting_goods_stores", amount: 220, approved: true },
    ]),
  },
  {
    id: "need-3",
    type: "Media and streaming",
    title: "Live stream camera kit for Court 2",
    covers: "Camera, tripod and streaming encoder",
    why: "",
    event: "Jacksonville Fall Classic",
    team: "",
    mccs: ["camera_and_photographic_supply_stores", "electronics_stores"],
    merchant: "",
    contributions: [],
    card: mockCard("1957", "771", "2026-10-01", []),
  },
  {
    id: "need-4",
    type: "Participation",
    title: "Registration scholarships",
    covers: "Tournament entry fees for 20 players from families who can’t pay",
    why: "",
    event: "Holiday Hoops Showcase",
    team: "",
    mccs: ["membership_organizations"],
    merchant: "",
    contributions: [{ sponsor: "St. Johns Rotary Club", amount: 900, date: "2026-10-12" }],
    card: mockCard("6640", "512", "2026-09-05", [
      { date: "2026-10-15", merchant: "AAU Basketball Registration", mcc: "membership_organizations", amount: 450, approved: true },
      { date: "2026-10-18", merchant: "Chick-fil-A", mcc: "fast_food_restaurants", amount: 86.2, approved: false, declineReason: NOT_ALLOWED },
    ]),
  },
  {
    id: "need-5",
    type: "Facility and operations",
    title: "Court rental for the Holiday Hoops Showcase",
    covers: "Three days of court time and setup at River City Fieldhouse",
    why: "",
    event: "Holiday Hoops Showcase",
    team: "",
    mccs: ["commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters", "recreation_services"],
    merchant: "",
    contributions: [{ sponsor: "Atlantic Realty Partners", amount: 2000, date: "2026-09-25" }],
    card: mockCard("3318", "945", "2026-08-28", [
      {
        date: "2026-10-01",
        merchant: "River City Fieldhouse",
        mcc: "commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters",
        amount: 1200,
        approved: true,
      },
      {
        date: "2026-10-22",
        merchant: "River City Fieldhouse",
        mcc: "commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters",
        amount: 900,
        approved: false,
        declineReason: "insufficient balance",
      },
    ]),
  },
  {
    id: "need-6",
    type: "Family access",
    title: "Family weekend passes",
    covers: "100 family passes for the MLK Weekend Shootout",
    why: "",
    event: "MLK Weekend Shootout",
    team: "",
    mccs: ["theatrical_ticket_agencies"],
    merchant: "",
    contributions: [{ sponsor: "Southside Pizza Co.", amount: 300, date: "2026-10-20" }],
    card: mockCard("5084", "163", "2026-10-10", []),
  },
  {
    id: "need-7",
    type: "Development and education",
    title: "Coaching clinic at the MLK Weekend Shootout",
    covers: "Guest clinician and materials for a one-day clinic during the event",
    why: "",
    event: "MLK Weekend Shootout",
    team: "",
    mccs: ["schools_and_educational_services", "business_services"],
    merchant: "",
    contributions: [],
    card: mockCard("2276", "690", "2026-10-14", []),
  },
  {
    id: "need-8",
    type: "Health and wellness",
    title: "Athletic trainer on site",
    covers: "Certified trainer and first aid supplies for all tournament days",
    why: "",
    event: "Jacksonville Fall Classic",
    team: "",
    mccs: ["medical_services", "drug_stores_and_pharmacies"],
    merchant: "",
    contributions: [{ sponsor: "Bayside Family Dental", amount: 1000, date: "2026-10-03" }],
    card: mockCard("9413", "237", "2026-09-30", [
      { date: "2026-10-25", merchant: "CVS Pharmacy", mcc: "drug_stores_and_pharmacies", amount: 184.75, approved: true },
    ]),
  },
];

// What sponsors have loaded onto the need's card.
export const raisedOf = (need: FundableNeed) => need.contributions.reduce((sum, c) => sum + c.amount, 0);

// Approved purchases only; a declined one never left the card.
export const spentOf = (card: VirtualCard) =>
  card.transactions.filter((t) => t.approved).reduce((sum, t) => sum + t.amount, 0);

export const availableOf = (need: FundableNeed) => raisedOf(need) - spentOf(need.card);

export const statusOf = (need: FundableNeed): NeedStatus => (need.contributions.length ? "sponsored" : "open");

// "Jax Elite 17U Boys · Spring Kickoff", or "Whole event · …" without a team.
export const forLabel = ({ team, event }: Pick<FundableNeed, "team" | "event">) => `${team || "Whole event"} · ${event}`;

export const mccLabel = (slug: MccSlug) => MCC_CATEGORIES[slug].label;

// The allowed categories in a sentence, with the merchant lock when there is one.
export const allowedLabel = ({ mccs, merchant }: Pick<FundableNeed, "mccs" | "merchant">) =>
  mccs.map(mccLabel).join(", ") + (merchant.trim() ? ` · only at ${merchant.trim()}` : "");
