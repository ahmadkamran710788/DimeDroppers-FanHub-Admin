"use client";

import Button from "@/components/common/button";
import type { FoundBusiness } from "@/components/common/location-picker/find-business";

interface BusinessChoiceProps {
  businesses: FoundBusiness[];
  onPick: (business: FoundBusiness) => void;
  onDismiss: () => void;
}

// The businesses at a picked address, for the sponsor to say which one is theirs.
export default function BusinessChoice({ businesses, onPick, onDismiss }: BusinessChoiceProps) {
  return (
    <div role="group" aria-label="Businesses at this address" className="flex flex-col gap-[10px] rounded-[8px] border border-white/15 bg-black/30 p-3">
      <p className="text-sm text-white/80">Is your business one of these? Pick it and we’ll fill in your category.</p>
      <div className="flex flex-wrap gap-2">
        {businesses.map((b) => (
          <Button
            key={b.id}
            size="sm"
            variant="outline"
            label={`${b.name} · ${b.type}`}
            onClick={() => onPick(b)}
            className="h-auto min-h-8 py-1 text-left whitespace-normal"
          />
        ))}
        <Button size="sm" variant="text" label="None of these" onClick={onDismiss} className="px-2" />
      </div>
    </div>
  );
}
