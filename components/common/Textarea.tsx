"use client";

import { cn } from "@/utils/cn";

interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  error?: string;
  className?: string;
}

export default function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  maxLength = 250,
  rows = 4,
  error,
  className,
}: TextareaProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-base font-medium text-white">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "w-full rounded-[8px] bg-white text-midnight-navy text-base font-medium px-4 py-3",
          "border-2 border-[rgba(11,28,45,0.11)] outline-none resize-none",
          "focus:border-steel-blue transition-colors",
          "placeholder:text-[rgba(11,28,45,0.4)]",
          error && "border-error focus:border-error"
        )}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-sm text-error">{error}</p>
        ) : (
          <span />
        )}
        <span className="text-sm text-[rgba(255,255,255,0.4)]">
          {value.length}/{maxLength} Characters
        </span>
      </div>
    </div>
  );
}
