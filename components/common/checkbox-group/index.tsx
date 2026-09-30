"use client";

import Checkbox from "@/components/common/checkbox";
import { cn } from "@/utils/cn";

interface CheckboxGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  // Currently selected options (any number).
  value: T[];
  onChange: (value: T[]) => void;
  error?: string;
  className?: string;
}

// Labelled multi-select: a wrapping row of checkbox chips.
export default function CheckboxGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  className,
}: CheckboxGroupProps<T>) {
  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="mb-2 text-base font-medium text-white">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const checked = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(option)}
              className={cn(
                "h-12 px-4 rounded-[8px] flex items-center gap-2 text-base font-medium text-white transition-colors",
                "border-2",
                checked ? "bg-white/15 border-steel-blue" : "bg-white/5 border-white/15 hover:bg-white/10",
                error && !checked && "border-error"
              )}
            >
              <Checkbox checked={checked} />
              {option}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </fieldset>
  );
}
