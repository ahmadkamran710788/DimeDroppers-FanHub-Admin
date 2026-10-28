import { SPONSOR_PROFILE } from "@/components/sponsor/data";

// Mock data for the Brand Assets page until the sponsor API is integrated.

export const ASSET_FILTERS = ["All", "Logos", "Video", "Banners", "Social"] as const;
export type AssetFilter = (typeof ASSET_FILTERS)[number];
export type AssetType = Exclude<AssetFilter, "All">;
export const ASSET_FILTER_OPTIONS = ASSET_FILTERS.map((f) => ({ label: f, value: f }));

export type AssetStatus = "Approved" | "In review" | "Draft";
export type AssetFileKind = "image" | "video" | "document";

export interface BrandAsset {
  id: string;
  type: AssetType;
  name: string;
  // Format and size, e.g. "PNG · 1200×300".
  spec: string;
  // Where organizations use it.
  usage: string;
  status: AssetStatus;
  // Thumbnail background.
  bg: string;
  // Mock assets draw the brand logo in these colors; each part is skipped when unset.
  markFill?: string;
  wordColor?: string;
  // Video length, e.g. "0:15".
  duration?: string;
  // An uploaded file (object URL) to preview instead of the drawn logo.
  file?: { url: string; kind: AssetFileKind };
}

// The logo in the profile preview and on the mock library cards.
export const BRAND_LOGO = { wordmark: "NORTHPEAK", bg: "#0f3d3e", markFill: "#f26b1d", wordColor: "#f4efe6" };

export const ASSETS: BrandAsset[] = [
  { id: "primary-logo", type: "Logos", name: "Primary logo", spec: "SVG · full color", usage: "Used in 3 placements", status: "Approved", bg: "#0f3d3e", markFill: "#f26b1d", wordColor: "#f4efe6" },
  { id: "wordmark-white", type: "Logos", name: "Wordmark · white", spec: "PNG · 2400×600 · transparent", usage: "Used in 2 placements", status: "Approved", bg: "#1b1b1b", wordColor: "#ffffff" },
  { id: "logo-mark", type: "Logos", name: "Logo mark", spec: "PNG · 1024×1024", usage: "Not in use yet", status: "Approved", bg: "#f26b1d", markFill: "#0f3d3e" },
  { id: "home-team-spot", type: "Video", name: "Home team spot", spec: "MP4 · 1920×1080 · 15 sec", usage: "Used in 4 livestreams", status: "Approved", bg: "#123536", markFill: "#f26b1d", wordColor: "#f4efe6", duration: "0:15" },
  { id: "scoreboard-banner", type: "Banners", name: "Scoreboard banner", spec: "PNG · 1200×300", usage: "Used at Twin Lakes Academy", status: "In review", bg: "#0b0b0b", markFill: "#f26b1d", wordColor: "#f26b1d" },
  { id: "game-day-post", type: "Social", name: "Game-day post", spec: "PNG · 1080×1080", usage: "Not in use yet", status: "Draft", bg: "#f4efe6", markFill: "#f26b1d", wordColor: "#0f3d3e" },
];

export const BRAND_PROFILE = {
  name: SPONSOR_PROFILE.name,
  tagline: "Power the home team.",
  website: "northpeak.co",
  category: "Local Businesses & Community Partners",
  notes: "Use the white wordmark on dark backgrounds. Keep clear space equal to the peak height.",
  colors: ["#F26B1D", "#0F3D3E", "#F4EFE6"],
};

export const MAX_BRAND_COLORS = 6;

const MB = 1024 * 1024;

// What can be uploaded: SVG, PNG and PDF up to 50 MB, MP4 up to 500 MB.
export const UPLOAD_LIMITS = {
  fileExtensions: ["svg", "png", "pdf"],
  videoExtensions: ["mp4"],
  maxFileBytes: 50 * MB,
  maxVideoBytes: 500 * MB,
  hint: "SVG, PNG, PDF up to 50 MB · MP4 up to 500 MB",
};

// File picker filters: everything (drop zone), or the kind an asset already is (Replace).
export const UPLOAD_ACCEPT = {
  all: ".svg,.png,.pdf,.mp4",
  files: ".svg,.png,.pdf",
  video: ".mp4",
};

export interface PlacementSpec {
  name: string;
  spec: string;
  // What to upload, when no asset fits the placement yet.
  missing?: string;
}

export const PLACEMENT_SPECS: PlacementSpec[] = [
  { name: "Scoreboard", spec: "PNG · 1200×300 · dark background" },
  { name: "Livestream ad", spec: "MP4 · 1920×1080 · 15 or 30 sec" },
  { name: "Jersey patch", spec: "SVG or PDF · vector, max 2 colors", missing: "upload a vector mark" },
  { name: "Stadium banner", spec: "PDF · 8×3 ft · 150 dpi" },
];
