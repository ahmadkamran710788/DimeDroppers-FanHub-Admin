import { CirclePlay, Crown, FileText, Puzzle, RadioTower, type LucideIcon } from "lucide-react";
import type { ActivationCategory } from "@/utils/types/activations";

// Every category, in the API's order. Saves send all of them back.
export const CATEGORY_ORDER: ActivationCategory[] = ["PRE_GAME", "LIVE", "POST_GAME", "ADD_ON", "EXCLUSIVITY"];

// Per category: the header strip and body tints of its card, its icon badge, and the solid colour of
// its donut segment + legend dot.
export const CATEGORY_STYLE: Record<
  ActivationCategory,
  { header: string; body: string; badge: string; pill: string; accent: string; icon: LucideIcon }
> = {
  PRE_GAME: {
    header: "bg-[#2457D6]",
    body: "bg-[rgba(30,72,180,0.45)]",
    badge: "bg-[rgba(255,255,255,0.18)]",
    pill: "bg-[#2457D6]",
    accent: "#3B82F6",
    icon: CirclePlay,
  },
  LIVE: {
    header: "bg-[#1E8E3E]",
    body: "bg-[rgba(24,120,54,0.45)]",
    badge: "bg-[rgba(255,255,255,0.18)]",
    pill: "bg-[#1E8E3E]",
    accent: "#22C55E",
    icon: RadioTower,
  },
  POST_GAME: {
    header: "bg-[#6B35B8]",
    body: "bg-[rgba(88,44,150,0.45)]",
    badge: "bg-[rgba(255,255,255,0.18)]",
    pill: "bg-[#2457D6]",
    accent: "#A855F7",
    icon: FileText,
  },
  ADD_ON: {
    header: "bg-[#A85C14]",
    body: "bg-[rgba(130,72,18,0.45)]",
    badge: "bg-[#E8913A]",
    pill: "bg-[rgba(0,0,0,0.45)]",
    accent: "#F59E0B",
    icon: Puzzle,
  },
  EXCLUSIVITY: {
    header: "bg-[#8E1B3A]",
    body: "bg-[rgba(120,22,52,0.45)]",
    badge: "bg-[#E2365F]",
    pill: "bg-[rgba(0,0,0,0.45)]",
    accent: "#EC4899",
    icon: Crown,
  },
};

// An Exclusivity slot's value is whole dollars, 0 – 1,000,000.
export const MAX_SLOT_VALUE = 1_000_000;

// An Exclusivity slot's size, e.g. "12 x 12 ft".
export const MAX_SIZE_LENGTH = 40;

// The Exclusivity slot whose value and size the org types itself (catalog key of "Custom Banner").
// Every other Exclusivity slot, a saved custom one included, shows Dime's.
export const ORG_PRICED_SLOT_KEY = "CUSTOM_BANNER";

