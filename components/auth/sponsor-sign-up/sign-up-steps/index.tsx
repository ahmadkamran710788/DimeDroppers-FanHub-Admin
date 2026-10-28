import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { STEPS } from "@/components/auth/sponsor-sign-up/data";

interface SignUpStepsProps {
  // One-based step in progress; earlier steps read as done.
  current: number;
}

// Progress across the sign-up: a bar per step with its number (a tick once done) and name.
export default function SignUpSteps({ current }: SignUpStepsProps) {
  return (
    <ol aria-label="Sign-up steps" className="grid grid-cols-3 gap-2">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex flex-col gap-2" aria-current={active ? "step" : undefined}>
            <div className={cn("h-1 rounded-full", done || active ? "bg-[#8b6dff]" : "bg-[#2a2a2a]")} />
            <div className="flex gap-2 items-center">
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
                  "text-sm font-semibold",
                  active ? "text-white" : done ? "text-[#d9ccff]" : "text-[#8a8a8a]"
                )}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
