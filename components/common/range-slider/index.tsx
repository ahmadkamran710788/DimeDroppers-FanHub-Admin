"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface RangeSliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max" | "step"> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  // The value as people read it, at the end of the label row ("120%").
  valueText?: string;
  // Overrides the label row's text style (e.g. navy on a white modal).
  labelClassName?: string;
  error?: string;
  className?: string;
}

// A labelled slider for a number in a range, e.g. a zoom level.
export default function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueText,
  labelClassName,
  error,
  className,
  id,
  ...props
}: RangeSliderProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      <div className={cn("flex items-baseline justify-between gap-3 text-sm font-medium text-white", labelClassName)}>
        <label htmlFor={inputId}>{label}</label>
        {valueText && <span className="tabular-nums opacity-70">{valueText}</span>}
      </div>
      <input
        {...props}
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "w-full h-2 cursor-pointer accent-[#6a4be6] disabled:cursor-not-allowed disabled:opacity-50",
          error && "accent-red-500"
        )}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
