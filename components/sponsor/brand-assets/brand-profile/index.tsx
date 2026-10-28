"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import BrandLogo from "@/components/sponsor/brand-logo";
import { SPONSOR_CATEGORY_OPTIONS } from "@/components/sponsor/data";
import { CARD, FIELD, SECTION_LABEL } from "@/components/sponsor/styles";
import BrandColors from "@/components/sponsor/brand-assets/brand-colors";
import { BRAND_LOGO, BRAND_PROFILE } from "@/components/sponsor/brand-assets/data";
import { brandProfileSchema } from "@/components/sponsor/brand-assets/schema";

const INPUT = cn(FIELD, "h-12 py-0 px-[14px] text-[16px] min-w-0");

const { colors: INITIAL_COLORS, ...INITIAL_FORM } = BRAND_PROFILE;
type ProfileField = keyof typeof INITIAL_FORM;
type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// How the sponsor's brand reads to organizations: name, tagline, website, category, palette and
// usage notes. Saved in memory until the sponsor API is integrated.
export default function BrandProfile() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [colors, setColors] = useState(INITIAL_COLORS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Change handler for one field; editing it clears its error.
  const setField = (field: ProfileField) => (e: React.ChangeEvent<FieldElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  async function save() {
    if (!(await validateAndSetErrors(brandProfileSchema, form, setErrors))) return;
    toast.success("Brand profile saved");
  }

  return (
    <SectionCard title="Brand profile" className={cn(CARD, "flex-[1_1_320px] min-w-0 gap-[18px]")}>
      <div className="h-[140px] rounded-[12px] flex items-center justify-center" style={{ background: BRAND_LOGO.bg }}>
        <BrandLogo
          size="lg"
          wordmark={BRAND_LOGO.wordmark}
          markFill={BRAND_LOGO.markFill}
          wordColor={BRAND_LOGO.wordColor}
        />
      </div>

      <Input
        label="BRAND NAME"
        name="brand-name"
        value={form.name}
        onChange={setField("name")}
        error={errors.name}
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
      <Input
        label="TAGLINE"
        name="brand-tagline"
        value={form.tagline}
        onChange={setField("tagline")}
        error={errors.tagline}
        labelClassName={SECTION_LABEL}
        inputClassName={INPUT}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="WEBSITE"
          name="brand-website"
          value={form.website}
          onChange={setField("website")}
          error={errors.website}
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          inputClassName={INPUT}
        />
        <Select
          label="CATEGORY"
          name="brand-category"
          value={form.category}
          onChange={setField("category")}
          options={SPONSOR_CATEGORY_OPTIONS}
          error={errors.category}
          variant="dark"
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          selectClassName={cn(FIELD, "h-12 px-[10px] text-[16px] min-w-0")}
        />
      </div>

      <BrandColors colors={colors} onAdd={(color) => setColors((prev) => [...prev, color])} />

      <Textarea
        label="USAGE NOTES FOR ORGANIZATIONS"
        name="brand-notes"
        value={form.notes}
        onChange={setField("notes")}
        error={errors.notes}
        rows={3}
        maxLength={500}
        showCounter={false}
        fieldVariant="dark"
        labelClassName={SECTION_LABEL}
        fieldClassName={cn(FIELD, "px-[14px] py-3 text-[15px] resize-y")}
      />

      <Button
        label="Save profile"
        onClick={save}
        fullWidth
        className="h-12 min-w-0 bg-transparent border border-[#8b6dff] text-white rounded-[10px] text-base font-semibold backdrop-blur-none"
      />
    </SectionCard>
  );
}
