import type { LogoVariant } from "@/utils/types/sponsor-brand-assets";

// The solid square behind an icon: white, or dark for a light logo (the backend's #111111).
export const ICON_BACKGROUNDS = {
  White: { className: "bg-white", color: "#ffffff" },
  Dark: { className: "bg-[#111111]", color: "#111111" },
} as const;

export type IconBackground = keyof typeof ICON_BACKGROUNDS;

export const ICON_BACKGROUND_OPTIONS = Object.keys(ICON_BACKGROUNDS) as IconBackground[];

// The frame's background in the editor: the screen the kind shows on. The icon's is the sponsor's pick from
// ICON_BACKGROUNDS; white until then.
export const FRAME_BACKGROUND: Record<LogoVariant, string> = {
  FULL_COLOR: "bg-white",
  WHITE: "bg-black border border-[#3a3f4b]",
  ICON: "bg-white",
};

// The zoom sliders' range, in % of the logo at the standard size.
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 400;

// A zoom this close to 100% (the standard size) snaps to it.
export const SNAP_RANGE = 3;
