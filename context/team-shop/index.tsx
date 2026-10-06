"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { sampleProducts, type ProductStatus, type TeamShopProduct } from "@/components/team-shop/data";

// Team Shop products per team id, shared by the Team Shop page and every "Add to Store" button.
// There is no products API yet, so the store lives here and is saved in this browser.

type Store = Record<string, TeamShopProduct[]>;

const STORAGE_KEY = "fanhub.teamShop.v1";
// Server render (and hydration) see no saved changes; the browser then switches to localStorage.
const SERVER_SNAPSHOT: Store = {};

let store: Store | null = null;
const listeners = new Set<() => void>();

function readStore(): Store {
  if (store === null) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as Store) : {};
      // blob: image previews don't survive a reload, so drop products that relied on one.
      store = Object.fromEntries(
        Object.entries(parsed).map(([id, list]) => [id, list.filter((p) => !p.image.startsWith("blob:"))])
      );
    } catch {
      // Storage blocked or corrupt — start from the sample data.
      store = {};
    }
  }
  return store;
}

function writeStore(next: Store) {
  store = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked — changes still apply for this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

interface TeamShopContextValue {
  productsFor: (teamId: string) => TeamShopProduct[];
  addProduct: (product: TeamShopProduct) => void;
  removeProduct: (teamId: string, productId: string) => void;
  setStatus: (teamId: string, productId: string, status: ProductStatus) => void;
  // Teams whose shop already has a product made from this game content.
  teamsWithSource: (sourceId: string) => string[];
}

const TeamShopContext = createContext<TeamShopContextValue | null>(null);

export function TeamShopProvider({ children }: { children: ReactNode }) {
  // Only teams the admin has changed are stored; others fall back to the sample catalogue.
  const byTeam = useSyncExternalStore(subscribe, readStore, () => SERVER_SNAPSHOT);

  const productsFor = useCallback((teamId: string) => byTeam[teamId] ?? sampleProducts(teamId), [byTeam]);

  const update = useCallback((teamId: string, change: (prev: TeamShopProduct[]) => TeamShopProduct[]) => {
    const current = readStore();
    writeStore({ ...current, [teamId]: change(current[teamId] ?? sampleProducts(teamId)) });
  }, []);

  const value = useMemo<TeamShopContextValue>(
    () => ({
      productsFor,
      addProduct: (product) => update(product.teamId, (prev) => [product, ...prev]),
      removeProduct: (teamId, productId) => update(teamId, (prev) => prev.filter((p) => p.id !== productId)),
      setStatus: (teamId, productId, status) =>
        update(teamId, (prev) => prev.map((p) => (p.id === productId ? { ...p, status } : p))),
      teamsWithSource: (sourceId) =>
        Object.entries(byTeam)
          .filter(([, list]) => list.some((p) => p.sourceId === sourceId))
          .map(([teamId]) => teamId),
    }),
    [byTeam, productsFor, update]
  );

  return <TeamShopContext.Provider value={value}>{children}</TeamShopContext.Provider>;
}

export function useTeamShop() {
  const ctx = useContext(TeamShopContext);
  if (!ctx) throw new Error("useTeamShop must be used inside TeamShopProvider");
  return ctx;
}
