"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CATEGORY_ORDER } from "@/components/organization/activations/data";
import { buildForm, toRequest, type FormSlot, type InventoryForm } from "@/components/organization/activations/helpers";
import { exclusivitySlotSchema } from "@/components/organization/activations/schema";
import { backendFetch, forceSignOut } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  ActivationApiError,
  ActivationCatalog,
  ActivationCategory,
  ActivationInventory,
  ActivationInventoryRequest,
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
}

// State and saving for the Activations page: every slot of the org's type with its checkbox
// ("show to sponsors"), and the value and size of Exclusivity slots. The first GET creates the
// inventory, so saving is always a PUT.
export function useActivationInventory() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loads, setLoads] = useState(0);
  // The load (by `loads` count) that finished, failed or not.
  const [settledLoad, setSettledLoad] = useState(-1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // Value / size problems (before or from the last save).
  const [rowErrors, setRowErrors] = useState<RowErrors>({});

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
      setLoaded({ catalog: catalog.view, form: buildForm(catalog.view, inventory.view) });
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

  // ---- Checkbox, value, size and order ----
  // Exclusivity slots are ticked one by one; the other columns only all at once (Select All /
  // Clear All). Unticking only hides the slot from sponsors: its value, size (and any placements)
  // are kept.

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

  // ---- Save ----

  // Every Exclusivity slot, ticked or not, since its value and size fields always show.
  const findFieldErrors = async (f: InventoryForm) => {
    const found: RowErrors = {};
    const messages: string[] = [];
    for (const slot of CATEGORY_ORDER.flatMap((c) => f.columns[c])) {
      if (!slot.editable) continue;
      const errors = await validateForm(exclusivitySlotSchema, { value: slot.value, size: slot.size });
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

    const { found, messages } = await findFieldErrors(current);
    if (messages.length > 0) {
      setRowErrors(found);
      toast.error(messages[0]);
      return;
    }

    setSaving(true);
    setRowErrors({});
    try {
      const { body, indexMap } = toRequest(current);
      const result = await request<ActivationInventory>("PUT", routes.api.activationInventory, body);

      if (!result.view) {
        toast.error(errorMessage(result));
        if (result.status === 400 && !result.error?.data?.errors?.length) {
          // A catalog, category or id rule: the screen is out of date, so reload it.
          reload();
          return;
        }
        mapSaveErrors(result, indexMap);
        return;
      }

      // Replace the form with the saved view so new slots carry their ids into the next PUT.
      setLoaded({ catalog, form: buildForm(catalog, result.view, current.columns) });
      setDirty(false);
      toast.success("Activations saved.");
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
    save,
  };
}

function without(errors: RowErrors, key: string): RowErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}
