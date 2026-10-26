"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import type { SponsorCartItem, SponsorCartLine } from "@/utils/types/sponsor-packages";

// The sponsor's cart: packages and physical assets from any number of organisations, activated together
// from the cart page. There is no cart table, so it lives in this browser, one cart per signed-in sponsor.

// The batch takes 1 – 50 items.
export const CART_MAX_ITEMS = 50;

const STORAGE_PREFIX = "sponsorCart:";
// Server render (and hydration), and before the sponsor is known: an empty cart.
const EMPTY: SponsorCartLine[] = [];

// The same item, as the API counts duplicates: school + event + tier or physical asset.
export const cartItemKey = (item: SponsorCartItem) =>
  [item.schoolId, item.eventId ?? "", item.tier ?? "", item.physicalAssetId ?? ""].join("|");

// Each cart read once from localStorage, then kept here; writes go to both.
const carts = new Map<string, SponsorCartLine[]>();
const listeners = new Set<() => void>();

function readCart(storageKey: string): SponsorCartLine[] {
  const cached = carts.get(storageKey);
  if (cached) return cached;
  let lines = EMPTY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (Array.isArray(parsed)) lines = parsed as SponsorCartLine[];
  } catch {
    // Storage blocked or corrupt: start empty.
  }
  carts.set(storageKey, lines);
  return lines;
}

function writeCart(storageKey: string, lines: SponsorCartLine[]) {
  carts.set(storageKey, lines);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(lines));
  } catch {
    // Storage full or blocked: the cart still works in this tab.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed a cart (or cleared storage): read it again.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null) carts.clear();
    else if (e.key.startsWith(STORAGE_PREFIX)) carts.delete(e.key);
    else return;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

interface SponsorCartContextValue {
  lines: SponsorCartLine[];
  has: (item: SponsorCartItem) => boolean;
  // null once added, else why it can't be (already in the cart, cart full, no sponsor yet).
  add: (line: Omit<SponsorCartLine, "key">) => string | null;
  remove: (key: string) => void;
  // Takes the new prices (line key → cents) the sponsor accepted: shown and sent as expectedTotalCents.
  acceptPrices: (prices: Record<string, number>) => void;
  clear: () => void;
}

const SponsorCartContext = createContext<SponsorCartContextValue | null>(null);

export function SponsorCartProvider({ children }: { children: ReactNode }) {
  const sponsorId = useSponsorAccount()?.id ?? null;
  const storageKey = sponsorId ? `${STORAGE_PREFIX}${sponsorId}` : null;
  const getSnapshot = useCallback(() => (storageKey ? readCart(storageKey) : EMPTY), [storageKey]);
  const lines = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const value = useMemo<SponsorCartContextValue>(() => {
    const update = (change: (prev: SponsorCartLine[]) => SponsorCartLine[]) => {
      if (storageKey) writeCart(storageKey, change(readCart(storageKey)));
    };
    const keys = new Set(lines.map((l) => l.key));
    return {
      lines,
      has: (item) => keys.has(cartItemKey(item)),
      add: (line) => {
        if (!storageKey) return "Your account is still loading, please try again.";
        const key = cartItemKey(line.item);
        const current = readCart(storageKey);
        if (current.some((l) => l.key === key)) return "Already in your cart";
        if (current.length >= CART_MAX_ITEMS) return `Your cart holds at most ${CART_MAX_ITEMS} items`;
        writeCart(storageKey, [...current, { ...line, key }]);
        return null;
      },
      remove: (key) => update((prev) => prev.filter((l) => l.key !== key)),
      acceptPrices: (prices) =>
        update((prev) =>
          prev.map((l) =>
            prices[l.key] === undefined
              ? l
              : { ...l, totalCents: prices[l.key], item: { ...l.item, expectedTotalCents: prices[l.key] } }
          )
        ),
      clear: () => update(() => []),
    };
  }, [lines, storageKey]);

  return <SponsorCartContext.Provider value={value}>{children}</SponsorCartContext.Provider>;
}

export function useSponsorCart() {
  const ctx = useContext(SponsorCartContext);
  if (!ctx) throw new Error("useSponsorCart must be used inside SponsorCartProvider");
  return ctx;
}
