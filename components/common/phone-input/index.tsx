"use client";

import { cn } from "@/utils/cn";
import type { ReactNode } from "react";
import { IMaskInput } from "react-imask";

interface PhoneInputProps {
  // A node so part of the label can be styled differently (e.g. a muted "optional").
  label: ReactNode;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  // Overrides the label colour (e.g. navy inside a white modal).
  labelClassName?: string;
  // Extra utilities for the <input> itself.
  inputClassName?: string;
  // "light" (default): white glass field. "dark": translucent field with white text on dark cards.
  variant?: "light" | "dark";
  // Adds a red asterisk after the label.
  required?: boolean;
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
  labelClassName,
  inputClassName,
  variant = "light",
  required,
}: PhoneInputProps) {
  const dark = variant === "dark";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className={cn("text-base font-medium text-white", labelClassName)}>
        {label}
        {required && <span className="text-error"> *</span>}
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
        style={
          dark
            ? undefined
            : {
                boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.16)",
                backdropFilter: "blur(64px)",
              }
        }
        className={cn(
          "w-full h-12 rounded-[8px] text-base font-medium px-4 py-3 outline-none",
          "focus:border-steel-blue transition-colors disabled:opacity-50",
          dark
            ? "h-[52px] bg-black/30 text-white border border-white/25 placeholder:text-white/50"
            : "bg-white text-midnight-navy border-2 border-[rgba(11,28,45,0.11)] placeholder:text-[rgba(11,28,45,0.4)]",
          inputClassName,
          error && "border-error focus:border-error"
        )}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
