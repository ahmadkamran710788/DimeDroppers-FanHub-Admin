"use client";

import { cn } from "@/utils/cn";

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description: string;
  // Can't be picked yet; the reason goes in `description` or next to the group.
  disabled?: boolean;
}

interface RadioCardsProps<T extends string> {
  options: RadioCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // The id of the group's visible label.
  labelledBy: string;
  // Every card waits, e.g. while a change is saved.
  disabled?: boolean;
  className?: string;
}

// One choice as cards with a radio ring (title, ring and description): one row of equal cards, as many as there
// are options, stacked on phones. For dark cards (sponsor sign-up and Brand Assets).
export default function RadioCards<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  disabled = false,
  className,
}: RadioCardsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn("grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr gap-3", className)}
    >
      {options.map((option) => {
        const on = option.value === value;
        const off = disabled || Boolean(option.disabled);
        return (
          // A whole clickable card, not an action button.
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={off}
            onClick={() => !on && onChange(option.value)}
            className={cn(
              "text-left flex flex-col gap-[6px] p-[14px] rounded-[12px] border text-white transition-colors",
              on ? "bg-[#17151f] border-[#8b6dff]" : "bg-[#0b0b0b] border-[#333]",
              !on && !off && "hover:border-[#555]",
              off && !on && "opacity-55 cursor-not-allowed"
            )}
          >
            {/* At three across a title can wrap; the ring stays beside its first line. */}
            <span className="flex justify-between items-start gap-2">
              <span className="text-[17px] font-bold leading-tight">{option.label}</span>
              <span
                aria-hidden
                className={cn("size-5 shrink-0 rounded-full", on ? "border-[6px] border-[#8b6dff]" : "border-2 border-[#666]")}
              />
            </span>
            <span className="text-sm text-[#bdbdbd] leading-[1.45]">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
