import type { RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";

// The award badges offered in Details, in the fan app's order.
export const SHOUTOUT_TEMPLATES: RecognitionTemplate[] = [
  "Hustle",
  "Teamwork",
  "Character",
  "Fan Love",
  "Game Changer",
  "Player of the Game",
  "Athlete of the Month",
  "Rising Star",
  "Leadership",
  "Thank You",
];

export const MESSAGE_MAX = 300;

// A hex colour (#RRGGBB) the admin typed or picked.
export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// The card background of a colour: a preset's gradient as is, a hex turned into the same kind of gradient.
export const cardBackground = (color: string) =>
  HEX_COLOR.test(color) ? `linear-gradient(160deg,${color},color-mix(in srgb,${color} 55%,black))` : color;

// The hex sent to the API for a colour: a hex as is, a preset by its first (lightest) stop; "" for the template's.
export const cardHexOf = (color: string) => (HEX_COLOR.test(color) ? color : (color.match(/#[0-9a-f]{6}/i)?.[0] ?? "")).toUpperCase();

// The card colours offered in Details; "" keeps the template's own colour.
export const CARD_COLORS: { name: string; gradient: string }[] = [
  { name: "Template", gradient: "" },
  { name: "Blue", gradient: "linear-gradient(160deg,#2563EB,#1D4ED8 55%,#1E3A8A)" },
  { name: "Teal", gradient: "linear-gradient(160deg,#0F766E,#115E59 60%,#134E4A)" },
  { name: "Purple", gradient: "linear-gradient(160deg,#7C3AED,#6D28D9 55%,#4C1D95)" },
  { name: "Red", gradient: "linear-gradient(160deg,#DC2626,#B91C1C 55%,#7F1D1D)" },
  { name: "Orange", gradient: "linear-gradient(160deg,#EA580C,#C2410C 55%,#7C2D12)" },
  { name: "Gold", gradient: "linear-gradient(160deg,#CA8A04,#A16207 55%,#713F12)" },
  { name: "Green", gradient: "linear-gradient(160deg,#16A34A,#15803D 55%,#14532D)" },
  { name: "Pink", gradient: "linear-gradient(160deg,#DB2777,#BE185D 55%,#831843)" },
  { name: "Slate", gradient: "linear-gradient(160deg,#475569,#334155 55%,#0F172A)" },
];
