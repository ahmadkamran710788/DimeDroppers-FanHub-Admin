"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import ColorPicker from "@/components/common/color-picker";
import Modal from "@/components/common/modal";
import { SECTION_LABEL } from "@/components/sponsor/styles";
import { MAX_BRAND_COLORS } from "@/components/sponsor/brand-assets/data";
import { brandColorSchema } from "@/components/sponsor/brand-assets/schema";

// Where the picker starts when adding a color.
const NEW_COLOR = "#FFFFFF";

interface BrandColorsProps {
  colors: string[];
  onAdd: (color: string) => void;
}

// The brand palette: a swatch per color, and a "+" that adds one through a color picker.
export default function BrandColors({ colors, onAdd }: BrandColorsProps) {
  const [adding, setAdding] = useState(false);
  const [color, setColor] = useState(NEW_COLOR);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function open() {
    setColor(NEW_COLOR);
    setErrors({});
    setAdding(true);
  }

  async function add() {
    if (!(await validateAndSetErrors(brandColorSchema(colors), { color }, setErrors))) return;
    onAdd(color.toUpperCase());
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className={SECTION_LABEL}>BRAND COLORS</div>
      <div className="flex flex-wrap gap-3">
        {colors.map((c) => (
          <div key={c} className="flex flex-col gap-[6px] items-center">
            <div className="size-[52px] rounded-[10px] border border-white/15" style={{ background: c }} />
            <span className="text-xs text-[#c4c4c4]">{c}</span>
          </div>
        ))}
        {colors.length < MAX_BRAND_COLORS && (
          <Button
            size="icon"
            icon={<Plus className="size-6" strokeWidth={1.5} />}
            aria-label="Add brand color"
            onClick={open}
            className="size-[52px] rounded-[10px] bg-transparent border border-dashed border-[#555] text-[#c4c4c4] backdrop-blur-none hover:border-[#8b6dff]"
          />
        )}
      </div>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add brand color">
        <div className="w-full flex flex-col gap-6">
          <ColorPicker
            label="Color"
            name="brandColor"
            value={color}
            onChange={(value) => {
              setColor(value);
              if (errors.color) setErrors((prev) => ({ ...prev, color: "" }));
            }}
            error={errors.color}
            labelClassName="text-midnight-navy"
          />
          <div className="flex gap-3">
            <Button label="Cancel" variant="secondary" onClick={() => setAdding(false)} fullWidth />
            <Button label="Add color" variant="cta" onClick={add} fullWidth />
          </div>
        </div>
      </Modal>
    </div>
  );
}
