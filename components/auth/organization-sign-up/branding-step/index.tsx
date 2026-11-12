"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ColorPicker from "@/components/common/color-picker";
import HiddenFileInput from "@/components/common/hidden-file-input";
import Input from "@/components/common/input";
import { OUTLINE_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import StepHeading from "@/components/auth/sign-up-shared/step-heading";
import { GROUP_HEADING, INPUT } from "@/components/auth/sign-up-shared/styles";
import { logoRuleText, type OrgSignUpForm, type StepProps } from "@/components/auth/organization-sign-up/data";
import type { OrgSignUpOptions } from "@/utils/types/auth";

const HALF = "min-w-0 sm:col-span-3";
const THIRD = "min-w-0 sm:col-span-2";

const SOCIALS: { field: keyof OrgSignUpForm; label: string; placeholder: string }[] = [
  { field: "facebookUrl", label: "FACEBOOK", placeholder: "https://facebook.com/yourpage" },
  { field: "instagramUrl", label: "INSTAGRAM", placeholder: "https://instagram.com/yourhandle" },
  { field: "xUrl", label: "X", placeholder: "https://x.com/yourhandle" },
  { field: "youtubeUrl", label: "YOUTUBE", placeholder: "https://youtube.com/@yourchannel" },
  { field: "tiktokUrl", label: "TIKTOK", placeholder: "https://tiktok.com/@yourhandle" },
];

// Up to two initials for the logo tile ("North Florida Hoop Group" → "NF").
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "LOGO";

interface BrandingStepProps extends StepProps {
  // The picked logo and its preview (an object URL), or null.
  logo: { file: File; url: string } | null;
  onLogo: (file: File) => void;
  onRemoveLogo: () => void;
  // The API's logo rules (sign-up options).
  logoRules: OrgSignUpOptions["logo"];
}

// Step 4: how the Fan Hub looks. All optional; the colours start at the design's defaults.
export default function BrandingStep({
  form,
  errors,
  onField,
  onValue,
  logo,
  onLogo,
  onRemoveLogo,
  logoRules,
}: BrandingStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const tint = /^#[0-9a-fA-F]{6}$/.test(form.primaryColor) ? form.primaryColor : "#3f3f46";

  return (
    <section aria-label="Branding and social" className="flex flex-col gap-5">
      <StepHeading title="Branding & social" description="Make your Fan Hub look like you. All of this is optional." />

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-[18px] gap-y-[22px]">
        <div className="col-span-full flex flex-col gap-2">
          <span className={SECTION_LABEL}>TEAM LOGO</span>
          <div className="flex items-center gap-4">
            <span
              className="size-[72px] shrink-0 rounded-[16px] overflow-hidden flex items-center justify-center font-display font-black text-[26px] text-white"
              style={{ backgroundColor: logo ? "#ffffff" : tint }}
            >
              {logo ? (
                // A local preview (object URL), not a remote image.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.url} alt="Your logo" className="size-full object-contain" />
              ) : (
                initialsOf(form.organizationName || form.fullName)
              )}
            </span>
            <div className="flex flex-col gap-[6px] min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  label={logo ? "Replace logo" : "Upload logo"}
                  icon={<Upload className="size-4" />}
                  onClick={() => fileRef.current?.click()}
                  className={cn(OUTLINE_BUTTON, "h-11 px-4 rounded-[10px] text-[15px] font-medium")}
                />
                {logo && (
                  <Button variant="text" size="sm" label="Remove" onClick={onRemoveLogo} className="text-[#c9b8ff] hover:text-white" />
                )}
              </div>
              <span className="text-[13px] text-[#a8a8a8] truncate">{logo ? logo.file.name : logoRuleText(logoRules)}</span>
            </div>
            <HiddenFileInput ref={fileRef} accept={logoRules.types.join(",")} onFiles={([file]) => onLogo(file)} />
          </div>
          {errors.logo && <p className="text-sm text-error">{errors.logo}</p>}
        </div>

        <ColorPicker
          label="PRIMARY COLOR"
          name="org-primary-color"
          value={form.primaryColor}
          onChange={onValue("primaryColor")}
          error={errors.primaryColor}
          variant="dark"
          className={THIRD}
          labelClassName={SECTION_LABEL}
        />
        <ColorPicker
          label="SECONDARY COLOR"
          name="org-secondary-color"
          value={form.secondaryColor}
          onChange={onValue("secondaryColor")}
          error={errors.secondaryColor}
          variant="dark"
          className={THIRD}
          labelClassName={SECTION_LABEL}
        />
        <ColorPicker
          label="ACCENT COLOR"
          name="org-accent-color"
          value={form.accentColor}
          onChange={onValue("accentColor")}
          error={errors.accentColor}
          variant="dark"
          className={THIRD}
          labelClassName={SECTION_LABEL}
        />

        <h3 className={GROUP_HEADING}>Social networks</h3>

        {SOCIALS.map(({ field, label, placeholder }) => (
          <Input
            key={field}
            label={label}
            name={`org-${field}`}
            type="url"
            value={form[field]}
            onChange={onField(field)}
            placeholder={placeholder}
            error={errors[field]}
            variant="dark"
            className={HALF}
            labelClassName={SECTION_LABEL}
            inputClassName={INPUT}
          />
        ))}
      </div>
    </section>
  );
}
