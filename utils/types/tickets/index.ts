// Buy Tickets — /fanhub/org/tickets (FANHUB_TICKETS_ADMIN.md, 16 Oct 2026). A ticket campaign is a
// title ("2026 Season Tickets") with ticket types (General Admission, Student…), attached to games.
// A game sells through one campaign at a time.

export type TicketCampaignStatus = "ACTIVE" | "INACTIVE" | "ENDED";

// ON_SALE: in an ACTIVE campaign and not started; NOT_ON_SALE: no campaign or not active;
// ENDED: the game started or is past.
export type GameTicketStatus = "ON_SALE" | "NOT_ON_SALE" | "ENDED";

export interface TicketGame {
  id: string;
  title: string;
  opponent: string | null;
  // The event's local wall-clock time written with a "Z"; compare times with utcTime.
  start: string;
  utcTime: string;
}

// One sellable ticket of a campaign, on sale for every attached game with its own stock per game.
export interface TicketType {
  id: string;
  title: string;
  description: string | null;
  // Dollars.
  price: number;
  quantityPerGame: number;
  sortOrder: number;
}

export interface TicketCampaign {
  id: string;
  title: string;
  status: TicketCampaignStatus;
  // A tournament campaign's event (null for a school campaign).
  event?: { id: string; name: string } | null;
  ticketTypes: TicketType[];
  gamesCount: number;
  games: TicketGame[];
  sales: { ticketsSold: number; grossSales: number; ticketsScanned: number };
  createdAt: string;
}

// GET /overview (data[0]): the four cards.
export interface TicketOverview {
  cards: {
    // Distinct games attached to any campaign.
    scheduledGames: number;
    // Of those, in an ACTIVE campaign and not started yet (tickets on sale).
    upcomingGames: number;
    homeGames: { value: number; awayOrNeutral: number };
    // The school's GoFan page, or null ("Not set").
    ticketLink: string | null;
  };
  // The response also carries `campaigns`; the page reads them from GET /tickets/campaigns instead.
}

// A ticket type on one game, with that game's stock.
export interface GameTicketType extends TicketType {
  sold: number;
  // Reserved by checkouts started in the last 15 minutes that haven't paid yet.
  held: number;
  available: number;
}

// One row of GET /games.
export interface TicketScheduleGame extends TicketGame {
  matchup: string;
  opponentLogoUrl: string | null;
  timezone: string | null;
  homeAway: "home" | "away" | "neutral" | null;
  location: string | null;
  level: string | null;
  gender: string | null;
  sports: string | null;
  status: string;
  ticketStatus: GameTicketStatus;
  // The campaign the game sells through, or null.
  campaign: { id: string; title: string; status: TicketCampaignStatus } | null;
  ticketTypes: GameTicketType[];
}

export interface TicketGamesPage {
  items: TicketScheduleGame[];
  pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
}

// One "+ Add" block of the dialog. With an `id` it updates that type; without one it adds a type.
export interface TicketTypeInput {
  id?: string;
  title: string;
  description?: string;
  price: number;
  quantityPerGame: number;
}

// POST /campaigns body.
export interface TicketCampaignInput {
  title: string;
  ticketTypes: TicketTypeInput[];
  // May be empty and attached later.
  scheduleEventIds: string[];
}

// PATCH /campaigns/{id}: any field. `ticketTypes` is the whole set as the Edit dialog shows it;
// a type missing from it is retired (hidden from fans, tickets already sold stay valid).
export interface TicketCampaignPatch {
  title?: string;
  status?: TicketCampaignStatus;
  ticketTypes?: TicketTypeInput[];
}

// PENDING: checkout started; CANCELLED: not paid within 15 minutes, or cancelled.
export type TicketOrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

// One line of an order: a ticket type for one game, as it was when bought.
export interface TicketOrderLine {
  id: string;
  ticketTypeId: string;
  titleSnapshot: string;
  unitPrice: number;
  quantity: number;
  scheduleEvent: TicketGame | null;
}

// One row of GET /orders, newest first. Dollars; total = subtotal − dimesDiscount.
export interface TicketOrder {
  id: string;
  campaignId: string | null;
  campaignTitle: string | null;
  holderName: string | null;
  holderEmail: string | null;
  subtotal: number;
  // 100 Dimes = $1.
  dimesApplied: number;
  dimesDiscount: number;
  total: number;
  status: TicketOrderStatus;
  paidAt: string | null;
  createdAt: string;
  ticketsIssued: number;
  lines: TicketOrderLine[];
}

export interface TicketOrdersPage {
  items: TicketOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number; isLast: boolean };
}

// GET /games/{scheduleEventId}/attendance (data[0]): tickets sold vs scanned at the gate.
export interface TicketAttendance {
  game: TicketGame;
  sold: number;
  scanned: number;
  byTicketType: { ticketTypeId: string; title: string; sold: number; scanned: number; voided: number }[];
}
