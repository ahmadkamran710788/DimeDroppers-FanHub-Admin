"use client";

import { useEffect, useState } from "react";
import { routes } from "@/utils/routes";
import { ZIP_CODE } from "@/components/sponsor/profile/data";

// The Fetch locations picker's city lists and ZIP code places, from our /api/us-places routes. Each is
// fetched once per page visit and kept here, so a state picked again (or a ZIP typed twice) answers at once.

export interface ZipPlace {
  zip: string;
  city: string;
  state: string;
}

// A ZIP code is looked up once typing has paused this long.
const ZIP_DELAY_MS = 300;

const cityLists = new Map<string, string[]>();
const zipPlaces = new Map<string, ZipPlace | null>();

async function loadCities(state: string): Promise<string[] | null> {
  try {
    const res = await fetch(routes.api.usPlacesCities(state));
    if (!res.ok) return null;
    const { cities } = (await res.json()) as { cities: string[] };
    cityLists.set(state, cities);
    return cities;
  } catch {
    return null;
  }
}

// undefined when the lookup itself failed (asked again next time); null when the list doesn't have the ZIP.
async function loadZip(zip: string): Promise<ZipPlace | null | undefined> {
  try {
    const res = await fetch(routes.api.usPlacesZip(zip));
    if (res.status === 404) {
      zipPlaces.set(zip, null);
      return null;
    }
    if (!res.ok) return undefined;
    const place = (await res.json()) as ZipPlace;
    zipPlaces.set(zip, place);
    return place;
  } catch {
    return undefined;
  }
}

// Every city of a state (two-letter code), A to Z; nothing while no state is picked.
export function useStateCities(state: string) {
  const [loaded, setLoaded] = useState<{ state: string; cities: string[] | null } | null>(null);
  const cached = state ? cityLists.get(state) : undefined;

  useEffect(() => {
    if (!state || cityLists.has(state)) return;
    let cancelled = false;
    loadCities(state).then((cities) => {
      if (!cancelled) setLoaded({ state, cities });
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  const current = loaded?.state === state ? loaded : null;
  const cities = cached ?? current?.cities ?? null;
  return {
    cities: cities ?? [],
    loading: Boolean(state) && !cached && !current,
    failed: Boolean(state) && !cached && current?.cities === null,
  };
}

// The city and state of a typed ZIP code (ZIP+4 is looked up by its first 5 digits). undefined while it isn't
// a ZIP code yet, is being looked up, or the lookup failed; null when the ZIP list doesn't have it.
export function useZipPlace(typed: string): ZipPlace | null | undefined {
  const zip = ZIP_CODE.test(typed.trim()) ? typed.trim().slice(0, 5) : "";
  const [loaded, setLoaded] = useState<{ zip: string; place: ZipPlace | null | undefined } | null>(null);

  useEffect(() => {
    if (!zip || zipPlaces.has(zip)) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      loadZip(zip).then((place) => {
        if (!cancelled) setLoaded({ zip, place });
      });
    }, ZIP_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [zip]);

  if (!zip) return undefined;
  if (zipPlaces.has(zip)) return zipPlaces.get(zip);
  return loaded?.zip === zip ? loaded.place : undefined;
}
