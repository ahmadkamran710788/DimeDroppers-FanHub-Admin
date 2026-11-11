import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface SignUpStepsProps {
  // The steps' names, in order ("Account", "Brand", "Review").
  steps: readonly string[];
  // One-based step in progress; earlier steps read as done.
  current: number;
}

// Progress across a sign-up: a bar per step with its number (a tick once done) and name. On a phone, a long
// list (the organisation's five) has no room for the names, so they're replaced by one "Step 2 of 5 ·
// Organization" line under the bars.
export default function SignUpSteps({ steps, current }: SignUpStepsProps) {
  const crowded = steps.length > 3;
  return (
    <div className="flex flex-col gap-3">
      <ol
        aria-label="Sign-up steps"
        className="grid gap-2"
        // One column per step (3 for sponsors, 5 for organisations).
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={label} className="flex flex-col gap-2 min-w-0" aria-current={active ? "step" : undefined}>
              <div className={cn("h-1 rounded-full", done || active ? "bg-[#8b6dff]" : "bg-[#2a2a2a]")} />
              <div className="flex gap-2 items-center min-w-0">
                <span
                  className={cn(
                    "size-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                    done ? "bg-[#8b6dff] text-white" : active ? "bg-white text-[#111]" : "bg-[#1f1f1f] text-[#8a8a8a]"
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} aria-label="Done" /> : step}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate text-sm font-semibold",
                    active ? "text-white" : done ? "text-[#d9ccff]" : "text-[#8a8a8a]",
                    // Still read out on a phone, just not shown.
                    crowded && "max-sm:sr-only"
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {crowded && (
        <p aria-hidden className="sm:hidden text-sm font-semibold text-white">
          Step {current} of {steps.length} · {steps[current - 1]}
        </p>
      )}
    </div>
  );
}
