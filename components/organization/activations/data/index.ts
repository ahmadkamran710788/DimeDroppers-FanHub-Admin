import type { ActivationCategory } from "@/utils/types/activations";

// Every category, in the API's order. Saves send all of them back, shown or not.
export const CATEGORY_ORDER: ActivationCategory[] = ["FAN_ZONE", "COMMUNITY", "PLAY", "PHYSICAL_ADD_ON"];

// The columns the page shows. Physical Add-ons is hidden for now.
export const VISIBLE_CATEGORIES: ActivationCategory[] = ["FAN_ZONE", "COMMUNITY", "PLAY"];

// Card background (semi-transparent brand tint) and the solid colour for the donut segment + legend dot.
export const CATEGORY_STYLE: Record<ActivationCategory, { color: string; accent: string }> = {
  FAN_ZONE: { color: "rgba(99,139,254,0.5)", accent: "#638BFE" },
  COMMUNITY: { color: "rgba(101,193,98,0.4)", accent: "#65C162" },
  PLAY: { color: "rgba(157,98,193,0.4)", accent: "#9D62C1" },
  PHYSICAL_ADD_ON: { color: "rgba(232,145,58,0.4)", accent: "#E8913A" },
};

// A slot's value is whole dollars, 0 – 1,000,000.
export const MAX_SLOT_VALUE = 1_000_000;

// Starting value when the API gives none (a backend without slot values yet).
export const FALLBACK_VALUE = 5;
