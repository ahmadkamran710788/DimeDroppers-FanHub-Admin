"use client";

import { cn } from "@/utils/cn";
import { useRef } from "react";

interface ColorPickerProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  // E.g. a navy label inside a white dialog.
  labelClassName?: string;
  // "light" (default): white field. "dark": near-black field with white text, as on the sign-up forms.
  variant?: "light" | "dark";
}

export default function ColorPicker({
  label,
  name,
  value,
  onChange,
  error,
  className,
  labelClassName,
  variant = "light",
}: ColorPickerProps) {
  const dark = variant === "dark";
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const hex = raw.startsWith("#") ? raw : `#${raw}`;
    onChange(hex);
  };

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={`${name}-hex`} className={cn("text-base font-medium text-white", labelClassName)}>
        {label}
      </label>
      <div
        className={cn(
          "relative flex items-center overflow-hidden",
          dark
            ? "h-[52px] rounded-[10px] bg-[#0b0b0b] border border-[#333]"
            : "h-12 rounded-[8px] bg-white border-2 border-[rgba(11,28,45,0.11)]",
          error && "border-error"
        )}
      >
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className="flex-shrink-0 w-12 h-full flex items-center justify-center p-1"
          aria-label="Open color picker"
        >
          <span
            className="w-10 h-10 rounded-[4px] border-2 border-[rgba(255,255,255,0.5)] block"
            style={{ backgroundColor: isValidHex ? value : "#000000" }}
          />
        </button>
        <input
          id={`${name}-hex`}
          name={name}
          type="text"
          value={value}
          onChange={handleHexChange}
          maxLength={7}
          className={cn(
            "flex-1 min-w-0 h-full px-2 text-base font-medium outline-none bg-transparent",
            dark ? "text-white font-mono uppercase" : "text-midnight-navy"
          )}
        />
        <input
          ref={colorInputRef}
          type="color"
          value={isValidHex ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
