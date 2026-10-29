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

type DisplayAccount = SponsorAccount & {
  displayName: string;
  initials: string;
  brandName: string | null;
  // The brand's logo (a signed link), shown in place of the initials.
  logoUrl: string | null;
};

const toDisplay = (
  account: SponsorAccount,
  brand: { name: string; logoUrl: string | null } | null
): DisplayAccount => {
  const displayName = account.name?.trim() || account.email;
  return {
    ...account,
    displayName,
    initials: initialsOf(displayName),
    brandName: brand?.name ?? null,
    logoUrl: brand?.logoUrl ?? null,
  };
};

// The signed-in sponsor for the header and sidebar: the profile from /me once it has answered (with
// the brand and its logo), else the account kept from sign-in, so the header is filled straight away.
// null before sign-in or on the server.
export function useSponsorAccount(): DisplayAccount | null {
  const { sponsor } = useAuth();
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => {
    if (sponsor) return toDisplay(sponsor, sponsor.brand);
    if (!raw) return null;
    try {
      return toDisplay(JSON.parse(raw) as SponsorAccount, null);
    } catch {
      return null;
    }
  }, [sponsor, raw]);
}
