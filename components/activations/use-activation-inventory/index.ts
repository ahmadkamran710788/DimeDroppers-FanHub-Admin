"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CATEGORY_ORDER, VISIBLE_CATEGORIES } from "@/components/activations/data";
import { buildForm, toRequest, type FormSlot, type InventoryForm } from "@/components/activations/helpers";
import { slotValueSchema } from "@/components/activations/schema";
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

const NETWORK_ERROR = "Please check your network and try again.";

// backendFetch (not apiCall) so the backend's own message and `data.errors` reach us untoasted:
// apiCall replaces a 400 with generic text, and a 404 on GET / just means "no inventory yet".
async function request<T>(method: "GET" | "POST" | "PUT", endpoint: string, body?: ActivationInventoryRequest): Promise<ApiResult<T>> {
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
  // Whether the inventory exists yet: PUT saves it, otherwise POST creates it.
  exists: boolean;
}

// State and saving for the Activations page: every slot of the org's type with its checkbox
// ("show to sponsors") and value.
export function useActivationInventory() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loads, setLoads] = useState(0);
  // The load (by `loads` count) that finished, failed or not.
  const [settledLoad, setSettledLoad] = useState(-1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // Value problems (before or from the last save), keyed by row.
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      request<ActivationCatalog>("GET", routes.api.activationCatalog),
      request<ActivationInventory>("GET", routes.api.activationInventory),
    ]).then(([catalog, inventory]) => {
      if (cancelled) return;
      setSettledLoad(loads);
      // A 404 on the inventory is the normal first visit: nothing created yet.
      const inventoryFailed = !inventory.view && inventory.status !== 404;
      if (!catalog.view || inventoryFailed) {
        toast.error(errorMessage(catalog.view ? inventory : catalog));
        return;
      }
      setLoaded({ catalog: catalog.view, form: buildForm(catalog.view, inventory.view ?? null), exists: !!inventory.view });
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

  // ---- Checkbox, value and order ----
  // Unticking only hides the slot from sponsors: its value (and any placements) are kept.

  const toggle = (category: ActivationCategory, rowKey: string) =>
    updateSlot(category, rowKey, (s) => ({ ...s, enabled: !s.enabled }));

  const setValue = (category: ActivationCategory, rowKey: string, value: string) =>
    updateSlot(category, rowKey, (s) => ({ ...s, value }));

  const selectAll = (category: ActivationCategory) =>
    updateColumn(category, (slots) => slots.map((s) => ({ ...s, enabled: true })));

  const clearAll = (category: ActivationCategory) =>
    updateColumn(category, (slots) => slots.map((s) => ({ ...s, enabled: false })));

  const selectRecommended = () =>
    update((f) => ({
      ...f,
      columns: mapColumns(f.columns, (s, category) =>
        VISIBLE_CATEGORIES.includes(category) && s.isRecommended && !s.retired ? { ...s, enabled: true } : s
      ),
    }));

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

  // Every ticked slot needs a valid value (its field is showing).
  const findValueErrors = async (f: InventoryForm) => {
    const found: Record<string, string> = {};
    for (const slot of CATEGORY_ORDER.flatMap((c) => f.columns[c])) {
      if (!slot.enabled) continue;
      const errors = await validateForm(slotValueSchema, { value: slot.value });
      if (errors.value) found[slot.rowKey] = `${slot.name}: ${errors.value}`;
    }
    return found;
  };

  const mapSaveErrors = (result: ApiResult<unknown>, indexMap: string[]) => {
    const found: Record<string, string> = {};
    for (const { path, message } of result.error?.data?.errors ?? []) {
      const [root, index] = path.split(".");
      const rowKey = root === "activations" ? indexMap[Number(index)] : undefined;
      if (rowKey) found[rowKey] ??= message;
    }
    setRowErrors(found);
  };

  const save = async () => {
    if (!loaded || saving) return;
    const { catalog, form: current, exists } = loaded;

    const valueErrors = await findValueErrors(current);
    if (Object.keys(valueErrors).length > 0) {
      setRowErrors(valueErrors);
      toast.error(Object.values(valueErrors)[0]);
      return;
    }

    setSaving(true);
    setRowErrors({});
    try {
      const { body, indexMap } = toRequest(current);
      let result = await request<ActivationInventory>(exists ? "PUT" : "POST", routes.api.activationInventory, body);
      // The inventory is gone (PUT before any POST): create it instead.
      if (exists && result.status === 404) {
        result = await request<ActivationInventory>("POST", routes.api.activationInventory, body);
      }

      if (!result.view) {
        if (result.status === 409) {
          // Created meanwhile (another tab or admin): load it so the user reviews it before saving.
          toast.error("Your organisation already has activations saved. We've loaded them — review and save again.");
          reload();
          return;
        }
        toast.error(errorMessage(result));
        if (result.status === 400 && !result.error?.data?.errors?.length) {
          // A catalog, type or id rule: the screen is out of date, so reload it.
          reload();
          return;
        }
        mapSaveErrors(result, indexMap);
        return;
      }

      // Replace the form with the saved view so new slots carry their ids into the next PUT.
      const saved = buildForm(catalog, result.view, current.columns);
      setLoaded({ catalog, form: saved, exists: true });
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
    exists: loaded?.exists ?? false,
    reload,
    dirty,
    saving,
    rowErrors,
    toggle,
    setValue,
    selectAll,
    clearAll,
    selectRecommended,
    reorder,
    save,
  };
}

function without(errors: Record<string, string>, key: string): Record<string, string> {
  const next = { ...errors };
  delete next[key];
  return next;
}

function mapColumns(
  columns: InventoryForm["columns"],
  fn: (slot: FormSlot, category: ActivationCategory) => FormSlot
): InventoryForm["columns"] {
  return Object.fromEntries(CATEGORY_ORDER.map((c) => [c, columns[c].map((s) => fn(s, c))])) as InventoryForm["columns"];
}
