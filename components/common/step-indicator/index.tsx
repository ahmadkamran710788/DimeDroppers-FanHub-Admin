import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface Step {
  title: string;
  subtitle?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  // Zero-based index of the step in progress; earlier steps read as done.
  current: number;
  className?: string;
}

// Numbered progress steps joined by lines (e.g. Category → Template → Customize → Publish).
export default function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", className)}>
      {steps.map((step, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <Fragment key={step.title}>
            {i > 0 && (
              <li
                aria-hidden
                className={cn("hidden md:block flex-1 min-w-6 max-w-24 h-px", i <= current ? "bg-[#A855F7]" : "bg-white/25")}
              />
            )}
            <li className="flex items-center gap-3" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "size-10 shrink-0 rounded-full flex items-center justify-center text-lg font-semibold",
                  active || done ? "text-white" : "border border-white/30 bg-white/[0.06] text-white"
                )}
                style={active || done ? { background: "linear-gradient(135deg,#8B5CF6,#A855F7)" } : undefined}
              >
                {done ? <Check className="size-5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="flex flex-col">
                <span className={cn("text-sm font-medium", active ? "text-[#C084FC]" : "text-white")}>{step.title}</span>
                {step.subtitle && <span className="text-xs text-white/60">{step.subtitle}</span>}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
