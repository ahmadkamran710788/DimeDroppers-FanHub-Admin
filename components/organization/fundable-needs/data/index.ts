import {
  BedDouble,
  Building2,
  Bus,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Shirt,
  Sprout,
  Star,
  Ticket,
  UserPlus,
  Video,
  type LucideIcon,
} from "lucide-react";
import { formatInstantDate, formatShortDate } from "@/utils/helper";
import { placeLabel } from "@/utils/needs";
import type {
  BrandDisplay,
  ContributionStatus,
  Need,
  NeedCard,
  NeedEventOption,
  NeedStatus,
} from "@/utils/types/needs";

// Organisation Fundable Needs and Virtual Cards: labels and look for what the API sends
// (docs/endpoints/FANHUB_FUNDABLE_NEEDS_FRONTEND.md §4).

// Shown on the parts of the design the API doesn't support yet (they stay visible, disabled).
export const COMING_SOON = "Coming soon";

export const NEEDS_PAGE_SIZE = 20;
export const CARDS_PAGE_SIZE = 20;

// The API's text limits for a need.
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const WHY_MAX = 2000;

// A category's icon and a line on what it pays for. The categories (and their codes) come from
// GET /options, so they're matched by name; one the list doesn't know gets a generic look.
const LOOKS: { match: RegExp; icon: LucideIcon; description: string }[] = [
  { match: /travel|transport/i, icon: Bus, description: "Buses, fuel, flights, hotels and meals on the road." },
  { match: /lodging|hotel/i, icon: BedDouble, description: "Hotel rooms and places to stay for away games." },
  { match: /equipment|uniform/i, icon: Shirt, description: "Balls, jerseys, shoes and gear." },
  { match: /media|stream/i, icon: Video, description: "Cameras, live streams and game film." },
  { match: /facilit|operation/i, icon: Building2, description: "Court time, officials, scorekeepers and staffing." },
  { match: /development|education/i, icon: GraduationCap, description: "Clinics, coaching and academic support." },
  { match: /health|wellness/i, icon: HeartPulse, description: "Trainers, first aid and recovery." },
  { match: /participation|registration/i, icon: UserPlus, description: "Registration fees and entry costs so every player can play." },
  { match: /family|access/i, icon: Ticket, description: "Tickets and passes so families can attend." },
  { match: /experien/i, icon: Star, description: "Awards nights, fan events and memorable moments." },
  { match: /sustainab/i, icon: Sprout, description: "Long-term costs that keep the program running." },
];

export function categoryLook(name: string): { icon: LucideIcon; description: string } {
  const look = LOOKS.find((l) => l.match.test(name));
  return look ? { icon: look.icon, description: look.description } : { icon: HandHeart, description: "" };
}

// The status filter: "" = every status.
export const NEED_STATUS_FILTERS: { value: NeedStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "FUNDED", label: "Sponsored" },
  { value: "ENDED", label: "Ended, settling" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

// A need's status pill: an open need with nothing raised yet is "Awaiting sponsor".
export function needStatusPill(need: Need): { label: string; color: string } {
  switch (need.status) {
    case "OPEN":
      return need.money.raisedCents > 0
        ? { label: "Open", color: "bg-[#8EA8FF]" }
        : { label: "Awaiting sponsor", color: "bg-[#FFC857]" };
    case "FUNDED":
      return { label: "Sponsored", color: "bg-success" };
    case "ENDED":
      return { label: "Ended, settling", color: "bg-[#F5B97A]" };
    case "CLOSED":
      return { label: "Closed", color: "bg-white/60" };
    case "CANCELLED":
      return { label: "Cancelled", color: "bg-[#FF9A9D]" };
  }
}

// A card's state: "Active" only when it works now (readyToSpend).
export function cardState(card: NeedCard): { label: string; color: string } {
  if (card.readyToSpend) return { label: "Active", color: "bg-success" };
  if (card.frozen) return { label: "Frozen", color: "bg-sky-300" };
  if (card.status === "PENDING" || card.status === "FAILED") return { label: "Being set up", color: "bg-[#FFC857]" };
  return { label: "Inactive", color: "bg-white/60" };
}

// Still being set up (Stripe Issuing isn't live yet, or set-up failed and is retried).
export const cardBeingSetUp = (card: NeedCard) => card.status === "PENDING" || card.status === "FAILED";

// "Nov 7 – Dec 13, 2026" from an event's calendar dates.
function eventDates(event: { startDate: string | null; endDate: string | null }) {
  const start = event.startDate ? formatShortDate(event.startDate) : "";
  const end = event.endDate ? formatShortDate(event.endDate) : "";
  return start && end && start !== end ? `${start} – ${end}` : start || end;
}

// An event in the form's dropdown: "Jax session #4 · Nov 7 – Dec 13, 2026 · Jacksonville, FL".
export const eventOptionLabel = (event: NeedEventOption) =>
  [event.name || "Unnamed event", eventDates(event), placeLabel(event.city, event.state)].filter(Boolean).join(" · ");

// A game: its title, else "vs <opponent>".
export const gameTitle = (game: { title: string | null; opponent: string | null }) =>
  game.title || (game.opponent ? `vs ${game.opponent}` : "Game");

// "Fri, Nov 14, 7:00 PM" in the viewer's time zone.
export const gameTime = (utcTime: string | null) =>
  utcTime
    ? new Date(utcTime).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time to be set";

// Who a need is for: "Jax Elite 17U Boys · Spring Kickoff" (tournament), the team or "All teams" (school), or
// the game for an older school need.
export function forLabel(need: Pick<Need, "scope" | "team" | "event" | "game">): string {
  if (need.scope === "SCHOOL") return need.team?.name ?? "All teams";
  const target = need.event
    ? need.event.name || "Event"
    : need.game
      ? `${gameTitle(need.game)} · ${gameTime(need.game.utcTime)}`
      : "";
  return [need.team?.name ?? (need.event ? "Whole event" : ""), target].filter(Boolean).join(" · ");
}

// "Bus lines, Hotels, motels and resorts, Restaurants".
export const allowedLabel = (categories: { label: string }[]) => categories.map((c) => c.label).join(", ");

// "Ends Dec 13, 2026" in the viewer's time zone.
export const endsLabel = (need: Pick<Need, "endsAt" | "status">) =>
  `${need.status === "OPEN" || need.status === "FUNDED" ? "Ends" : "Ended"} ${formatInstantDate(need.endsAt)}`;

export const CONTRIBUTION_STATUS: Record<ContributionStatus, { label: string; color: string }> = {
  PAID: { label: "Paid", color: "text-success" },
  PROCESSING: { label: "Processing", color: "text-[#8EA8FF]" },
  PENDING: { label: "Payment started", color: "text-white/60" },
  FAILED: { label: "Failed", color: "text-error" },
};

export const BRAND_DISPLAY_LABEL: Record<BrandDisplay, string> = {
  LOGO_FULL_COLOR: "Logo · full color",
  LOGO_ONE_COLOR: "Logo · one color",
  NAME_ONLY: "Name only",
};
