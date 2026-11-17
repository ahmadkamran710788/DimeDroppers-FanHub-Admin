// The sponsor's logos (fanhub/sponsor-profile/brand-assets) and the logo each bought slot shows, see
// FANHUB_SPONSOR_BRAND_ASSETS_FRONTEND.md.

import type { ActivationCategory } from "@/utils/types/activations";

// FULL_COLOR is the standard logo (white screens); WHITE is for dark screens; ICON is a square badge.
export type LogoVariant = "FULL_COLOR" | "WHITE" | "ICON";

// GENERATED: made by the backend from the standard logo ("White logo (auto)", "Icon (auto)").
export type BrandAssetSource = "UPLOADED" | "GENERATED";

// Where the logo a slot shows comes from, first match wins: the choice for this slot, for the slot type, the
// default of that kind, the sponsor profile logo (full color only), else none (url null).
export type LogoSource = "SLOT" | "SLOT_TYPE" | "DEFAULT" | "PROFILE" | "NONE";

// READY: a logo of the kind is in use. MISSING: a bought slot needs it and there's none. NOT_NEEDED: no slot needs it.
export type VariantState = "READY" | "MISSING" | "NOT_NEEDED";

// What happened to one version when the white logo and icon were made from the standard logo.
export type GenerationState = "GENERATED" | "UPLOADED_BY_SPONSOR" | "NEEDS_UPLOAD";

export interface GenerationResult {
  variant: LogoVariant;
  state: GenerationState;
  assetId: string | null;
  // Why it couldn't be made (NEEDS_UPLOAD), for the sponsor.
  reason: string | null;
}

// The last run on a full-color logo. FAILED: nothing was made; the upload itself still went through.
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
  // The standard logo a generated one was made from.
  parentId: string | null;
  // On a full-color logo once versions were made from it.
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
  defaultAssetId: string | null;
  inUse: { source: LogoSource; url: string | null; generated: boolean };
  // Why no logo of this kind could be made, when there's none in use; shown with an Upload button.
  needsUpload: string | null;
  // Active bought slots that show this kind.
  neededBySlots: number;
  state: VariantState;
}

// GET /brand-assets.
export interface BrandAssetList {
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

// GET /brand-assets/options.
export interface BrandAssetOptions {
  variants: VariantSpec[];
  slots: { catalogKey: string; name: string; category: ActivationCategory; logos: SlotLogoNeed[] }[];
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
