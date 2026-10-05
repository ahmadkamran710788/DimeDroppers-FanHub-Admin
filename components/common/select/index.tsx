"use client";

import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";
import { type ReactNode } from "react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  icon?: ReactNode;
  error?: string;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  // Extra utilities for the <select> itself (e.g. a white fill).
  selectClassName?: string;
  disabled?: boolean;
  // Adds a red asterisk after the label.
  required?: boolean;
  // "light" (default): light-grey field. "dark": translucent field with white text on dark cards.
  variant?: "light" | "dark";
}

export default function Select({
  label,
  name,
  value,
  onChange,
  options,
  icon,
  error,
  placeholder,
  className,
  labelClassName,
  selectClassName,
  disabled,
  required,
  variant = "light",
}: SelectProps) {
  const dark = variant === "dark";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className={cn("text-base font-medium text-midnight-navy", labelClassName)}>
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span
            className={cn(
              "absolute left-3 w-6 h-6 flex items-center justify-center pointer-events-none z-10",
              dark ? "text-white" : "text-[#0B1C2D]"
            )}
          >
            {icon}
          </span>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "w-full h-12 rounded-[8px] text-base font-medium leading-normal px-4 appearance-none outline-none border",
            dark
              ? "bg-white/[0.06] text-white border-white/15"
              : "bg-[#F5F6F8] text-midnight-navy border-[rgba(11,28,45,0.12)]",
            "focus:border-steel-blue transition-colors cursor-pointer",
            "disabled:opacity-50",
            icon && "pl-10",
            selectClassName,
            error && "border-error focus:border-error"
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            // Native option lists render on a light popup, so keep their text dark.
            <option key={opt.value} value={opt.value} className="text-midnight-navy">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn("absolute right-3 w-5 h-5 pointer-events-none", dark ? "text-white" : "text-midnight-navy")}
          strokeWidth={2}
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
