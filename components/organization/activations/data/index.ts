import type { ActivationCategory } from "@/utils/types/activations";

// Every category, in the API's order. Saves send all of them back.
export const CATEGORY_ORDER: ActivationCategory[] = ["PRE_GAME", "LIVE", "POST_GAME", "ADD_ON", "EXCLUSIVITY"];

// Card background (semi-transparent brand tint) and the solid colour for the donut segment + legend dot.
export const CATEGORY_STYLE: Record<ActivationCategory, { color: string; accent: string }> = {
  PRE_GAME: { color: "rgba(99,139,254,0.5)", accent: "#638BFE" },
  LIVE: { color: "rgba(101,193,98,0.4)", accent: "#65C162" },
  POST_GAME: { color: "rgba(157,98,193,0.4)", accent: "#9D62C1" },
  ADD_ON: { color: "rgba(232,145,58,0.4)", accent: "#E8913A" },
  EXCLUSIVITY: { color: "rgba(230,86,120,0.4)", accent: "#E65678" },
};

// An Exclusivity slot's value is whole dollars, 0 – 1,000,000.
export const MAX_SLOT_VALUE = 1_000_000;

// An Exclusivity slot's size, e.g. "12 x 12 ft".
export const MAX_SIZE_LENGTH = 40;
