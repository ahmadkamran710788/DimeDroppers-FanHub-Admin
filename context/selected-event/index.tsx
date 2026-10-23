"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth";

export interface SelectedEvent {
  id: string;
  name: string;
}

interface SelectedEventContextValue {
  // The tournament event picked anywhere (Command Center, Schedule, Teams, Media, …); null until one is.
  event: SelectedEvent | null;
  setEvent: (event: SelectedEvent | null) => void;
}

const SelectedEventContext = createContext<SelectedEventContextValue | null>(null);

// Per organisation, so two accounts on one browser keep their own pick.
const storageKey = (orgId: string) => `fanhub:selected-event:${orgId}`;

function readStored(orgId: string): SelectedEvent | null {
  try {
    const raw = window.localStorage.getItem(storageKey(orgId));
    const parsed = raw ? (JSON.parse(raw) as SelectedEvent) : null;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(orgId: string, event: SelectedEvent | null) {
  try {
    if (event) window.localStorage.setItem(storageKey(orgId), JSON.stringify(event));
    else window.localStorage.removeItem(storageKey(orgId));
  } catch {
    // Storage blocked (private mode): the pick still holds for this visit.
  }
}

// One tournament event shared by every page's event picker, so picking it on one page picks it on all
// of them. Kept in localStorage, so it survives a refresh or a new tab.
export function SelectedEventProvider({ children }: { children: ReactNode }) {
  const { org } = useAuth();
  const orgId = org?.id ?? "";
  // The pick made this visit; before one, the stored pick (read once per organisation).
  const [picked, setPicked] = useState<{ orgId: string; event: SelectedEvent | null } | null>(null);
  const stored = useMemo(() => (orgId ? readStored(orgId) : null), [orgId]);
  const event = picked?.orgId === orgId ? picked.event : stored;

  const setEvent = useCallback(
    (next: SelectedEvent | null) => {
      // Until the organisation is known its stored pick isn't either, so an early auto-pick (the newest
      // event) would override it: ignore it; the picker asks again once the org has loaded.
      if (!orgId) return;
      setPicked({ orgId, event: next });
      writeStored(orgId, next);
    },
    [orgId]
  );

  const value = useMemo(() => ({ event, setEvent }), [event, setEvent]);
  return <SelectedEventContext.Provider value={value}>{children}</SelectedEventContext.Provider>;
}

export function useSelectedEvent(): SelectedEventContextValue {
  const ctx = useContext(SelectedEventContext);
  if (!ctx) throw new Error("useSelectedEvent must be used inside SelectedEventProvider");
  return ctx;
}
