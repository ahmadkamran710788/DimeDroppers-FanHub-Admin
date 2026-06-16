"use client";

import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

interface InputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export default function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  error,
  type = "text",
  disabled = false,
  className,
  labelClassName,
}: InputProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className={cn("text-base font-medium text-midnight-navy", labelClassName)}>
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 w-6 h-6 text-midnight-navy flex items-center justify-center pointer-events-none z-10">
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full h-12 rounded-[8px] bg-[#F5F6F8] text-midnight-navy text-base font-medium px-4 py-3",
            "border border-[rgba(11,28,45,0.12)] outline-none",
            "focus:border-steel-blue transition-colors",
            "placeholder:text-[rgba(11,28,45,0.4)] disabled:opacity-50",
            icon && "pl-10",
            error && "border-error focus:border-error"
          )}
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
