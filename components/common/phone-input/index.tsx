"use client";

import { cn } from "@/utils/cn";
import { IMaskInput } from "react-imask";

interface PhoneInputProps {
  label: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function PhoneInput({
  label,
  name,
  value,
  onValueChange,
  placeholder = "(555) 123-4567",
  error,
  disabled = false,
  className,
}: PhoneInputProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-base font-medium text-white">
        {label}
      </label>
      <IMaskInput
        id={name}
        name={name}
        mask="(000) 000-0000"
        type="tel"
        value={value}
        onAccept={(val) => onValueChange(val)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.16)",
          backdropFilter: "blur(64px)",
        }}
        className={cn(
          "w-full h-12 rounded-[8px] bg-white text-midnight-navy text-base font-medium px-4 py-3",
          "border-2 border-[rgba(11,28,45,0.11)] outline-none",
          "focus:border-steel-blue transition-colors",
          "placeholder:text-[rgba(11,28,45,0.4)] disabled:opacity-50",
          error && "border-error focus:border-error"
        )}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
