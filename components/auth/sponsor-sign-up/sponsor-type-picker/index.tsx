"use client";

import { cn } from "@/utils/cn";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import { SPONSOR_TYPES, type SponsorType } from "@/components/auth/sponsor-sign-up/data";

interface SponsorTypePickerProps {
  value: SponsorType;
  onChange: (type: SponsorType) => void;
}

// Local business or national brand, as two cards with a radio ring.
export default function SponsorTypePicker({ value, onChange }: SponsorTypePickerProps) {
  return (
    <div className="flex flex-col gap-[10px]">
      <div id="sponsor-type-label" className={SECTION_LABEL}>
        SPONSOR TYPE
      </div>
      <div
        role="radiogroup"
        aria-labelledby="sponsor-type-label"
        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3"
      >
        {SPONSOR_TYPES.map((type) => {
          const on = type.value === value;
          return (
            // A whole clickable card (name, ring and description), not an action button.
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(type.value)}
              className={cn(
                "text-left flex flex-col gap-[6px] p-4 rounded-[12px] border text-white transition-colors",
                on ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#0b0b0b] border-[#333] hover:border-[#555]"
              )}
            >
              <span className="flex justify-between items-center gap-2">
                <span className="text-[17px] font-bold">{type.name}</span>
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
