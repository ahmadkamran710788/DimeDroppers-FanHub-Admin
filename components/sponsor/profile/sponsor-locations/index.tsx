"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Pagination from "@/components/common/pagination";
import { sponsorRequest, type SponsorApiResult } from "@/components/sponsor/sponsor-api";
import LocationForm from "@/components/sponsor/profile/location-form";
import LocationRow from "@/components/sponsor/profile/location-row";
import LookupStatus from "@/components/sponsor/profile/lookup-status";
import {
  LOCATION_FIELDS,
  PAGE_SIZE,
  locationFields,
  locationLabel,
  type LocationFields,
} from "@/components/sponsor/profile/data";
import { CARD_TITLE, PROFILE_CARD, SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type {
  RemovedSponsorLocation,
  SponsorLocation,
  SponsorLocationFetch,
  SponsorLocationInput,
  SponsorProfileView,
} from "@/utils/types/sponsor-profile";

// The form's fields as the API names them; "" is not given (null when it clears a saved value).
const toInput = (f: LocationFields) => ({
  name: f.name || null,
  address: f.street || null,
  city: f.city || null,
  state: f.state || null,
  zipCode: f.zip || null,
});

// The pin typed in the form, or null when it's left empty (the form checks both or neither).
const formPoint = (f: LocationFields) =>
  f.latitude && f.longitude ? { latitude: Number(f.latitude), longitude: Number(f.longitude) } : null;

// A new location: only the parts that were filled in.
const newLocationInput = (f: LocationFields): SponsorLocationInput => ({
  ...Object.fromEntries(Object.entries(toInput(f)).filter(([, value]) => value !== null)),
  ...formPoint(f),
});

// An edited location: only the parts that changed. A changed pin is sent whole (the API takes latitude and
// longitude together) and wins; otherwise a changed address is placed on the map again.
const changedLocationInput = (location: SponsorLocation, f: LocationFields): SponsorLocationInput => {
  const saved = locationFields(location);
  const moved = f.latitude !== saved.latitude || f.longitude !== saved.longitude;
  return {
    ...Object.fromEntries(Object.entries(toInput(f)).filter(([key, value]) => value !== location[key as keyof SponsorLocation])),
    ...(moved ? formPoint(f) : null),
  };
};

interface SponsorLocationsProps {
  locations: SponsorLocation[];
  lookup: SponsorLocationFetch;
  lookupTimedOut: boolean;
  // Applies a saved change to the profile shown.
  onChange: (update: (profile: SponsorProfileView) => SponsorProfileView) => void;
  // Reloads the profile, e.g. when a location was already removed elsewhere.
  reload: () => void;
}

// The sponsor's locations, the centers of their organization search: the stores found automatically after
// sign-up and the ones added here. Paged PAGE_SIZE at a time (a national brand can have hundreds); they all
// come with the profile, so the pages are cut here.
export default function SponsorLocations({ locations, lookup, lookupTimedOut, onChange, reload }: SponsorLocationsProps) {
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<SponsorLocation | null>(null);
  // At the cap of locations added by hand; the found ones don't count. Removing one frees a place.
  const [limitReached, setLimitReached] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const count = locations.length === 1 ? "1 location" : `${locations.length} locations`;
  const pageCount = Math.max(1, Math.ceil(locations.length / PAGE_SIZE));
  // A removal (or a reload with fewer) can leave the page past the end: show the last one instead.
  const current = Math.min(page, pageCount);
  const from = (current - 1) * PAGE_SIZE;
  const pageLocations = locations.slice(from, from + PAGE_SIZE);

  // Another page replaces the list; back to the card's top so it isn't below the fold.
  function goToPage(next: number) {
    setPage(next);
    sectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // A refused save: field errors for the form to show, or null when it was shown here instead.
  function refused(r: SponsorApiResult<unknown>): Record<string, string> | null {
    const message = r.message ?? "Couldn't save the location. Try again.";
    // Gone already (another tab), or a bad id: the list is out of date.
    if (r.status === 404 || r.errors?.some((e) => e.path === "locationId")) {
      toast.error(message);
      setEditingId(null);
      reload();
      return null;
    }
    // 409 is either the location cap or a duplicate address; only the message tells them apart.
    if (r.status === 409 && /maximum number/i.test(message)) {
      toast.error(message);
      setAdding(false);
      setLimitReached(true);
      return null;
    }
    if (r.status === 409) return { street: message };
    const fields: Record<string, string> = {};
    for (const err of r.errors ?? []) {
      const field = LOCATION_FIELDS[err.path];
      if (field && !fields[field]) fields[field] = err.message;
    }
    if (Object.keys(fields).length) return fields;
    // A 400 without a field is about the address: nothing to place it by, or not found on the map.
    if (r.status === 400) return { street: message };
    toast.error(message);
    return null;
  }

  async function add(fields: LocationFields) {
    const r = await sponsorRequest<SponsorLocation>("POST", routes.api.sponsorLocations, {
      body: newLocationInput(fields),
    });
    if (!r.view) return refused(r);
    const added = r.view;
    // It goes at the end of the list: open the last page, where it is.
    setPage(Math.ceil((locations.length + 1) / PAGE_SIZE));
    onChange((profile) => ({ ...profile, locations: [...profile.locations, added] }));
    setAdding(false);
    toast.success(`${locationLabel(added)} added`);
    return null;
  }

  async function update(location: SponsorLocation, fields: LocationFields) {
    const body = changedLocationInput(location, fields);
    if (Object.keys(body).length === 0) {
      setEditingId(null);
      return null;
    }
    const r = await sponsorRequest<SponsorLocation>("PATCH", routes.api.sponsorLocation(location.id), { body });
    if (!r.view) return refused(r);
    const saved = r.view;
    onChange((profile) => ({ ...profile, locations: profile.locations.map((l) => (l.id === saved.id ? saved : l)) }));
    setEditingId(null);
    toast.success(`${locationLabel(saved)} saved`);
    return null;
  }

  async function remove(location: SponsorLocation) {
    const r = await sponsorRequest<RemovedSponsorLocation>("DELETE", routes.api.sponsorLocation(location.id));
    if (!r.view) {
      toast.error(r.message ?? "Couldn't remove the location. Try again.");
      // Already removed elsewhere: show the list as it is now.
      if (r.status === 404) reload();
      return r.status === 404;
    }
    onChange((profile) => ({ ...profile, locations: profile.locations.filter((l) => l.id !== location.id) }));
    if (location.source === "MANUAL") setLimitReached(false);
    toast.success(`${locationLabel(location)} removed`);
    return true;
  }

  return (
    <section ref={sectionRef} aria-label="Sponsor locations" className={cn(PROFILE_CARD, "flex flex-col gap-4 scroll-mt-4")}>
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h3 className={CARD_TITLE}>Sponsor locations</h3>
          <p className="text-sm text-[#a8a8a8] mt-[2px]">{count} · used as the center of your search radius</p>
        </div>
        <Button
          label="Add location"
          icon={<Plus className="size-4" strokeWidth={2.4} />}
          onClick={() => setAdding(true)}
          disabled={adding || limitReached}
          className={cn(SMALL_BUTTON, "bg-[#2a2148] border border-[#8b6dff] text-white font-bold")}
        />
      </div>

      <LookupStatus lookup={lookup} timedOut={lookupTimedOut} />

      {adding && <LocationForm onSave={add} onCancel={() => setAdding(false)} />}

      {pageLocations.map((location) =>
        editingId === location.id ? (
          <LocationForm
            key={location.id}
            initial={locationFields(location)}
            onSave={(fields) => update(location, fields)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <LocationRow
            key={location.id}
            location={location}
            onEdit={() => setEditingId(location.id)}
            onRemove={() => setRemoving(location)}
          />
        )
      )}

      {pageCount > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <span className="text-xs text-white/80">
            {`Showing ${from + 1} to ${from + pageLocations.length} of ${locations.length} locations`}
          </span>
          <Pagination page={current} pageCount={pageCount} onChange={goToPage} />
        </div>
      )}

      {locations.length === 0 && (
        <p className="border-[1.5px] border-dashed border-[#333] rounded-[12px] p-6 text-center text-[15px] text-[#bdbdbd]">
          No locations yet. Add at least one so we can show organizations near you.
        </p>
      )}

      <ConfirmModal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove location"
        message={
          removing?.source === "AI"
            ? `Remove “${removing && locationLabel(removing)}”? It was found automatically and won’t be found again.`
            : `Remove “${removing && locationLabel(removing)}” from your locations?`
        }
        confirmLabel="Remove"
        busyLabel="Removing…"
        destructive
        onConfirm={async () => (removing ? remove(removing) : true)}
      />
    </section>
  );
}
