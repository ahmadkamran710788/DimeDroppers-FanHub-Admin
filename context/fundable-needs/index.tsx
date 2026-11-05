"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { MOCK_CARD_PREFIX, SEED_NEEDS } from "@/components/organization/fundable-needs/data";
import { toIsoDate } from "@/utils/helper";
import type { FundableNeed, NeedInput, VirtualCard } from "@/utils/types/fundable-need";

// The organisation's fundable needs and their virtual cards, shared by Fundable Needs (list, create,
// edit) and Virtual Cards. There is no API yet, so the needs live here and are saved in this browser,
// starting from the sample needs.

const STORAGE_KEY = "fanhub.fundableNeeds.v1";

let store: FundableNeed[] | null = null;
const listeners = new Set<() => void>();

function readStore(): FundableNeed[] {
  if (store === null) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      store = saved ? (JSON.parse(saved) as FundableNeed[]) : SEED_NEEDS;
    } catch {
      // Storage blocked or corrupt — start from the sample needs.
      store = SEED_NEEDS;
    }
  }
  return store;
}

function writeStore(next: FundableNeed[]) {
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

const update = (change: (needs: FundableNeed[]) => FundableNeed[]) => writeStore(change(readStore()));

const updateNeed = (id: string, change: (need: FundableNeed) => FundableNeed) =>
  update((needs) => needs.map((n) => (n.id === id ? change(n) : n)));

const randomDigits = (length: number) => String(Math.floor(Math.random() * 10 ** length)).padStart(length, "0");

// Publishing a need issues its own card: empty, active, valid for three years.
function issueCard(): VirtualCard {
  const now = new Date();
  const last4 = randomDigits(4);
  return {
    last4,
    number: `${MOCK_CARD_PREFIX} ${last4}`,
    exp: `${String(now.getMonth() + 1).padStart(2, "0")}/${String((now.getFullYear() + 3) % 100).padStart(2, "0")}`,
    cvc: randomDigits(3),
    issuedOn: toIsoDate(now),
    frozen: false,
    transactions: [],
  };
}

interface FundableNeedsContextValue {
  // Newest first.
  needs: FundableNeed[];
  // False while the server render (and hydration) shows the sample needs; true once this browser's
  // saved needs are in, so a need that isn't there really doesn't exist.
  ready: boolean;
  // Creates a need with a new card, or updates the need with this id (its funding and card stay).
  saveNeed: (input: NeedInput, id?: string) => void;
  // A sponsor funds the need: the amount loads onto its card and the sponsor is listed on it.
  recordFunding: (needId: string, sponsor: string, amount: number) => void;
  setCardFrozen: (needId: string, frozen: boolean) => void;
}

const FundableNeedsContext = createContext<FundableNeedsContextValue | null>(null);

const noSubscribe = () => () => {};

export function FundableNeedsProvider({ children }: { children: ReactNode }) {
  const needs = useSyncExternalStore(subscribe, readStore, () => SEED_NEEDS);
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);

  const value = useMemo<FundableNeedsContextValue>(
    () => ({
      needs,
      ready,
      saveNeed: (input, id) => {
        if (id) updateNeed(id, (n) => ({ ...n, ...input }));
        else update((prev) => [{ id: `need-${Date.now()}`, ...input, contributions: [], card: issueCard() }, ...prev]);
      },
      recordFunding: (needId, sponsor, amount) =>
        updateNeed(needId, (n) => ({
          ...n,
          contributions: [...n.contributions, { sponsor, amount, date: toIsoDate(new Date()) }],
        })),
      setCardFrozen: (needId, frozen) => updateNeed(needId, (n) => ({ ...n, card: { ...n.card, frozen } })),
    }),
    [needs, ready]
  );

  return <FundableNeedsContext.Provider value={value}>{children}</FundableNeedsContext.Provider>;
}

export function useFundableNeeds() {
  const ctx = useContext(FundableNeedsContext);
  if (!ctx) throw new Error("useFundableNeeds must be used inside FundableNeedsProvider");
  return ctx;
}
