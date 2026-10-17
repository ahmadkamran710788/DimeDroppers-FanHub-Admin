import { CATEGORY_ORDER, FALLBACK_VALUE, MAX_SLOT_VALUE } from "@/components/activations/data";
import type {
  ActivationCatalog,
  ActivationCategory,
  ActivationInput,
  ActivationInventory,
  ActivationInventoryRequest,
  CatalogItem,
  InventoryActivation,
  LevelInput,
  PlacementInput,
} from "@/utils/types/activations";

// ---- Form model ----
// One row per slot (every slot for the org's type is listed). The page edits only the checkbox
// (`enabled`), the value and the order; levels and placements aren't edited here but are sent back
// unchanged, because a save deletes levels — and placements of a sent slot — left out of the body.

export interface FormSlot {
  // Stable on-screen key: the catalog key, or the custom slot's id.
  rowKey: string;
  // null for a slot not saved yet.
  id: string | null;
  // null for a custom slot.
  catalogKey: string | null;
  name: string;
  description: string | null;
  isRecommended: boolean;
  // A catalog slot that's no longer offered for the org's type; the backend keeps it.
  retired: boolean;
  // The checkbox: shown to sponsors.
  enabled: boolean;
  // Whole dollars, as typed.
  value: string;
  placements: PlacementInput[];
}

export interface InventoryForm {
  levels: LevelInput[];
  columns: Record<ActivationCategory, FormSlot[]>;
}

export const catalogRowKey = (catalogKey: string) => `catalog:${catalogKey.toUpperCase()}`;

const byOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

const startingValue = (item: CatalogItem) => String(item.defaultValue ?? FALLBACK_VALUE);

const fromCatalog = (item: CatalogItem): FormSlot => ({
  rowKey: catalogRowKey(item.key),
  id: null,
  catalogKey: item.key.toUpperCase(),
  name: item.name,
  description: item.description,
  isRecommended: item.isRecommended,
  retired: false,
  enabled: false,
  value: startingValue(item),
  placements: [],
});

const fromView = (a: InventoryActivation, offered: Set<string>): FormSlot => {
  const catalogKey = a.catalogKey ? a.catalogKey.toUpperCase() : null;
  return {
    rowKey: catalogKey ? catalogRowKey(catalogKey) : `custom:${a.id}`,
    id: a.id,
    catalogKey,
    name: a.name,
    description: a.description,
    isRecommended: a.isRecommended,
    retired: !!catalogKey && !offered.has(catalogKey),
    enabled: a.isAvailableForSponsors ?? false,
    value: String(a.value ?? FALLBACK_VALUE),
    placements: [...a.placements].sort(byOrder).map((p) => ({
      id: p.id,
      levelName: p.levelName,
      phase: p.phase,
      value: p.value,
      slotCount: p.slotCount,
      capabilities: p.capabilities.map((c) => c.capability),
    })),
  };
};

// Builds the form from the catalog and the saved inventory. With no inventory yet (first visit),
// every catalog slot starts at its default value, unticked. `prevColumns` (after a save) keeps the
// rows in their on-screen order: catalog slots by key, custom ones by position, since the API keeps
// the order it was sent.
export function buildForm(
  catalog: ActivationCatalog,
  inventory: ActivationInventory | null,
  prevColumns?: InventoryForm["columns"]
): InventoryForm {
  const columns = {} as InventoryForm["columns"];

  for (const category of CATEGORY_ORDER) {
    const items = catalog.categories.find((c) => c.category === category)?.items ?? [];
    const offered = new Set(items.map((item) => item.key.toUpperCase()));
    let slots = inventory
      ? [...(inventory.categories.find((c) => c.category === category)?.activations ?? [])]
          .sort(byOrder)
          .map((a) => fromView(a, offered))
      : items.map(fromCatalog);

    if (prevColumns) {
      const byKey = new Map(slots.filter((s) => s.catalogKey).map((s) => [s.rowKey, s]));
      const custom = slots.filter((s) => !s.catalogKey);
      const ordered = prevColumns[category].flatMap((prev) => {
        const next = prev.catalogKey ? byKey.get(prev.rowKey) : custom.shift();
        if (next) byKey.delete(next.rowKey);
        return next ? [next] : [];
      });
      slots = [...ordered, ...byKey.values(), ...custom];
    }

    // Catalog items the inventory doesn't list yet still show, unticked.
    const listed = new Set(slots.map((s) => s.rowKey));
    for (const item of items) {
      if (!listed.has(catalogRowKey(item.key))) slots.push(fromCatalog(item));
    }
    columns[category] = slots;
  }

  return {
    levels: [...(inventory?.levels ?? [])].sort(byOrder).map((l) => ({ id: l.id, name: l.name })),
    columns,
  };
}

// The POST / PUT body: every slot (shown or not) with its value and checkbox, in display order,
// and the levels and placements as they were. `indexMap[i]` is the row behind `activations.{i}`,
// so validation paths from a 400 can be traced back to the screen.
export function toRequest(form: InventoryForm): { body: ActivationInventoryRequest; indexMap: string[] } {
  const activations: ActivationInput[] = [];
  const indexMap: string[] = [];

  for (const category of CATEGORY_ORDER) {
    for (const slot of form.columns[category]) {
      indexMap.push(slot.rowKey);
      activations.push({
        ...(slot.id && { id: slot.id }),
        // Catalog slots never send name/description back: the view falls back to the catalog
        // text, and echoing it would freeze a copy of it.
        ...(slot.catalogKey
          ? { catalogKey: slot.catalogKey }
          : { category, name: slot.name, description: slot.description }),
        // Ticked slots are validated before saving; an unticked one whose (hidden) field holds
        // something invalid leaves the value out, so the saved value stays.
        ...(isWholeNumber(slot.value) && { value: Number(slot.value) }),
        isAvailableForSponsors: slot.enabled,
        placements: slot.placements,
      });
    }
  }

  return { body: { levels: form.levels, activations }, indexMap };
}

// ---- Totals ----

function isWholeNumber(v: string) {
  return /^\d+$/.test(v.trim()) && Number(v) <= MAX_SLOT_VALUE;
}

const toInt = (v: string) => (isWholeNumber(v) ? Number(v) : 0);

// Sum of the ticked slots' values.
export const selectedValue = (slots: FormSlot[]) => slots.reduce((sum, s) => sum + (s.enabled ? toInt(s.value) : 0), 0);

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// Values are whole US dollars.
export const formatUsd = (amount: number) => usd.format(amount);
