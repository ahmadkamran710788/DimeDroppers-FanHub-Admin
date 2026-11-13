import { ExternalLink, List, SquareMinus, Tag, type LucideIcon } from "lucide-react";
import type { ActivationCategory } from "@/utils/types/activations";

// Organizations per page of the list (the API allows up to 100).
export const PAGE_SIZE = 20;

// A category's color, on its chips and in the fan preview.
export const CATEGORY_TEXT: Record<ActivationCategory, string> = {
  PRE_GAME: "text-[#93c5fd]",
  LIVE: "text-[#fca5a5]",
  POST_GAME: "text-[#c4b5fd]",
  ADD_ON: "text-[#fcd34d]",
  PHYSICAL_ASSET: "text-[#86efac]",
};

// Slot setup is coming soon: the templates and logo versions are shown, not picked yet.
export interface PlacementTemplate {
  id: "SIMPLE_BPA" | "VISIT_WEBSITE" | "SURVEY" | "OFFER_PROMO_CODE";
  name: string;
  desc: string;
  icon: LucideIcon;
}

export type TemplateId = PlacementTemplate["id"];

export const TEMPLATES: PlacementTemplate[] = [
  { id: "SIMPLE_BPA", name: "Simple BPA", desc: "Default. Shows only your logo.", icon: SquareMinus },
  { id: "VISIT_WEBSITE", name: "Visit website", desc: "A button that sends fans to your site.", icon: ExternalLink },
  { id: "SURVEY", name: "Survey", desc: "Ask fans a question and collect answers.", icon: List },
  { id: "OFFER_PROMO_CODE", name: "Offer / promo code", desc: "Give fans a discount code to redeem.", icon: Tag },
];

export const LOGO_VARIANTS = [
  { id: "FULL_COLOR", name: "Full-color logo" },
  { id: "WHITE", name: "White logo" },
  { id: "ICON", name: "Icon / mark" },
] as const;

export interface PreviewSample {
  // What the fan card shows above the sponsor ("Who wins tonight?").
  title: string;
  choices: string[];
}

// Sample fan cards for the preview, by slot; any other slot shows its own name.
export const PREVIEW_SAMPLES: Record<string, PreviewSample> = {
  PREDICTIONS: { title: "Who wins tonight?", choices: ["Home", "Away"] },
  LIVE_PREDICTIONS: { title: "Who scores next?", choices: ["Home", "Away"] },
  LIVE_VOTE: { title: "Vote: player of the game", choices: ["#7", "#12", "#23"] },
  POST_GAME_VOTE: { title: "Vote: player of the game", choices: ["#7", "#12", "#23"] },
  CHALLENGES_QUESTS: { title: "Quest: check in at 3 home games", choices: ["Check in"] },
  SCOREBOARD: { title: "Q3 · 54 – 49", choices: ["Home 54", "Away 49"] },
  PRE_GAME_SCHEDULE: { title: "Next game: Sat 10:00 AM, Court 2", choices: ["Add to calendar"] },
  LIVE_SCHEDULE: { title: "Now playing: Court 2", choices: ["Watch"] },
  POST_GAME_SCHEDULE: { title: "Final: Home 61 – 55 Away", choices: ["See results"] },
};

// The preview with no slot picked.
export const GENERIC_SAMPLE: PreviewSample = { title: "Your slot in the Fan Hub", choices: [] };
