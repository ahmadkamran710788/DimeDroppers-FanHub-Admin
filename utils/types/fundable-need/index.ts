// Fundable Needs and their Stripe virtual cards. There is no API yet: these shape the mock data
// (components/organization/fundable-needs/data) and the FundableNeeds context. Merchant categories use
// Stripe Issuing's category slugs, so the API can slot in.

export type NeedType =
  | "Participation"
  | "Equipment and uniforms"
  | "Travel and transport"
  | "Media and streaming"
  | "Facility and operations"
  | "Family access"
  | "Development and education"
  | "Health and wellness"
  | "Experiential"
  | "Program sustainability";

// Stripe Issuing merchant category (MCC) slugs a need's card can be allowed to spend in.
export type MccSlug =
  | "bus_lines"
  | "hotels_motels_and_resorts"
  | "airlines_air_carriers"
  | "sporting_goods_stores"
  | "sports_and_riding_apparel_stores"
  | "camera_and_photographic_supply_stores"
  | "electronics_stores"
  | "membership_organizations"
  | "recreation_services"
  | "commercial_sports_professional_sports_clubs_athletic_fields_and_sports_promoters"
  | "theatrical_ticket_agencies"
  | "schools_and_educational_services"
  | "medical_services"
  | "drug_stores_and_pharmacies"
  | "eating_places_restaurants"
  | "caterers"
  | "business_services"
  | "service_stations"
  | "fast_food_restaurants";

// "open": no sponsor yet. "sponsored": at least one sponsor has funded it.
export type NeedStatus = "open" | "sponsored";

// One sponsor's funding of a need; it loads onto the need's card. `date` is yyyy-mm-dd.
export interface Contribution {
  sponsor: string;
  amount: number;
  date: string;
}

// A purchase attempt on a card. A declined one carries why (e.g. "merchant category not allowed").
export interface CardTransaction {
  id: string;
  date: string;
  merchant: string;
  mcc: MccSlug;
  amount: number;
  approved: boolean;
  declineReason?: string;
}

export interface VirtualCard {
  last4: string;
  // Mock only: a real card's number, expiry and CVC are revealed through Stripe Issuing Elements.
  number: string;
  // MM/YY.
  exp: string;
  cvc: string;
  // yyyy-mm-dd.
  issuedOn: string;
  frozen: boolean;
  transactions: CardTransaction[];
}

export interface FundableNeed {
  id: string;
  type: NeedType;
  title: string;
  // What the money pays for.
  covers: string;
  // Why it matters; "" when not given.
  why: string;
  // The event's name.
  event: string;
  // The team's name; "" for the whole event.
  team: string;
  // The merchant categories its card may spend in.
  mccs: MccSlug[];
  // The one merchant the card is locked to; "" for any merchant in the allowed categories.
  merchant: string;
  contributions: Contribution[];
  card: VirtualCard;
}

// What the create / edit form saves; funding and the card stay with the need.
export type NeedInput = Pick<FundableNeed, "type" | "title" | "covers" | "why" | "event" | "team" | "mccs" | "merchant">;

// The form while it's being filled in: the type isn't picked yet ("").
export type NeedDraft = Omit<NeedInput, "type"> & { type: NeedType | "" };
