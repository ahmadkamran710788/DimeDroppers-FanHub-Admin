"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatAddress, locationLabel } from "@/components/sponsor/profile/data";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { SponsorLocation } from "@/utils/types/sponsor-profile";

// A store the search can be near, as the Locations picker lists it.
export interface SponsorStore {
  id: string;
  label: string;
  // The address, when the label is the store's name (many stores share the brand's name).
  hint?: string;
}

// GET /fanhub/sponsor-profile/locations answers the stores as the whole `data` list (the API puts a list
// there as is), not data[0]; null when it fails.
async function loadLocations(): Promise<SponsorLocation[] | null> {
  try {
    const res = await backendFetch(routes.api.sponsorLocations, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json?.data) ? (json.data as SponsorLocation[]) : null;
  } catch {
    return null;
  }
}

// The brand's stores that can be searched near: only those with a point on the map. null while loading; a
// failed load leaves the list empty, so the search runs anywhere instead of waiting.
export function useSponsorStores(): SponsorStore[] | null {
  const [stores, setStores] = useState<SponsorStore[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLocations().then((locations) => {
      if (cancelled) return;
      if (!locations) toast.error("Couldn't load your locations, so organizations are shown from anywhere.");
      setStores(
        (locations ?? [])
          .filter((l) => l.latitude !== null && l.longitude !== null)
          .map((l) => {
            const address = formatAddress(l);
            return { id: l.id, label: locationLabel(l), ...(l.name && address && { hint: address }) };
          })
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return stores;
}
