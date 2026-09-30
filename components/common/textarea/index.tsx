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
  // "onDark" (default): white label on a dark page. "onLight": navy label inside a white dialog.
  variant?: "onDark" | "onLight";
  // Show the character counter on the label row instead of under the field.
  counterInLabel?: boolean;
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
  variant = "onDark",
  counterInLabel = false,
}: TextareaProps) {
  const onLight = variant === "onLight";
  const counter = (
    <span className={cn("text-sm", onLight ? "text-midnight-navy/50" : "text-[rgba(255,255,255,0.4)]")}>
      {value.length}/{maxLength} Characters
    </span>
  );
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={name} className={cn("text-base font-medium", onLight ? "text-midnight-navy" : "text-white")}>
          {label}
        </label>
        {counterInLabel && counter}
      </div>
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
      {counterInLabel ? (
        error && <p className="text-sm text-error">{error}</p>
      ) : (
        <div className="flex items-center justify-between">
          {error ? <p className="text-sm text-error">{error}</p> : <span />}
          {counter}
        </div>
      )}
    </div>
  );
}
