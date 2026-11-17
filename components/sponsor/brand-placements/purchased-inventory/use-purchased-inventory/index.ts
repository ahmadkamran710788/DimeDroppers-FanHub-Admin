"use client";

import { useEffect, useState } from "react";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { InventoryPage, SlotChipList } from "@/utils/types/sponsor-inventory";
import { PAGE_SIZE } from "@/components/sponsor/brand-placements/purchased-inventory/data";

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

// What the sponsor bought: the slot chips (GET /inventory/slots, once) and the organizations with their
// packages and slots (GET /inventory) for the picked slot chip. Active purchases only. Both load again in place
// when `logosVersion` changes (a logo was uploaded, replaced or deleted) or a slot's logo is picked.
export function usePurchasedInventory(logosVersion = 0) {
  // The picked slot's catalogKey; the first chip until one is picked.
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  // Bumped by Retry to load both again.
  const [reloads, setReloads] = useState(0);
  // Bumped after a slot's logo is picked, to load both again without a loader.
  const [refreshes, setRefreshes] = useState(0);
  const [chipList, setChipList] = useState<Loaded<SlotChipList> | null>(null);
  const [orgList, setOrgList] = useState<Loaded<InventoryPage> | null>(null);
  // The organization the setup panel and preview are for; the first on the page until one is picked.
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
  const catalogKey = allChips.some((c) => c.catalogKey === pickedKey) ? pickedKey : (allChips[0]?.catalogKey ?? null);

  const orgsKey = `${catalogKey}|${page}|${reloads}`;
  useEffect(() => {
    // Waits for the chips: the list is always for one slot.
    if (!catalogKey) return;
    let cancelled = false;
    sponsorRequest<InventoryPage>("GET", routes.api.sponsorInventory, {
      params: {
        catalogKeys: catalogKey,
        page,
        limit: PAGE_SIZE,
      },
    }).then((r) => {
      if (!cancelled) setOrgList(settle(orgsKey, r.view, r.message));
    });
    return () => {
      cancelled = true;
    };
  }, [orgsKey, catalogKey, page, refreshes, logosVersion]);

  // null while loading.
  const orgs = orgList?.key === orgsKey ? orgList : null;

  const items = orgs?.view?.items ?? [];
  const selected = items.find((i) => i.organization.id === selectedId) ?? items[0] ?? null;

  return {
    summary: chips?.view?.summary,
    chips: allChips,
    catalogKey,
    chip: allChips.find((c) => c.catalogKey === catalogKey) ?? null,
    chipsLoading: !chips,
    chipsError: chips?.error,
    orgsLoading: !orgs,
    orgsError: orgs?.error,
    items,
    pagination: orgs?.view?.pagination,
    page,
    selected,
    pickSlot: (key: string) => {
      setPickedKey(key);
      setPage(1);
    },
    setPage,
    select: setSelectedId,
    retry: () => setReloads((n) => n + 1),
    // After a slot's logo is picked: both load again in place.
    refresh: () => setRefreshes((n) => n + 1),
  };
}
