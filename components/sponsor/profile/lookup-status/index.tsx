import { Info } from "lucide-react";
import { cn } from "@/utils/cn";
import Loader from "@/components/common/loader";
import { isLookupActive } from "@/components/sponsor/profile/data";
import type { SponsorLocationFetch } from "@/utils/types/sponsor-profile";

const BANNER = "flex items-center gap-3 rounded-[12px] border px-4 py-3 text-[15px]";

interface LookupStatusProps {
  lookup: SponsorLocationFetch;
  // Still running when the profile stopped following it.
  timedOut: boolean;
}

// Where the one-time automatic store lookup is. Its `error` is shown only when it completed (the "none found"
// and "stopped early" notes); before that it can be a technical message, so our own words are used.
export default function LookupStatus({ lookup, timedOut }: LookupStatusProps) {
  const { status, error } = lookup;

  if (isLookupActive(status) && timedOut) {
    return (
      <div className={cn(BANNER, "border-[#333] bg-[#0b0b0b] text-[#d4d4d4]")}>
        <Info className="size-5 shrink-0 text-[#c9b8ff]" strokeWidth={1.8} aria-hidden />
        We’re still finding your locations. Reload this page in a few minutes to see them.
      </div>
    );
  }

  if (isLookupActive(status)) {
    const saving = status === "SAVING";
    return (
      <div role="status" className={cn(BANNER, "border-[#4a3f7a] bg-[#17151f] text-white")}>
        <Loader className="py-0 shrink-0" />
        <div>
          <div className="font-semibold">{saving ? "Saving your locations…" : "Finding your locations…"}</div>
          <div className="text-sm text-[#bdbdbd]">
            {saving
              ? "The list fills up as they’re saved."
              : "We’re looking up every US store of your brand. This takes up to a minute."}
          </div>
        </div>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className={cn(BANNER, "border-[#5a2a2a] bg-[#1d1212] text-[#f0d0d0]")}>
        <Info className="size-5 shrink-0 text-[#ff9a9a]" strokeWidth={1.8} aria-hidden />
        We could not find your locations automatically. Add them below.
      </div>
    );
  }

  if (status === "COMPLETED" && error) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#a8a8a8]">
        <Info className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
        {error}
      </p>
    );
  }

  // Never ran (older accounts), or completed with nothing to note.
  return null;
}
