"use client";

import { useEffect, useState } from "react";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { InventoryPage, SlotChipList } from "@/utils/types/sponsor-inventory";
import { ALL_SLOTS, PAGE_SIZE, type CategoryTab } from "@/components/sponsor/brand-assets/purchased-inventory/data";

// A response with the request it answers, so an older one never shows for a newer request.
interface Loaded<T> {
  key: string;
  view?: T;
  error?: string;
}

// What the sponsor bought: the slot chips (GET /inventory/slots, once) and the organizations with their
// packages and slots (GET /inventory), filtered by category tab and slot chip. Active purchases only.
export function usePurchasedInventory() {
  const [category, setCategory] = useState<CategoryTab>("ALL");
  // The picked slot's catalogKey, or ALL_SLOTS.
  const [catalogKey, setCatalogKey] = useState(ALL_SLOTS);
  const [page, setPage] = useState(1);
  // Bumped by Retry to load both again.
  const [reloads, setReloads] = useState(0);
  const [chipList, setChipList] = useState<Loaded<SlotChipList> | null>(null);
  const [orgList, setOrgList] = useState<Loaded<InventoryPage> | null>(null);
  // The organization the setup panel and preview are for; the first on the page until one is picked.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chipsKey = String(reloads);
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SlotChipList>("GET", routes.api.sponsorInventorySlots).then((r) => {
      if (!cancelled) setChipList({ key: chipsKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [chipsKey]);

  const orgsKey = `${category}|${catalogKey}|${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<InventoryPage>("GET", routes.api.sponsorInventory, {
      params: {
        category: category === "ALL" ? undefined : category,
        catalogKeys: catalogKey || undefined,
        page,
        limit: PAGE_SIZE,
      },
    }).then((r) => {
      if (!cancelled) setOrgList({ key: orgsKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [orgsKey, category, catalogKey, page]);

  // null while loading.
  const chips = chipList?.key === chipsKey ? chipList : null;
  const orgs = orgList?.key === orgsKey ? orgList : null;

  const summary = chips?.view?.summary;
  const allChips = chips?.view?.items ?? [];
  // A category tab shows only that category's slots.
  const shownChips = category === "ALL" ? allChips : allChips.filter((c) => c.category === category);
  const tabCount = category === "ALL" ? summary : summary?.categories.find((c) => c.category === category);

  const items = orgs?.view?.items ?? [];
  const selected = items.find((i) => i.organization.id === selectedId) ?? items[0] ?? null;

  return {
    summary,
    category,
    // Only the categories something was bought in.
    tabs: ["ALL", ...(summary?.categories.filter((c) => c.slots > 0).map((c) => c.category) ?? [])] as CategoryTab[],
    chips: shownChips,
    // Organizations under the open tab, on the "All slots" chip.
    tabOrganizations: tabCount?.organizations ?? 0,
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
    // A tab or chip narrows each organization's slots.
    filtered: category !== "ALL" || catalogKey !== ALL_SLOTS,
    pickCategory: (next: CategoryTab) => {
      setCategory(next);
      setCatalogKey(ALL_SLOTS);
      setPage(1);
    },
    // The picked chip again goes back to all slots.
    pickSlot: (key: string) => {
      setCatalogKey((prev) => (key === prev ? ALL_SLOTS : key));
      setPage(1);
    },
    setPage,
    select: setSelectedId,
    retry: () => setReloads((n) => n + 1),
  };
}
