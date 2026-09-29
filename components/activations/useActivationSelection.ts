"use client";

import { useSetup } from "@/context/setup";
import { routes } from "@/utils/routes";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { CATEGORIES, FEATURE_LINK_KEY, RECOMMENDED_FOR_YOU, SAVED_LINK_FIELD } from "@/components/activations/data";

// Shared selection / URL / ordering / save state for the activation board. Used by the
// dashboard Activations page.
export function useActivationSelection() {
  const { savedSchool, refreshSchool } = useSetup();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Per-activation URL entered once an activation is selected.
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Per-category display order (drag-to-reorder, purely visual).
  const [order, setOrder] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, c.activations.map((a) => a.id)]))
  );
  const dragRef = useRef<{ catId: string; id: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Prefill from the saved school's feature links the first time it's available, during
  // render (React's "adjust state on prop change" pattern). The `hydrated` guard stops
  // later savedSchool updates (e.g. refreshSchool() after save) from overwriting the
  // user's in-progress local changes.
  if (!hydrated && savedSchool) {
    setHydrated(true);
    const restoredSelected = new Set<string>();
    const restoredUrls: Record<string, string> = {};
    for (const [id, field] of Object.entries(SAVED_LINK_FIELD)) {
      const value = savedSchool[field];
      if (typeof value === "string" && value) {
        restoredSelected.add(id);
        restoredUrls[id] = value;
      }
    }
    if (restoredSelected.size > 0) {
      setSelected(restoredSelected);
      setUrls(restoredUrls);
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setUrls((u) => {
          const copy = { ...u };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearAll = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setUrls((prev) => {
      const copy = { ...prev };
      ids.forEach((id) => delete copy[id]);
      return copy;
    });
  };

  const applyRecommended = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      RECOMMENDED_FOR_YOU.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const setUrl = (id: string, value: string) => setUrls((p) => ({ ...p, [id]: value }));

  // PATCH the entered feature-link URLs for the selected activations. Returns true on
  // success so the caller can decide where to navigate. Only selected activations with a
  // non-empty URL are sent; blanks are omitted.
  const saveFeatureLinks = async (): Promise<boolean> => {
    const schoolId = sessionStorage.getItem("fanhub:schoolId");
    if (!schoolId) {
      toast.error("No school found. Please complete Step 1 first.");
      return false;
    }

    const links: Record<string, string> = {};
    for (const [id, key] of Object.entries(FEATURE_LINK_KEY)) {
      links[key] = selected.has(id) ? (urls[id]?.trim() ?? "") : "";
    }

    setSaving(true);
    try {
      const res = await fetch(routes.api.proxyFeatureLinks, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...links }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || "Couldn't save your activations. Please try again.");
        return false;
      }
      toast.success("Activations saved.");
      await refreshSchool();
      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startDrag = (catId: string, id: string) => {
    dragRef.current = { catId, id };
    setDraggingId(id);
  };

  const endDrag = () => {
    dragRef.current = null;
    setDraggingId(null);
  };

  const handleDrop = (catId: string, targetId: string) => {
    const src = dragRef.current;
    endDrag();
    if (!src || src.catId !== catId || src.id === targetId) return;
    setOrder((prev) => {
      const list = [...prev[catId]];
      const from = list.indexOf(src.id);
      const to = list.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      list.splice(from, 1);
      list.splice(to, 0, src.id);
      return { ...prev, [catId]: list };
    });
  };

  const total = selected.size;
  const counts = {
    gameDay: CATEGORIES[0].activations.filter((a) => selected.has(a.id)).length,
    support: CATEGORIES[1].activations.filter((a) => selected.has(a.id)).length,
    engage: CATEGORIES[2].activations.filter((a) => selected.has(a.id)).length,
  };

  return {
    selected,
    urls,
    setUrl,
    saving,
    order,
    draggingId,
    toggle,
    selectAll,
    clearAll,
    applyRecommended,
    saveFeatureLinks,
    startDrag,
    endDrag,
    handleDrop,
    total,
    counts,
  };
}
