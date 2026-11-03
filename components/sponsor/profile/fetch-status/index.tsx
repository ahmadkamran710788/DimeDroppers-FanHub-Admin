import { CircleCheck, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import Loader from "@/components/common/loader";
import { isLookupActive } from "@/components/sponsor/profile/data";
import type { SponsorLocationFetch, SponsorLocationFetchRun } from "@/utils/types/sponsor-profile";

const BANNER = "flex items-center gap-3 rounded-[12px] border px-4 py-3 text-[15px]";
const NOTE = cn(BANNER, "border-[#333] bg-[#0b0b0b] text-[#d4d4d4]");

interface FetchStatusProps {
  // The latest fetch, as the profile has it.
  lookup: SponsorLocationFetch;
  // Still running when the profile stopped following it.
  timedOut: boolean;
  // The same fetch with its counts, once loaded; null until then.
  run: SponsorLocationFetchRun | null;
}

// Where the latest location fetch is, and how it ended. Its `error` is shown only when it completed (the "none
// found" and "stopped early" notes); a failed one's reason can be technical, so our own words are used.
export default function FetchStatus({ lookup, timedOut, run }: FetchStatusProps) {
  const { status, error, areas } = lookup;

  if (isLookupActive(status) && timedOut) {
    return (
      <div className={NOTE}>
        <Info className="size-5 shrink-0 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
        We’re still finding your locations. Reload this page in a few minutes to see them.
      </div>
    );
  }

  if (isLookupActive(status)) {
    const saving = status === "SAVING";
    const where = areas.map((a) => a.label).join(", ");
    return (
      <div role="status" className={cn(BANNER, "border-[#4a3f7a] bg-[#17151f] text-white")}>
        <Loader className="py-0 shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold break-words">
            {saving ? "Saving your locations…" : where ? `Finding your locations in ${where}…` : "Finding your locations…"}
          </div>
          <div className="text-sm text-[#bdbdbd]">
            {saving ? "The list fills up as they’re saved." : "This takes about 10–20 seconds, longer for big states."}
          </div>
        </div>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className={cn(BANNER, "border-[#5a2a2a] bg-[#1d1212] text-[#f0d0d0]")}>
        <Info className="size-5 shrink-0 text-[#ff9a9a]" strokeWidth={1.8} aria-hidden />
        The fetch failed. Try again.
      </div>
    );
  }

  if (status !== "COMPLETED" || !run) return null;

  if (error) {
    // "Stopped after the request limit; some locations may be missing".
    const limited = /request limit/i.test(error);
    return (
      <div className={NOTE}>
        <Info className="size-5 shrink-0 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
        {limited ? `${error}. Try fewer states at a time.` : error}
      </div>
    );
  }

  if (run.foundCount > 0) {
    return (
      <div className={cn(BANNER, "border-[#2f5a30] bg-[#111d12] text-[#d6f0d6]")}>
        <CircleCheck className="size-5 shrink-0 text-[#a3e3a5]" strokeWidth={1.8} aria-hidden />
        {run.foundCount === 1 ? "Found 1 new location." : `Found ${run.foundCount} new locations.`}
      </div>
    );
  }

  return (
    <div className={NOTE}>
      <Info className="size-5 shrink-0 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
      No new locations. Your saved locations are below.
    </div>
  );
}
