"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { formatAddress, locationLabel } from "@/components/sponsor/profile/data";
import { routes } from "@/utils/routes";
import type { SponsorLocation } from "@/utils/types/sponsor-profile";

// A store the search can be near, as the Locations picker lists it.
export interface SponsorStore {
  id: string;
  label: string;
  // The address, when the label is the store's name (many stores share the brand's name).
  hint?: string;
}

// The brand's stores that can be searched near: only those with a point on the map. null while loading; a
// failed load leaves the list empty, so the search runs anywhere.
export function useSponsorStores(): SponsorStore[] | null {
  const [stores, setStores] = useState<SponsorStore[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SponsorLocation[]>("GET", routes.api.sponsorLocations).then((r) => {
      if (cancelled) return;
      if (!r.view) toast.error(r.message ?? "Couldn't load your locations.");
      setStores(
        (r.view ?? [])
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
