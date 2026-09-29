import { cn } from "@/utils/cn";
import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  error?: string;
  className?: string;
}

// "− 3 +" number control. The middle value is also typeable.
export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99_999,
  label = "Quantity",
  error,
  className,
}: QuantityStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const btn =
    "size-10 shrink-0 flex items-center justify-center text-midnight-navy hover:bg-midnight-navy/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "inline-flex items-center rounded-[8px] border bg-[#F5F6F8] overflow-hidden",
          error ? "border-error" : "border-[rgba(11,28,45,0.12)]"
        )}
      >
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - 1))} disabled={value <= min} className={btn}>
          <Minus className="size-4" strokeWidth={2.5} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="w-14 h-10 bg-transparent text-center text-base font-semibold text-midnight-navy outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + 1))} disabled={value >= max} className={btn}>
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
