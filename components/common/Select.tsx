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
}: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-base font-medium text-white">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 w-6 h-6 text-[#0B1C2D] flex items-center justify-center pointer-events-none z-10">
            {icon}
          </span>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full h-12 rounded-[8px] bg-white text-midnight-navy text-base font-medium px-4 py-3 appearance-none",
            "border-2 border-[rgba(11,28,45,0.11)] outline-none",
            "focus:border-steel-blue transition-colors cursor-pointer",
            "disabled:opacity-50",
            icon && "pl-10",
            error && "border-error focus:border-error"
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 w-5 h-5 text-midnight-navy pointer-events-none"
          strokeWidth={2}
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
