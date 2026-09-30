"use client";

import ColorPicker from "@/components/common/color-picker";
import FileUpload from "@/components/common/file-upload";
import type { FieldGroupProps } from "@/components/organization/form";

interface BrandingFieldsProps extends FieldGroupProps {
  existingLogoUrl?: string;
  onLogo: (file: File | null, url: string | null) => void;
}

export default function BrandingFields({ form, setValue, existingLogoUrl, onLogo }: BrandingFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <ColorPicker label="Primary Color" name="primaryColor" value={form.primaryColor} onChange={setValue("primaryColor")} />
        <ColorPicker label="Secondary Color" name="secondaryColor" value={form.secondaryColor} onChange={setValue("secondaryColor")} />
        <ColorPicker label="Accent Color" name="accentColor" value={form.accentColor} onChange={setValue("accentColor")} />
      </div>
      <FileUpload
        label="Team Logo"
        variant="image"
        existingUrl={existingLogoUrl}
        onFile={(file, url) => onLogo(file, url ?? null)}
        onClear={() => onLogo(null, null)}
      />
    </div>
  );
}
