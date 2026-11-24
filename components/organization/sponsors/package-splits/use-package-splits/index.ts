"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PackageSplitSettings, PackageSplitSettingsInput } from "@/utils/types/sponsor-packages";

// The organisation's max price per package and the parts each one gives (GET / PUT /org/sponsor-packages/splits),
// for the organisation, or for one event of a tournament (`eventId`). `key` is empty until there's something to
// load (the org type is known, and a tournament has picked its event); a new key loads again.
export function usePackageSplits(key: string, eventId?: string) {
  const [loaded, setLoaded] = useState<{ key: string; view?: PackageSplitSettings; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    sponsorRequest<PackageSplitSettings>("GET", routes.api.orgSponsorPackageSplits, {
      params: eventId ? { eventId } : undefined,
    }).then((r) => {
      if (!cancelled) setLoaded({ key, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, eventId]);

  const current = loaded?.key === key ? loaded : null;

  // Saves the packages that changed (null removes a max); the answer is the new settings. false when it failed
  // (the backend's message is shown).
  async function save(packages: PackageSplitSettingsInput["packages"]) {
    if (!key || packages.length === 0) return false;
    setSaving(true);
    const body: PackageSplitSettingsInput = { ...(eventId && { eventId }), packages };
    const r = await sponsorRequest<PackageSplitSettings>("PUT", routes.api.orgSponsorPackageSplits, { body });
    setSaving(false);
    if (!r.view) {
      toast.error(r.message ?? "Couldn't save the max prices, please try again.");
      return false;
    }
    setLoaded({ key, view: r.view });
    toast.success("Max prices saved");
    return true;
  }

  return { view: current?.view ?? null, error: current?.error, loading: Boolean(key) && !current, saving, save };
}
