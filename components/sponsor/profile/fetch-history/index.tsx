"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { sponsorList } from "@/components/sponsor/sponsor-api";
import { fetchTime, isLookupActive } from "@/components/sponsor/profile/data";
import type { SponsorLocationFetchRun, SponsorLocationFetchStatus } from "@/utils/types/sponsor-profile";

const STATUS_LABELS: Record<SponsorLocationFetchStatus, string> = {
  PENDING: "Waiting",
  RUNNING: "Finding",
  SAVING: "Saving",
  COMPLETED: "Done",
  FAILED: "Failed",
};

interface FetchHistoryProps {
  // Changes when a fetch starts or finishes, so an open list loads again.
  refreshKey: string;
  // The fetch whose results are shown.
  shownRunId: string | null;
  onShow: (runId: string) => void;
}

// The sponsor's 20 latest fetches (GET /locations/fetches), loaded when opened; any finished one can be shown.
export default function FetchHistory({ refreshKey, shownRunId, onShow }: FetchHistoryProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<{ key: string; runs?: SponsorLocationFetchRun[]; error?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    sponsorList<SponsorLocationFetchRun>(routes.api.sponsorLocationFetches).then((r) => {
      if (!cancelled) setLoaded({ key: refreshKey, runs: r.items, error: r.items ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey]);

  const current = loaded?.key === refreshKey ? loaded : null;

  return (
    <div className="flex flex-col gap-3 border-t border-[#262626] pt-4">
      <Button
        variant="text"
        size="sm"
        label="Fetch history"
        icon={<ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} strokeWidth={2} />}
        iconPosition="end"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="self-start h-11 text-[15px] font-semibold text-white"
      />
      {open &&
        (!current ? (
          <Loader />
        ) : !current.runs ? (
          <p className="text-sm text-[#a8a8a8]">{current.error ?? "Couldn't load your fetches."}</p>
        ) : current.runs.length === 0 ? (
          <p className="text-sm text-[#a8a8a8]">No fetches yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {current.runs.map((run) => {
              const shown = run.id === shownRunId;
              const found = run.foundCount === 1 ? "1 new location" : `${run.foundCount} new locations`;
              return (
                <li
                  key={run.id}
                  className={cn(
                    "flex items-center gap-3 flex-wrap rounded-[12px] border p-3",
                    shown ? "border-[#8b6dff] bg-[#17151f]" : "border-[#262626] bg-[#0b0b0b]"
                  )}
                >
                  <div className="flex-[1_1_220px] min-w-0">
                    <div className="text-[15px] font-semibold break-words">{run.areas.map((a) => a.label).join(", ")}</div>
                    <div className="text-sm text-[#a8a8a8]">
                      {`${fetchTime(run.createdAt)} · ${STATUS_LABELS[run.status]}`}
                      {run.status === "COMPLETED" && ` · ${found}`}
                    </div>
                  </div>
                  {!isLookupActive(run.status) && (
                    <Button
                      variant="text"
                      size="sm"
                      label={shown ? "Shown" : "View results"}
                      onClick={() => onShow(run.id)}
                      disabled={shown}
                      className="h-11 px-3 text-sm font-semibold text-[#c9b8ff] hover:text-white"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
}
