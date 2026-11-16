import type { ReactNode } from "react";
import { CircleCheck, Info, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import FetchAreaChips from "@/components/sponsor/profile/fetch-area-chips";
import FetchProgress from "@/components/sponsor/profile/fetch-progress";
import { isLookupActive } from "@/components/sponsor/profile/data";
import { SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type {
  SponsorLocationFetch,
  SponsorLocationFetchResult,
  SponsorLocationFetchRun,
} from "@/utils/types/sponsor-profile";

const BANNER = "flex items-center gap-3 rounded-[12px] border px-4 py-3 text-[15px]";
const NOTE = cn(BANNER, "border-[#333] bg-[#0b0b0b] text-[#d4d4d4]");

interface FetchStatusProps {
  // The latest fetch, as the profile has it.
  lookup: SponsorLocationFetch;
  // Still running when the profile stopped following it.
  timedOut: boolean;
  // The same fetch as it's being followed (for the stores found so far); null until it has been checked.
  live: SponsorLocationFetchRun | null;
  // The same fetch with its results, once it's done and they're loaded; null until then.
  result: SponsorLocationFetchResult | null;
  // Starts the failed fetch again, with the same areas.
  onRetry: () => void;
  retrying: boolean;
}

// Where the latest location fetch is, and how it ended. Its `error` is shown only when it completed (the "none
// found" and "stopped early" notes); a failed one's reason can be technical, so our own words are used.
export default function FetchStatus({ lookup, timedOut, live, result, onRetry, retrying }: FetchStatusProps) {
  const { status, error, areas } = lookup;

  if (isLookupActive(status) && timedOut) {
    return (
      <div className={NOTE}>
        <Info className="size-5 shrink-0 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
        We’re still finding your locations. Reload this page in a few minutes to see them.
      </div>
    );
  }

  if (status && isLookupActive(status)) {
    return <FetchProgress status={status} areas={areas} foundCount={live?.foundCount ?? null} />;
  }

  if (status === "FAILED") {
    return (
      <div className={cn(BANNER, "flex-wrap border-[#5a2a2a] bg-[#1d1212] text-[#f0d0d0]")}>
        <Info className="size-5 shrink-0 text-[#ff9a9a]" strokeWidth={1.8} aria-hidden />
        <span className="flex-1 min-w-0">The fetch failed.</span>
        <Button
          label={retrying ? "Starting…" : "Try again"}
          icon={<RotateCcw className="size-4" strokeWidth={2.2} />}
          onClick={onRetry}
          disabled={!lookup.canFetch || retrying}
          className={cn(SMALL_BUTTON, "bg-transparent border border-[#7a3a3a] text-white font-semibold")}
        />
      </div>
    );
  }

  if (status !== "COMPLETED" || !result) return null;

  let banner: ReactNode;
  if (error) {
    // "Stopped after the request limit; some locations may be missing".
    const limited = /request limit/i.test(error);
    banner = (
      <div className={NOTE}>
        <Info className="size-5 shrink-0 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
        {limited ? `${error}. Try fewer states at a time.` : error}
      </div>
    );
  } else if (result.foundCount > 0) {
    banner = (
      <div className={cn(BANNER, "border-[#2f5a30] bg-[#111d12] text-[#d6f0d6]")}>
        <CircleCheck className="size-5 shrink-0 text-[#a3e3a5]" strokeWidth={1.8} aria-hidden />
        {result.foundCount === 1 ? "Found 1 new location." : `Found ${result.foundCount} new locations.`}
      </div>
    );
  } else {
    banner = (
      <div className={NOTE}>
        <Info className="size-5 shrink-0 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
        No new locations. Your saved locations are below.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {banner}
      <FetchAreaChips areas={result.results.map((r) => r.area)} results={result.results} />
    </div>
  );
}
