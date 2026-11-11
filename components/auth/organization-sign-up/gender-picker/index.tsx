"use client";

import { cn } from "@/utils/cn";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import { GENDER_OPTIONS } from "@/components/auth/organization-sign-up/data";

interface GenderPickerProps {
  value: string;
  onChange: (gender: string) => void;
  error?: string;
}

// Boys / Girls / Coed as radio pills (the design's single choice in a row).
export default function GenderPicker({ value, onChange, error }: GenderPickerProps) {
  return (
    <div className="col-span-full flex flex-col gap-2">
      <span id="org-gender-label" className={SECTION_LABEL}>
        GENDER
      </span>
      <div role="radiogroup" aria-labelledby="org-gender-label" className="flex flex-wrap gap-[10px]">
        {GENDER_OPTIONS.map((gender) => {
          const on = value === gender;
          return (
            // A radio option drawn as a pill, not an action button.
            <button
              key={gender}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(gender)}
              className={cn(
                "flex items-center gap-[10px] min-h-12 px-[18px] rounded-[12px] border text-[15px] text-white transition-colors",
                on
                  ? "bg-[#17153a] border-[#6d5df5]"
                  : cn("bg-[#0b0b0b] hover:border-[#555]", error ? "border-error" : "border-[#333]")
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-4 shrink-0 rounded-full",
                  on ? "border-[5px] border-[#8b7cff] bg-white" : "border-2 border-[#71717a]"
                )}
              />
              {gender}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
