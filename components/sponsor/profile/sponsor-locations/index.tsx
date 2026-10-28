"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import LocationForm from "@/components/sponsor/profile/location-form";
import LocationRow from "@/components/sponsor/profile/location-row";
import { LOCATIONS, type LocationForm as LocationFields, type SponsorLocation } from "@/components/sponsor/profile/data";
import { CARD_TITLE, PROFILE_CARD, SMALL_BUTTON } from "@/components/sponsor/profile/styles";

// The sponsor's locations, the centers of their organization search. Added and removed in memory
// until the sponsor API is integrated.
export default function SponsorLocations() {
  const [locations, setLocations] = useState<SponsorLocation[]>(LOCATIONS);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<SponsorLocation | null>(null);
  const nextId = useRef(0);

  const count = locations.length === 1 ? "1 location" : `${locations.length} locations`;

  function add(location: LocationFields) {
    nextId.current += 1;
    setLocations((prev) => [...prev, { ...location, id: `new-${nextId.current}` }]);
    setAdding(false);
    toast.success(`${location.name} added`);
  }

  return (
    <section aria-label="Sponsor locations" className={cn(PROFILE_CARD, "flex flex-col gap-4")}>
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h3 className={CARD_TITLE}>Sponsor locations</h3>
          <p className="text-sm text-[#a8a8a8] mt-[2px]">{count} · used as the center of your search radius</p>
        </div>
        <Button
          label="Add location"
          icon={<Plus className="size-4" strokeWidth={2.4} />}
          onClick={() => setAdding(true)}
          disabled={adding}
          className={cn(SMALL_BUTTON, "bg-[#2a2148] border border-[#8b6dff] text-white font-bold")}
        />
      </div>

      {locations.map((location, i) => (
        <LocationRow
          key={location.id}
          location={location}
          primary={i === 0}
          onRemove={() => setRemoving(location)}
        />
      ))}

      {locations.length === 0 && (
        <p className="border-[1.5px] border-dashed border-[#333] rounded-[12px] p-6 text-center text-[15px] text-[#bdbdbd]">
          No locations yet. Add at least one so we can show organizations near you.
        </p>
      )}

      {adding && <LocationForm onSave={add} onCancel={() => setAdding(false)} />}

      <ConfirmModal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove location"
        message={`Remove “${removing?.name}” from your locations?`}
        confirmLabel="Remove"
        busyLabel="Removing…"
        destructive
        onConfirm={async () => {
          if (removing) {
            setLocations((prev) => prev.filter((l) => l.id !== removing.id));
            toast.success(`${removing.name} removed`);
          }
          return true;
        }}
      />
    </section>
  );
}
