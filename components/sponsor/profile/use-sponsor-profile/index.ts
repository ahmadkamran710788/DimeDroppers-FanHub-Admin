"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { POLL_LIMIT_MS, POLL_MS, isLookupActive, logoPath } from "@/components/sponsor/profile/data";
import { routes } from "@/utils/routes";
import type { SponsorProfileView, SponsorSignupOptions } from "@/utils/types/sponsor-profile";

const profileQueryKey = ["sponsor", "profile"] as const;

async function fetchProfile(): Promise<SponsorProfileView> {
  const r = await sponsorRequest<SponsorProfileView>("GET", routes.api.sponsorProfile);
  // Thrown so a failed reload keeps the last profile on screen.
  if (!r.view) throw new Error(r.message);
  return r.view;
}

// While the lookup is being followed, a reload brings the same logo with a new signature; keeping the link
// already shown stops the image from loading again every 5 seconds.
function keepLogoLink(old: unknown, next: unknown): unknown {
  const prev = old as SponsorProfileView | undefined;
  const fresh = next as SponsorProfileView;
  const kept = prev?.brand?.logoUrl;
  if (!kept || !fresh.brand || !isLookupActive(prev.locationsFetch.status)) return fresh;
  if (logoPath(kept) !== logoPath(fresh.brand.logoUrl)) return fresh;
  return { ...fresh, brand: { ...fresh.brand, logoUrl: kept } };
}

// The signed-in sponsor's profile (account, brand, locations), reloaded every few seconds while the automatic
// store lookup runs. TanStack Query is used for that polling only; saves are plain requests whose answer
// replaces the profile through `setProfile`. Also loads the sponsor options (types and categories) for editing.
export function useSponsorProfile() {
  const queryClient = useQueryClient();
  // Following the lookup stops after POLL_LIMIT_MS, even if it hasn't finished (it can be stuck queued).
  const [timedOut, setTimedOut] = useState(false);
  const [options, setOptions] = useState<SponsorSignupOptions | null>(null);

  const query = useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfile,
    structuralSharing: keepLogoLink,
    refetchInterval: (q) => (isLookupActive(q.state.data?.locationsFetch.status) && !timedOut ? POLL_MS : false),
  });
  const profile = query.data ?? null;
  const active = isLookupActive(profile?.locationsFetch.status);

  useEffect(() => {
    if (!active || timedOut) return;
    const timer = setTimeout(() => setTimedOut(true), POLL_LIMIT_MS);
    return () => clearTimeout(timer);
  }, [active, timedOut]);

  useEffect(() => {
    sponsorRequest<SponsorSignupOptions>("GET", routes.api.sponsorSignupOptions).then((r) => {
      if (r.view) setOptions(r.view);
      else toast.error(r.message ?? "Couldn't load the sponsor categories.");
    });
  }, []);

  // A save's answer: the full profile, or a change to the one shown.
  const setProfile = useCallback(
    (next: SponsorProfileView | ((current: SponsorProfileView) => SponsorProfileView)) => {
      queryClient.setQueryData<SponsorProfileView>(profileQueryKey, (current) =>
        typeof next === "function" ? current && next(current) : next
      );
    },
    [queryClient]
  );

  const { refetch } = query;
  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    // null until the first load; `failed` when that load didn't work.
    profile,
    options,
    failed: query.isError && !profile,
    // Still looking after POLL_LIMIT_MS: the list is shown as it is.
    lookupTimedOut: active && timedOut,
    reload,
    setProfile,
  };
}
