"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface DateFieldProps {
  label: string;
  name: string;
  // ISO date (YYYY-MM-DD), or "" when empty.
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
}

// "2026-06-19" → "19 June, 2026" (design format), parsed as a local date.
const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "long" })}, ${d.getFullYear()}`;
};

/**
 * White select-style date field: shows the formatted date with a chevron and opens the
 * browser's native date picker. The native input stays in the DOM for keyboard/a11y.
 */
export default function DateField({
  label,
  name,
  value,
  onChange,
  placeholder = "Select date",
  min,
  error,
  className,
  labelClassName,
}: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className={cn("text-base font-medium text-white", labelClassName)}>
        {label}
      </label>
      <div
        onClick={open}
        className={cn(
          "relative h-12 w-full px-4 py-3 rounded-[8px] bg-white border-2 border-[rgba(11,28,45,0.11)] cursor-pointer",
          "flex items-center justify-between gap-2 focus-within:border-steel-blue transition-colors",
          error && "border-error focus-within:border-error"
        )}
      >
        <span className={cn("text-base font-medium truncate", value ? "text-midnight-navy" : "text-[rgba(11,28,45,0.4)]")}>
          {value ? formatDate(value) : placeholder}
        </span>
        <ChevronDown className="size-6 shrink-0 text-midnight-navy" strokeWidth={1.5} />
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
