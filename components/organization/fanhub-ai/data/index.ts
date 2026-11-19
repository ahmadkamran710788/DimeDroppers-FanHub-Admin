import type { AgentArea, MessageState } from "@/utils/types/organiser-agent";

// The API sends only the area codes; labels and what each covers come from FANHUB_ORGANISER_AGENT_FRONTEND.md §8.
// CONTEXT is the organization profile (the overview tools sit under OPERATIONS).
export const AREAS: Record<AgentArea, { label: string; hint: string }> = {
  CONTEXT: { label: "Organization profile", hint: "Name, description, contact, address, colors and links" },
  SCHEDULE: { label: "Schedules & games", hint: "Add, move, reschedule, cancel or delete games" },
  SCORE: { label: "Scores", hint: "Game scores" },
  ROSTER: { label: "Teams, sports & players", hint: "Teams, sports, players, coaches and role requests" },
  FUNDRAISING: { label: "Donation campaigns", hint: "Create, change, publish, end or cancel campaigns" },
  TICKETS: { label: "Tickets", hint: "Ticket campaigns, ticket types and games on sale" },
  ENGAGEMENT: { label: "Predictions, votes & challenges", hint: "Open, change or take down fan engagement" },
  MESSAGING: { label: "Messages", hint: "Direct and group messages to your teams’ people" },
  COMMERCIAL: { label: "Activations & sponsors", hint: "Look up your activation inventory and sponsors" },
  TOURNAMENT: { label: "Events & divisions", hint: "Events, divisions, venues, event games and documents" },
  OPERATIONS: { label: "Scorekeepers & videographers", hint: "Officials, pools, requests, overview and live games" },
};

// Shown in an empty chat; the same quick picks the agent offers when it can't work a request out.
export const STARTER_PROMPTS = ["Upcoming games", "Add a team", "Move a game", "Invite a coach", "Donation campaigns"];

// The API's limit on one message.
export const MESSAGE_MAX_CHARS = 1000;

// Without the socket, the open thread is checked this often while a reply is due…
export const POLL_MS = 3_000;
// …and a reply that hasn't come by then is reported as late (the doc's 60 seconds).
export const REPLY_WAIT_MS = 60_000;
// A slow change stores a "working on it" reply and adds its result later without a socket message, so the
// thread is checked for this long after such a reply.
export const PENDING_REPLY_WAIT_MS = 120_000;

// Each message carries a fresh id, so a resend is never run twice. crypto.randomUUID only exists in secure
// contexts (https or localhost).
export const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ??
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16)
  );

export const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

// How a reply ended, for the thread list and under a reply that didn't go through.
export const STATE_STYLE: Record<MessageState, { label: string; color: string; text: string }> = {
  COMPLETED: { label: "Done", color: "bg-[#1d3a1e]", text: "text-[#a3e3a5]" },
  NEEDS_INPUT: { label: "Needs you", color: "bg-[#2a2148]", text: "text-[#d9ccff]" },
  PENDING: { label: "Working", color: "bg-white/10", text: "text-white/80" },
  BLOCKED: { label: "Not allowed", color: "bg-[#3d2a12]", text: "text-[#ffc999]" },
  FAILED: { label: "Failed", color: "bg-[#3d1717]", text: "text-[#ff9c9c]" },
  AWAITING_APPROVAL: { label: "Awaiting approval", color: "bg-white/10", text: "text-white/80" },
};

// Field names the plain split reads badly.
const FIELD_LABELS: Record<string, string> = {
  homeAway: "Home / away",
  startAt: "Start",
  endAt: "End",
  endsAt: "Ends",
  colors: "Colors",
};

// "periodDurationSeconds" → "Period duration seconds", "home_team" → "Home team".
export const fieldLabel = (key: string) => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const words = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : key;
};

const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Game times are stored as the venue's wall-clock time (with a misleading trailing Z), so a date-time is
// shown as written, never shifted into the browser's timezone.
function formatDateText(text: string): string | null {
  const dateTime = ISO_DATE_TIME.exec(text);
  const date = dateTime ?? ISO_DATE.exec(text);
  if (!date) return null;
  const [, y, mo, d, h = "0", mi = "0"] = date;
  const at = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (Number.isNaN(at.getTime())) return null;
  const day = at.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(at.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
  return dateTime ? `${day}, ${at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : day;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// One value of a card as text: dates readable, lists joined, a nested record by its name or its fields.
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (typeof value === "string") return formatDateText(value) ?? value;
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join(", ") : "—";
  if (isRecord(value)) {
    const name = value.name ?? value.title ?? value.label;
    if (typeof name === "string" && name) return name;
    const parts = Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && v !== "" && !isRecord(v))
      .map(([k, v]) => `${fieldLabel(k)}: ${formatValue(v)}`);
    return parts.length ? parts.join(" · ") : "—";
  }
  return String(value);
}

// Whether a value fits a table cell (a nested record doesn't).
export const isFlat = (value: unknown) => !isRecord(value) && !(Array.isArray(value) && value.some(isRecord));

// "ORG_SOMETHING_NEW" → "Something new", for cards of a template this page doesn't know yet.
export const templateLabel = (template: string) => fieldLabel(template.replace(/^ORG_/, "").toLowerCase());
