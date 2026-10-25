"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/context/auth";
import { SPONSOR_ACCOUNT_KEY } from "@/utils/auth/session";
import type { SponsorAccount } from "@/utils/types/auth";

const readRaw = () => {
  try {
    return localStorage.getItem(SPONSOR_ACCOUNT_KEY);
  } catch {
    return null;
  }
};

// Another tab signing in or out updates this one too.
const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "S";

type DisplayAccount = SponsorAccount & { displayName: string; initials: string; brandName: string | null };

const toDisplay = (account: SponsorAccount, brandName: string | null): DisplayAccount => {
  const displayName = account.name?.trim() || account.email;
  return { ...account, displayName, initials: initialsOf(displayName), brandName };
};

// The signed-in sponsor for the header and sidebar: the profile from /me once it has answered (with
// the brand), else the account kept from sign-in, so the header is filled straight away. null before
// sign-in or on the server.
export function useSponsorAccount(): DisplayAccount | null {
  const { sponsor } = useAuth();
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => {
    if (sponsor) return toDisplay(sponsor, sponsor.brand?.name ?? null);
    if (!raw) return null;
    try {
      return toDisplay(JSON.parse(raw) as SponsorAccount, null);
    } catch {
      return null;
    }
  }, [sponsor, raw]);
}
