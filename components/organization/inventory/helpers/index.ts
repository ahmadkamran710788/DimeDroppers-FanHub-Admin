import { CATEGORY_ORDER } from "@/components/organization/inventory/data";
import type {
  ActivationCatalog,
  ActivationCategory,
  ActivationInput,
  ActivationInventory,
  ActivationInventoryRequest,
  InventoryActivation,
  LevelInput,
  PlacementInput,
  TournamentFormat,
} from "@/utils/types/activations";

// ---- Form model ----
// One row per slot: every catalog slot for the org's type, plus the exclusivities the org added. The
// page edits the toggle (`enabled`) and the order of every slot, and adds, edits (value and size) and
// removes exclusivities; levels and placements aren't edited here but are sent back unchanged, because
// a save deletes levels — and placements of a sent slot — left out of the body.

// The editable fields as they were loaded, so a save sends only what changed.
export interface SlotInitial {
  enabled: boolean;
  value: string;
  size: string;
}

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
  // The toggle: shown to sponsors.
  enabled: boolean;
  // In the Exclusivity column: the row shows its value and size.
  exclusive: boolean;
  // An exclusivity the org added: it types its value and size, and can remove it. Every other slot
  // shows Dime's.
  editable: boolean;
  // The slot's value in whole dollars, as saved (shown read-only).
  savedValue: number;
  // An editable slot: whole dollars, as typed.
  value: string;
  // As typed on an editable slot; the saved size elsewhere.
  size: string;
  initial: SlotInitial;
  placements: PlacementInput[];
}

export interface InventoryForm {
  levels: LevelInput[];
  columns: Record<ActivationCategory, FormSlot[]>;
}

export const catalogRowKey = (catalogKey: string) => `catalog:${catalogKey.toUpperCase()}`;

const byOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

const fromView = (a: InventoryActivation, offered: Set<string>): FormSlot => {
  const catalogKey = a.catalogKey ? a.catalogKey.toUpperCase() : null;
  // The exclusivities the org added take its own value and size.
  const editable = a.isEditable && a.isCustom;
  const initial: SlotInitial = {
    enabled: a.isAvailableForSponsors,
    value: editable ? String(a.value) : "",
    size: a.size ?? "",
  };
  return {
    rowKey: catalogKey ? catalogRowKey(catalogKey) : `custom:${a.id}`,
    id: a.id,
    catalogKey,
    name: a.name,
    description: a.description,
    isRecommended: a.isRecommended,
    retired: !!catalogKey && !offered.has(catalogKey),
    exclusive: a.isEditable,
    editable,
    savedValue: a.value,
    ...initial,
    initial,
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

// Builds the form from the inventory (which lists every offered slot, saved or not); the catalog
// only tells which saved slots are no longer offered. `prevColumns` (after a save) keeps the rows in
// their on-screen order: catalog slots by key, custom ones by position, since the API keeps the
// order it was sent.
export function buildForm(
  catalog: ActivationCatalog,
  inventory: ActivationInventory,
  prevColumns?: InventoryForm["columns"]
): InventoryForm {
  const columns = {} as InventoryForm["columns"];

  for (const category of CATEGORY_ORDER) {
    const items = catalog.categories.find((c) => c.category === category)?.items ?? [];
    const offered = new Set(items.map((item) => item.key.toUpperCase()));
    const view = inventory.categories.find((c) => c.category === category);
    let slots = [...(view?.activations ?? [])].sort(byOrder).map((a) => fromView(a, offered));

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

    columns[category] = slots;
  }

  return {
    levels: [...inventory.levels].sort(byOrder).map((l) => ({ id: l.id, name: l.name })),
    columns,
  };
}

// An added exclusivity always sends its value and size (both are required); the form checks them
// before a save.
const customFields = (slot: FormSlot): Pick<ActivationInput, "value" | "size"> =>
  slot.editable ? { value: Number(slot.value.trim()), size: slot.size.trim() } : {};

// The tournament's picks for the save: both are sent whenever set (`eventIds` replaces the saved
// selection, so it's always the full list).
export interface TournamentPicks {
  eventIds: string[];
  format: TournamentFormat | null;
}

// The PUT body: every slot in display order (the backend numbers the sent slots first, so leaving
// one out would move it), sending only the toggle that changed, an added exclusivity's name, value and
// size, and the levels and placements as they were. A removed exclusivity is simply not sent, which
// deletes it. `indexMap[i]` is the row behind `activations.{i}`, so validation paths from a 400 can be
// traced back to the screen.
export function toRequest(
  form: InventoryForm,
  tournament?: TournamentPicks | null
): { body: ActivationInventoryRequest; indexMap: string[] } {
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
        ...(slot.enabled !== slot.initial.enabled && { isAvailableForSponsors: slot.enabled }),
        ...customFields(slot),
        placements: slot.placements,
      });
    }
  }

  return {
    body: {
      levels: form.levels,
      activations,
      ...(tournament && tournament.eventIds.length > 0 && { eventIds: tournament.eventIds }),
      ...(tournament?.format && { tournamentFormat: tournament.format }),
    },
    indexMap,
  };
}

// A new exclusivity, switched on, waiting for the next save to get its id.
export function newExclusivity(fields: { name: string; value: string; size: string }, n: number): FormSlot {
  const value = fields.value.trim();
  return {
    rowKey: `new:${n}`,
    id: null,
    catalogKey: null,
    name: fields.name.trim(),
    description: null,
    isRecommended: false,
    retired: false,
    enabled: true,
    exclusive: true,
    editable: true,
    savedValue: Number(value),
    value,
    size: fields.size.trim(),
    // Unsaved, so everything counts as changed.
    initial: { enabled: false, value: "", size: "" },
    placements: [],
  };
}
