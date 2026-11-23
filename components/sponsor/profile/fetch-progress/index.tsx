import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import ProgressBar from "@/components/common/progress-bar";
import FetchAreaChips from "@/components/sponsor/profile/fetch-area-chips";
import { FETCH_STEPS } from "@/components/sponsor/profile/data";
import type { SponsorFetchArea, SponsorLocationFetchStatus } from "@/utils/types/sponsor-profile";

interface FetchProgressProps {
  // PENDING, RUNNING or SAVING.
  status: SponsorLocationFetchStatus;
  areas: SponsorFetchArea[];
  // New stores found so far (set once the fetch is saving); null until the fetch has been checked.
  foundCount: number | null;
}

// A location fetch in progress: its steps (Getting ready → Searching for stores → Saving → Done) as a row of
// ticks, a bar, what it's doing now, and the areas it searches.
export default function FetchProgress({ status, areas, foundCount }: FetchProgressProps) {
  const current = Math.max(
    0,
    FETCH_STEPS.findIndex((s) => s.status === status)
  );
  const heading =
    status === "PENDING"
      ? "Getting ready…"
      : status === "RUNNING"
        ? "Searching for your stores…"
        : foundCount
          ? `Found ${foundCount} ${foundCount === 1 ? "store" : "stores"}, saving them…`
          : "Saving the stores we found…";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-4 rounded-[12px] border border-[#4a3f7a] bg-[#17151f] px-4 py-4 text-white"
    >
      <ol aria-label="Fetch steps" className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {FETCH_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <Fragment key={step.status}>
              {i > 0 && (
                <li aria-hidden className={cn("h-px w-4 sm:w-8", i <= current ? "bg-[#8b6dff]" : "bg-white/20")} />
              )}
              <li className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                <span
                  className={cn(
                    "size-5 shrink-0 rounded-full flex items-center justify-center",
                    done ? "bg-[#8b6dff]" : active ? "border-2 border-[#8b6dff]" : "border border-white/30"
                  )}
                >
                  {done ? (
                    <Check className="size-3 text-white" strokeWidth={3} aria-hidden />
                  ) : (
                    active && <span className="size-2 rounded-full bg-[#c9b8ff] animate-pulse" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    active ? "font-semibold text-white" : done ? "text-[#d4d4d4]" : "text-[#8a8a8a]"
                  )}
                >
                  {step.label}
                  {done && <span className="sr-only"> (done)</span>}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>

      <ProgressBar
        percent={FETCH_STEPS[current].percent}
        ariaLabel="Location fetch progress"
        className="h-1.5"
        barClassName="bg-[#8b6dff] transition-[width] duration-500"
      />

      <div className="min-w-0">
        <div className="font-semibold break-words">{heading}</div>
        <div className="text-sm text-[#bdbdbd]">
          This usually takes under a minute. You can leave this page; we’ll let you know when it’s done.
        </div>
      </div>

      <FetchAreaChips areas={areas} saving={status === "SAVING"} />
    </div>
  );
}
