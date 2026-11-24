"use client";

import RadioCards from "@/components/common/radio-cards";
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
      <RadioCards
        options={types.map((type) => ({ value: type.code, label: type.label, description: type.description }))}
        value={value}
        onChange={onChange}
        labelledBy="sponsor-type-label"
      />
    </div>
  );
}
