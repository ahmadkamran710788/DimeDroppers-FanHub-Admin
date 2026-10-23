"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CATEGORY_ORDER } from "@/components/organization/inventory/data";
import {
  buildForm,
  newExclusivity,
  toRequest,
  type FormSlot,
  type InventoryForm,
  type TournamentPicks,
} from "@/components/organization/inventory/helpers";
import { customSlotSchema } from "@/components/organization/inventory/schema";
import { backendFetch, forceSignOut } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  ActivationApiError,
  ActivationCatalog,
  ActivationCategory,
  ActivationInventory,
  ActivationInventoryRequest,
  ActivationTournament,
  TournamentFormat,
} from "@/utils/types/activations";
import { validateForm } from "@/utils/validation";

interface ApiResult<T> {
  status: number;
  view?: T;
  error?: ActivationApiError;
}

export type SlotField = "value" | "size";

// Problems with a slot's value or size, keyed by row.
export type RowErrors = Record<string, Partial<Record<SlotField, string>>>;

const NETWORK_ERROR = "Please check your network and try again.";

// backendFetch (not apiCall) so the backend's own message and `data.errors` reach us untoasted:
// apiCall replaces a 400 with generic text.
async function request<T>(method: "GET" | "PUT", endpoint: string, body?: ActivationInventoryRequest): Promise<ApiResult<T>> {
  try {
    const res = await backendFetch(endpoint, {
      method,
      headers: { Accept: "application/json", ...(body && { "Content-Type": "application/json" }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    // backendFetch already refreshed and retried once, so this session is over.
    if (res.status === 401) forceSignOut();
    const view = res.ok ? (json?.data?.[0] as T | undefined) : undefined;
    return view ? { status: res.status, view } : { status: res.status, error: json ?? {} };
  } catch {
    return { status: 0, error: { message: NETWORK_ERROR } };
  }
}

const errorMessage = ({ status, error }: ApiResult<unknown>) =>
  error?.message ||
  (status === 0 ? NETWORK_ERROR : status === 403 ? "You don't have permission to do this." : "Something went wrong, please try again.");

interface Loaded {
  catalog: ActivationCatalog;
  form: InventoryForm;
  // A tournament: the saved events and format and the format options. null for everyone else.
  tournament: ActivationTournament | null;
}

// A tournament event picked for the inventory.
export interface PickedEvent {
  id: string;
  name: string;
}

interface TournamentState {
  events: PickedEvent[];
  format: TournamentFormat | null;
}

const tournamentState = (t: ActivationTournament | null): TournamentState | null =>
  t ? { events: t.events.map((e) => ({ id: e.id, name: e.name ?? "Untitled event" })), format: t.format } : null;

// State and saving for the Inventory page: every slot of the org's type with its toggle ("show to
// sponsors"), the exclusivities the org adds (name, value, size), and for a tournament the events and
// format the inventory covers (needed before a save). The first GET creates the
// inventory, so saving is always a PUT.
export function useInventory() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loads, setLoads] = useState(0);
  // The load (by `loads` count) that finished, failed or not.
  const [settledLoad, setSettledLoad] = useState(-1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // Value / size problems (before or from the last save).
  const [rowErrors, setRowErrors] = useState<RowErrors>({});
  // The tournament's picked events and format (null when not a tournament).
  const [picks, setPicks] = useState<TournamentState | null>(null);
  // Numbers new exclusivities' on-screen keys.
  const [added, setAdded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      request<ActivationCatalog>("GET", routes.api.activationCatalog),
      request<ActivationInventory>("GET", routes.api.activationInventory),
    ]).then(([catalog, inventory]) => {
      if (cancelled) return;
      setSettledLoad(loads);
      if (!catalog.view || !inventory.view) {
        toast.error(errorMessage(catalog.view ? inventory : catalog));
        return;
      }
      setLoaded({
        catalog: catalog.view,
        form: buildForm(catalog.view, inventory.view),
        tournament: inventory.view.tournament ?? null,
      });
      setPicks(tournamentState(inventory.view.tournament ?? null));
      setDirty(false);
      setRowErrors({});
    });
    return () => {
      cancelled = true;
    };
  }, [loads]);

  const reload = useCallback(() => setLoads((n) => n + 1), []);

  const form = loaded?.form ?? null;

  const update = (fn: (f: InventoryForm) => InventoryForm) => {
    setLoaded((prev) => (prev ? { ...prev, form: fn(prev.form) } : prev));
    setDirty(true);
  };

  const updateColumn = (category: ActivationCategory, fn: (slots: FormSlot[]) => FormSlot[]) =>
    update((f) => ({ ...f, columns: { ...f.columns, [category]: fn(f.columns[category]) } }));

  const updateSlot = (category: ActivationCategory, rowKey: string, fn: (slot: FormSlot) => FormSlot) => {
    if (rowErrors[rowKey]) setRowErrors((prev) => without(prev, rowKey));
    updateColumn(category, (slots) => slots.map((s) => (s.rowKey === rowKey ? fn(s) : s)));
  };

  // ---- Toggle, value, size and order ----
  // Every slot switches on and off by itself, or a whole column at once (Select All / Clear All).
  // Switching off only hides the slot from sponsors: its value, size (and any placements) are kept.

  const toggle = (category: ActivationCategory, rowKey: string) =>
    updateSlot(category, rowKey, (s) => ({ ...s, enabled: !s.enabled }));

  const setValue = (category: ActivationCategory, rowKey: string, value: string) =>
    updateSlot(category, rowKey, (s) => (s.editable ? { ...s, value } : s));

  const setSize = (category: ActivationCategory, rowKey: string, size: string) =>
    updateSlot(category, rowKey, (s) => (s.editable ? { ...s, size } : s));

  const selectAll = (category: ActivationCategory) =>
    updateColumn(category, (slots) => slots.map((s) => ({ ...s, enabled: true })));

  const clearAll = (category: ActivationCategory) =>
    updateColumn(category, (slots) => slots.map((s) => ({ ...s, enabled: false })));

  // Drag to reorder within a column; the order is saved.
  const reorder = (category: ActivationCategory, fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    updateColumn(category, (slots) => {
      const list = [...slots];
      const from = list.findIndex((s) => s.rowKey === fromKey);
      const to = list.findIndex((s) => s.rowKey === toKey);
      if (from === -1 || to === -1) return slots;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return list;
    });
  };

  // ---- Exclusivities the org adds ----

  // Adds a new exclusivity (switched on); null, or why it can't be added. Names are unique.
  const addExclusivity = (fields: { name: string; value: string; size: string }): string | null => {
    if (!form) return null;
    const name = fields.name.trim().toLowerCase();
    if (form.columns.EXCLUSIVITY.some((s) => s.name.trim().toLowerCase() === name)) {
      return "An exclusivity with this name already exists";
    }
    updateColumn("EXCLUSIVITY", (slots) => [...slots, newExclusivity(fields, added)]);
    setAdded((n) => n + 1);
    return null;
  };

  // Removed from the form; the next save deletes it.
  const removeExclusivity = (rowKey: string) => {
    if (rowErrors[rowKey]) setRowErrors((prev) => without(prev, rowKey));
    updateColumn("EXCLUSIVITY", (slots) => slots.filter((s) => s.rowKey !== rowKey));
  };

  // ---- Tournament: events and format ----

  const addEvent = (event: PickedEvent) => {
    if (!picks || picks.events.some((e) => e.id === event.id)) return;
    setPicks({ ...picks, events: [...picks.events, event] });
    setDirty(true);
  };

  const removeEvent = (id: string) => {
    if (!picks) return;
    setPicks({ ...picks, events: picks.events.filter((e) => e.id !== id) });
    setDirty(true);
  };

  const setFormat = (format: TournamentFormat) => {
    if (!picks) return;
    setPicks({ ...picks, format });
    setDirty(true);
  };

  // What a tournament still has to pick before it can save.
  const missing = picks
    ? [...(picks.events.length === 0 ? ["Select at least one event"] : []), ...(picks.format ? [] : ["select a format"])]
    : [];

  // ---- Save ----

  // Every exclusivity the org added needs a whole-dollar value and a size.
  const findFieldErrors = async (f: InventoryForm) => {
    const found: RowErrors = {};
    const messages: string[] = [];
    for (const slot of CATEGORY_ORDER.flatMap((c) => f.columns[c])) {
      if (!slot.editable) continue;
      const errors = await validateForm(customSlotSchema, { value: slot.value, size: slot.size });
      if (!errors.value && !errors.size) continue;
      found[slot.rowKey] = { value: errors.value, size: errors.size };
      messages.push(`${slot.name}: ${errors.value ?? errors.size}`);
    }
    return { found, messages };
  };

  const mapSaveErrors = (result: ApiResult<unknown>, indexMap: string[]) => {
    const found: RowErrors = {};
    for (const { path, message } of result.error?.data?.errors ?? []) {
      const [root, index, field] = path.split(".");
      const rowKey = root === "activations" ? indexMap[Number(index)] : undefined;
      if (!rowKey) continue;
      const key: SlotField = field === "size" ? "size" : "value";
      found[rowKey] = { ...found[rowKey], [key]: found[rowKey]?.[key] ?? message };
    }
    setRowErrors(found);
  };

  const save = async () => {
    if (!loaded || saving) return;
    const { catalog, form: current } = loaded;
    if (missing.length > 0) {
      toast.error(missing[0]);
      return;
    }

    const { found, messages } = await findFieldErrors(current);
    if (messages.length > 0) {
      setRowErrors(found);
      toast.error(messages[0]);
      return;
    }

    setSaving(true);
    setRowErrors({});
    try {
      const tournamentPicks: TournamentPicks | null = picks ? { eventIds: picks.events.map((e) => e.id), format: picks.format } : null;
      const { body, indexMap } = toRequest(current, tournamentPicks);
      const result = await request<ActivationInventory>("PUT", routes.api.activationInventory, body);

      if (!result.view) {
        toast.error(errorMessage(result));
        // A tournament event / format problem is fixed in the setup above, so the edits stay.
        const aboutSetup = /event|format/i.test(result.error?.message ?? "");
        if (result.status === 400 && !result.error?.data?.errors?.length && !aboutSetup) {
          // A catalog, category or id rule: the screen is out of date, so reload it.
          reload();
          return;
        }
        mapSaveErrors(result, indexMap);
        return;
      }

      // Replace the form with the saved view so new slots carry their ids into the next PUT.
      setLoaded({ catalog, form: buildForm(catalog, result.view, current.columns), tournament: result.view.tournament ?? null });
      setPicks(tournamentState(result.view.tournament ?? null));
      setDirty(false);
      toast.success("Inventory saved.");
    } finally {
      setSaving(false);
    }
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return {
    loading: settledLoad !== loads,
    catalog: loaded?.catalog ?? null,
    form,
    reload,
    dirty,
    saving,
    rowErrors,
    toggle,
    setValue,
    setSize,
    selectAll,
    clearAll,
    reorder,
    addExclusivity,
    removeExclusivity,
    // Tournament only (null otherwise): the picked events and format, and the format options.
    tournament: picks && loaded?.tournament ? { ...picks, formatOptions: loaded.tournament.formatOptions } : null,
    addEvent,
    removeEvent,
    setFormat,
    missing,
    save,
  };
}

function without(errors: RowErrors, key: string): RowErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}
