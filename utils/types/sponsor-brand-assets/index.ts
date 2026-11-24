// The sponsor's logos (fanhub/sponsor-profile/brand-assets) and the logo each bought slot shows, see
// FANHUB_SPONSOR_BRAND_ASSETS_FRONTEND.md.

import type { ActivationCategory } from "@/utils/types/activations";

// FULL_COLOR is the landscape logo, a wide wordmark (white screens); CIRCULAR is a round mark on a square file
// (the Partner Offers badge); WHITE is for dark screens; ICON is a square mark, the badge until a circular logo
// is uploaded.
export type LogoVariant = "FULL_COLOR" | "CIRCULAR" | "WHITE" | "ICON";

// Which logo the white logo and icon follow. LANDSCAPE: they're made from the default landscape logo.
// CIRCULAR: nothing is made, and the made ones are removed (the sponsor uploads their own).
export type MainLogo = "LANDSCAPE" | "CIRCULAR";

// GENERATED: made by the backend from the landscape logo ("White logo (auto)", "Icon (auto)").
export type BrandAssetSource = "UPLOADED" | "GENERATED";

// Where the logo a slot shows comes from, first match wins: the choice for this slot, for the slot type, the
// default of that kind, the sponsor profile logo (landscape only), else none (url null). A circular logo that
// isn't there falls back to the default icon (with the icon's id and name).
export type LogoSource = "SLOT" | "SLOT_TYPE" | "DEFAULT" | "PROFILE" | "NONE";

// READY: a logo of the kind is in use. MISSING: a bought slot needs it and there's none. NOT_NEEDED: no slot needs it.
export type VariantState = "READY" | "MISSING" | "NOT_NEEDED";

// What happened to one version when the white logo and icon were made from the landscape logo.
export type GenerationState = "GENERATED" | "UPLOADED_BY_SPONSOR" | "NEEDS_UPLOAD";

export interface GenerationResult {
  variant: LogoVariant;
  state: GenerationState;
  assetId: string | null;
  // Why it couldn't be made (NEEDS_UPLOAD), for the sponsor.
  reason: string | null;
}

// The last run on a landscape logo. FAILED: nothing was made; the upload itself still went through. null when
// nothing ran (e.g. uploaded while the main logo is circular).
export interface LogoGeneration {
  status: "DONE" | "FAILED";
  generatedAt: string;
  backgroundRemoved: boolean;
  results: GenerationResult[];
  error: string | null;
}

// One logo. `url` is a permanent backend link (no token needed) whose `?v=` changes when the file is replaced.
export interface BrandAsset {
  id: string;
  variant: LogoVariant;
  variantLabel: string;
  name: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  isDefault: boolean;
  source: BrandAssetSource;
  // The landscape logo a generated one was made from.
  parentId: string | null;
  // On a landscape logo once versions were made from it.
  generation: LogoGeneration | null;
  // Choices for whole slot types plus choices for single slots ("Used in N placements").
  usedBy: { slotTypes: number; slots: number };
  createdAt: string;
  updatedAt: string;
}

// One kind, for its Uploaded / Missing card.
export interface VariantStatus {
  variant: LogoVariant;
  label: string;
  // The sponsor's own logos of this kind (generated ones don't count).
  uploaded: number;
  // null with an `inUse.url` on the circular kind: it shows the default icon until a circular logo is uploaded.
  defaultAssetId: string | null;
  inUse: { source: LogoSource; url: string | null; generated: boolean };
  // Why no logo of this kind could be made (or, while the main logo is circular, that it isn't made), when there's
  // none in use; shown with an Upload button.
  needsUpload: string | null;
  // Active bought slots that show this kind.
  neededBySlots: number;
  state: VariantState;
}

// GET /brand-assets (and the answer of PUT /brand-assets/main-logo). `items` aren't in `variants` order: group
// them by kind.
export interface BrandAssetList {
  mainLogo: MainLogo;
  profileLogoUrl: string | null;
  summary: { ready: number; missing: number; needed: number; total: number };
  variants: VariantStatus[];
  items: BrandAsset[];
}

// The upload rules of one kind.
export interface VariantSpec {
  variant: LogoVariant;
  label: string;
  description: string;
  // "SVG", "PNG", "JPG".
  formats: string[];
  mimeTypes: string[];
  recommended: { width: number; height: number };
  minWidth: number;
  minHeight: number;
  // Width ÷ height.
  minRatio: number;
  maxRatio: number;
  transparentRequired: boolean;
  usedOn: string[];
}

// A kind a slot shows and where ("Prediction card header").
export interface SlotLogoNeed {
  variant: LogoVariant;
  variantLabel: string;
  usage: string;
}

// A main logo the sponsor can choose, with what it means for the made versions.
export interface MainLogoOption {
  value: MainLogo;
  label: string;
  description: string;
}

// GET /brand-assets/options.
export interface BrandAssetOptions {
  variants: VariantSpec[];
  slots: { catalogKey: string; name: string; category: ActivationCategory; logos: SlotLogoNeed[] }[];
  mainLogos: MainLogoOption[];
  defaultMainLogo: MainLogo;
  limits: { maxBytes: number; perVariantMax: number; nameMax: number };
}

// The logo a slot shows for one kind.
export interface ResolvedLogo {
  variant: LogoVariant;
  assetId: string | null;
  assetName: string | null;
  source: LogoSource;
  url: string | null;
}

// One kind on a bought slot at one organisation (GET /inventory, `slots[].logos`).
export interface SlotLogo extends ResolvedLogo {
  variantLabel: string;
  usage: string;
  // The choice for this slot here; the choice for the whole slot type.
  slotAssetId: string | null;
  slotTypeAssetId: string | null;
}

// One kind on a slot type at every organisation (GET /inventory/slots, chip `logos`).
export interface SlotTypeLogo extends ResolvedLogo {
  variantLabel: string;
  usage: string;
  slotTypeAssetId: string | null;
  // Slots of this type with their own choice at one organisation.
  slotOverrides: number;
}

// PUT /inventory/logos and PUT /inventory/lines/:lineId/logo.
export interface SlotLogoChoice {
  scope: "SLOT" | "SLOT_TYPE";
  catalogKey: string;
  lineId: string | null;
  variant: LogoVariant;
  assetId: string | null;
  logo: ResolvedLogo;
}
