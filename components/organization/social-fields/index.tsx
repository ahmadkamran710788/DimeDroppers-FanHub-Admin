"use client";

import Input from "@/components/common/input";
import { FIELD_LABEL, type FieldGroupProps } from "@/components/organization/form";

// Social networks, with their icon per row.
export const SOCIAL_FIELDS = [
  { field: "facebookUrl", label: "Facebook", icon: "/icons/step1/fb.svg" },
  { field: "instagramUrl", label: "Instagram", icon: "/icons/step1/insta.svg" },
  { field: "xUrl", label: "X (Former Twitter)", icon: "/icons/step1/x.svg" },
  { field: "youtubeUrl", label: "Youtube", icon: "/icons/step1/yt.svg" },
  { field: "tiktokUrl", label: "TikTok", icon: "/icons/step1/tiktok.svg" },
] as const;

export default function SocialFields({ form, errors, set }: FieldGroupProps) {
  return (
    <div className="flex flex-col gap-6">
      {SOCIAL_FIELDS.map(({ field, label, icon }) => (
        <Input
          key={field}
          label={label}
          name={field}
          value={form[field]}
          onChange={set(field)}
          placeholder="https://"
          type="url"
          error={errors[field]}
          // eslint-disable-next-line @next/next/no-img-element
          icon={<img src={icon} alt="" className="w-6 h-6" />}
          labelClassName={FIELD_LABEL}
        />
      ))}
    </div>
  );
}
