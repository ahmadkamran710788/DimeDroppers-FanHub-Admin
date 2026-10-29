"use client";

import { cn } from "@/utils/cn";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import type { SponsorTypeCode, SponsorTypeOption } from "@/utils/types/sponsor-profile";

interface SponsorTypePickerProps {
  // From the sponsor options: local business, regional brand and national brand.
  types: SponsorTypeOption[];
  value: SponsorTypeCode;
  onChange: (type: SponsorTypeCode) => void;
}

// The sponsor types as cards with a radio ring: one row of equal cards (as many as the API sends), stacked on phones.
export default function SponsorTypePicker({ types, value, onChange }: SponsorTypePickerProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      <div id="sponsor-type-label" className={SECTION_LABEL}>
        SPONSOR TYPE
      </div>
      <div
        role="radiogroup"
        aria-labelledby="sponsor-type-label"
        className="grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr gap-3"
      >
        {types.map((type) => {
          const on = type.code === value;
          return (
            // A whole clickable card (name, ring and description), not an action button.
            <button
              key={type.code}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(type.code)}
              className={cn(
                "text-left flex flex-col gap-[6px] p-[14px] rounded-[12px] border text-white transition-colors",
                on ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#0b0b0b] border-[#333] hover:border-[#555]"
              )}
            >
              {/* At three across a title can wrap; the ring stays beside its first line. */}
              <span className="flex justify-between items-start gap-2">
                <span className="text-[17px] font-bold leading-tight">{type.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "size-5 shrink-0 rounded-full",
                    on ? "border-[6px] border-[#8b6dff]" : "border-2 border-[#666]"
                  )}
                />
              </span>
              <span className="text-sm text-[#bdbdbd] leading-[1.45]">{type.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
