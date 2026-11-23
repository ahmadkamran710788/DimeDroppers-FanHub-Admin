"use client";

import { useEffect, useState } from "react";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { ActivationCategory } from "@/utils/types/activations";
import type { InventoryPage, SlotChipList } from "@/utils/types/sponsor-inventory";
import { PAGE_SIZE } from "@/components/sponsor/brand-placements/purchased-inventory/data";

// The category filter; "ALL" sends no category, so every organization is listed.
export type InventoryCategory = ActivationCategory | "ALL";

// A response with the request it answers, so an older one never shows for a newer request.
interface Loaded<T> {
  key: string;
  view?: T;
  error?: string;
}

// The answer to the load `key`. A reload in place (after a logo change) keeps what's shown when it fails.
function settle<T>(key: string, view: T | undefined, message: string | undefined) {
  return (prev: Loaded<T> | null): Loaded<T> =>
    view ? { key, view } : prev?.key === key && prev.view ? prev : { key, error: message };
}

// What the sponsor bought: the slots with their counts and shared logos (GET /inventory/slots, once) and the
// organizations with their packages and slots (GET /inventory) for the picked category. Active purchases only.
// Both load again in place when `logosVersion` changes (a logo was uploaded, replaced or deleted) or a slot's
// logo is picked.
export function usePurchasedInventory(logosVersion = 0) {
  const [category, setCategory] = useState<InventoryCategory>("ALL");
  const [page, setPage] = useState(1);
  // Bumped by Retry to load both again.
  const [reloads, setReloads] = useState(0);
  // Bumped after a slot's logo is picked, to load both again without a loader.
  const [refreshes, setRefreshes] = useState(0);
  const [chipList, setChipList] = useState<Loaded<SlotChipList> | null>(null);
  const [orgList, setOrgList] = useState<Loaded<InventoryPage> | null>(null);
  // The organization the setup panel and preview are for; the first on the page until one is picked.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The slot the setup panel is for; the selected organization's first slot until one is picked. It stays
  // picked when another organization with the same slot is selected.
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);

  const chipsKey = String(reloads);
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SlotChipList>("GET", routes.api.sponsorInventorySlots).then((r) => {
      if (!cancelled) setChipList(settle(chipsKey, r.view, r.message));
    });
    return () => {
      cancelled = true;
    };
  }, [chipsKey, refreshes, logosVersion]);

  // null while loading.
  const chips = chipList?.key === chipsKey ? chipList : null;
  const allChips = chips?.view?.items ?? [];
  const summary = chips?.view?.summary;
  // The categories with something bought, in the backend's order (Pre Game → … → Physical Assets).
  const categories = summary?.categories.filter((c) => c.slots > 0) ?? [];
  // A category with nothing bought any more falls back to All (once the counts are in).
  const activeCategory =
    !summary || category === "ALL" || categories.some((c) => c.category === category) ? category : "ALL";

  const orgsKey = `${activeCategory}|${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<InventoryPage>("GET", routes.api.sponsorInventory, {
      params: {
        category: activeCategory === "ALL" ? undefined : activeCategory,
        page,
        limit: PAGE_SIZE,
      },
    }).then((r) => {
      if (!cancelled) setOrgList(settle(orgsKey, r.view, r.message));
    });
    return () => {
      cancelled = true;
    };
  }, [orgsKey, activeCategory, page, refreshes, logosVersion]);

  // The answer for this category and page; null while it loads.
  const orgs = orgList?.key === orgsKey ? orgList : null;
  // What the list shows: that answer, else (while another category or page loads) the last list, so the
  // section keeps its height instead of collapsing to a loader and making the page jump.
  const view = orgs ? orgs.view : orgList?.view;

  const items = view?.items ?? [];
  const selected = items.find((i) => i.organization.id === selectedId) ?? items[0] ?? null;
  // The selected organization's slots in the category (the list holds only those), one per slot, in the
  // slot list's order.
  const slotChips = selected ? allChips.filter((c) => selected.slots.some((slot) => slot.catalogKey === c.catalogKey)) : [];
  const chip = slotChips.find((c) => c.catalogKey === pickedSlot) ?? slotChips[0] ?? null;

  return {
    summary,
    categories,
    category: activeCategory,
    chipsLoading: !chips,
    chipsError: chips?.error,
    // Nothing to show yet (the first load).
    orgsLoading: !orgs && !view,
    // The last list is on screen while the picked category or page loads.
    orgsPending: !orgs && !!view,
    orgsError: orgs?.error,
    items,
    pagination: view?.pagination,
    page,
    selected,
    slotChips,
    chip,
    pickCategory: (next: InventoryCategory) => {
      setCategory(next);
      setPage(1);
    },
    pickSlot: setPickedSlot,
    setPage,
    select: setSelectedId,
    retry: () => setReloads((n) => n + 1),
    // After a slot's logo is picked: both load again in place.
    refresh: () => setRefreshes((n) => n + 1),
  };
}
