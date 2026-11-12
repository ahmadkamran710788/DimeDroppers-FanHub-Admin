// Sponsor purchased inventory (fanhub/sponsor-packages/inventory), see
// FANHUB_SPONSOR_PURCHASED_INVENTORY_FRONTEND.md.

import type { ActivationCategory } from "@/utils/types/activations";
import type { PackageActivationStatus, PackageTier, SponsorOrganizationType } from "@/utils/types/sponsor-packages";

// How the activation was paid.
export interface InventoryPayment {
  state: "PAID" | "PROCESSING" | "PENDING" | "FAILED" | "CANCELLED" | "NOT_CHARGED" | "FREE";
  paymentId: string | null;
  methodLabel: string | null;
  paidAt: string | null;
  refundedCents: number;
}

export interface CategoryCount {
  category: ActivationCategory;
  label: string;
  slots: number;
  organizations: number;
}

// Counts over everything bought (whatever tab or slot is picked), for the tab badges.
export interface InventorySummary {
  organizations: number;
  slots: number;
  categories: CategoryCount[];
}

export interface InventoryOrganization {
  id: string;
  name: string | null;
  organizationType: SponsorOrganizationType;
  organizationTypeLabel: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  sportsType: string | null;
}

export interface PackageRef {
  orderId: string;
  kind: "PACKAGE" | "PHYSICAL_ASSET";
  tier: PackageTier | null;
  name: string;
}

export interface InventoryEvent {
  id: string;
  name: string | null;
}

// One activation at the organization (a tournament can have one per event).
export interface InventoryPackage extends PackageRef {
  event: InventoryEvent | null;
  // Never PENDING_PAYMENT / PAYMENT_FAILED here: an unpaid activation is not inventory.
  status: PackageActivationStatus;
  totalCents: number;
  currency: string;
  payment: InventoryPayment;
  activatedAt: string;
  endsAt: string | null;
  slotCount: number;
}

// One purchased slot (order line) at the organization.
export interface InventorySlot {
  lineId: string;
  orderId: string;
  catalogKey: string;
  name: string;
  category: ActivationCategory;
  categoryLabel: string;
  package: PackageRef;
  event: InventoryEvent | null;
  status: PackageActivationStatus;
  activatedAt: string;
  endsAt: string | null;
}

export interface InventoryOrganizationItem {
  organization: InventoryOrganization;
  // Every package bought there, whatever the filter.
  packages: InventoryPackage[];
  categories: CategoryCount[];
  // Every slot bought there; `slots` holds only the ones matching the category / slot filter.
  slotCount: number;
  slots: InventorySlot[];
}

// GET /inventory: a page of organizations, newest purchase first.
export interface InventoryPage {
  summary: InventorySummary;
  items: InventoryOrganizationItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// One slot across organizations ("PRE GAME Predictions 3"); `catalogKey` is the slot filter.
export interface SlotChip {
  catalogKey: string;
  name: string;
  category: ActivationCategory;
  categoryLabel: string;
  packages: string[];
  organizations: number;
  slots: number;
}

// GET /inventory/slots: ordered Pre Game → Live → Post Game → Add-ons → Physical Assets, then by name.
export interface SlotChipList {
  summary: InventorySummary;
  items: SlotChip[];
}
