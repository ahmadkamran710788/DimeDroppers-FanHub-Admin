"use client";

import { ArrowRight, Search, Sparkles } from "lucide-react";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import Loader from "@/components/common/loader";
import SectionCard from "@/components/common/section-card";
import InventoryEventPicker from "@/components/organization/inventory/event-picker";
import AgentNotice, { type NoticeItem } from "@/components/organization/sponsor-ai-agent/agent-notice";
import RunProgress from "@/components/organization/sponsor-ai-agent/run-progress";
import { ISSUE_ACTIONS } from "@/components/organization/sponsor-ai-agent/data";
import type { useSponsorAiRun } from "@/components/organization/sponsor-ai-agent/use-sponsor-ai-run";
import type { useSponsorAiSetup } from "@/components/organization/sponsor-ai-agent/use-sponsor-ai-setup";
import type { SelectedEvent } from "@/context/selected-event";
import type { SponsorAiReadiness, SponsorAiRun } from "@/utils/types/sponsor-ai";

const LABEL = "text-xs font-bold tracking-[1.2px] text-white/80";

// "from your event's 2 venues" / "from Twin Lakes Academy": where the search starts.
function searchOrigin(location: SponsorAiReadiness["location"]) {
  if (location.source === "VENUES") {
    return location.venueCount ? `from your event’s ${location.venueCount} ${location.venueCount === 1 ? "venue" : "venues"}` : null;
  }
  return location.label ? `from ${location.label}` : null;
}

interface SearchStepProps {
  // A tournament picks the event it needs sponsors for.
  event: SelectedEvent | null;
  onEventChange?: (id: string, name: string) => void;
  setup: ReturnType<typeof useSponsorAiSetup>;
  search: ReturnType<typeof useSponsorAiRun>;
  // The search that just failed here, if any.
  failure: SponsorAiRun | null;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  // Drafts waiting for review from earlier searches.
  pendingCount: number;
  onReview: () => void;
  onFind: () => void;
}

// Step 1: the event (tournaments), the kinds of businesses and how far to look, then the search itself.
// What's missing before a search can start is listed first; Find Sponsors waits until nothing is.
export default function SearchStep({
  event,
  onEventChange,
  setup,
  search,
  failure,
  categories,
  onCategoriesChange,
  radius,
  onRadiusChange,
  pendingCount,
  onReview,
  onFind,
}: SearchStepProps) {
  const { readiness, options } = setup;
  // The picks are locked while a search runs, unless it seems stuck.
  const running = search.active && !search.stuck;
  const max = options?.maxCategories ?? 0;
  const atMax = categories.length >= max;
  const recommended = options?.categories.filter((c) => c.recommended).map((c) => c.category) ?? [];

  const issues: NoticeItem[] = [
    ...(setup.error ? [{ message: setup.error }] : []),
    ...(readiness?.issues ?? [])
      .filter((i) => i.code !== "EVENT_REQUIRED")
      .map((i) => ({ message: i.message, action: ISSUE_ACTIONS[i.code] })),
  ];
  const failed: NoticeItem[] = [];
  if (search.stuck) failed.push({ message: "Your last search seems stuck. You can start a new one." });
  if (failure?.status === "FAILED" && failure.error) failed.push({ message: failure.error.message });
  if (failure?.status === "BLOCKED_NO_PACKAGES") {
    failed.push({ message: "Set up your sponsor packages in Activations first", action: ISSUE_ACTIONS.NO_PACKAGES });
  }

  const origin = readiness && searchOrigin(readiness.location);
  const sender = readiness?.sender.name && [readiness.sender.name, readiness.sender.position].filter(Boolean).join(", ");
  const canFind = !!readiness?.ready && !!options && categories.length > 0 && !running && !search.starting;

  return (
    <SectionCard title={onEventChange ? "Find sponsors for your event" : "Find local sponsors"} className="gap-8">
      <AgentNotice tone="error" items={issues} />

      {onEventChange && (
        <div className="flex flex-col gap-3">
          <span className={LABEL}>EVENT</span>
          <InventoryEventPicker value={event?.id ?? ""} selectedName={event?.name} onChange={onEventChange} refreshKey={0} />
        </div>
      )}

      {setup.loading ? (
        <Loader />
      ) : !options ? (
        onEventChange && !event && <p className="text-sm text-white/60">Pick an event to choose the kinds of businesses to look for.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className={LABEL}>{`CATEGORY · UP TO ${max}`}</span>
                <Button
                  variant="text"
                  size="sm"
                  label="Select recommended"
                  onClick={() => onCategoriesChange(recommended)}
                  disabled={running}
                  className="text-sm font-semibold text-[#c4b5fd] hover:text-[#ddd6fe]"
                />
                <Button
                  variant="text"
                  size="sm"
                  label="Clear all"
                  onClick={() => onCategoriesChange([])}
                  disabled={running || categories.length === 0}
                  className="text-sm font-semibold text-[#c4b5fd] hover:text-[#ddd6fe]"
                />
              </div>
              <span className="flex items-center gap-3 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3.5 text-[#d9ccff]" aria-hidden="true" />
                  Recommended for you
                </span>
                <span>{`${categories.length} selected${atMax ? ` · ${max} max` : ""}`}</span>
              </span>
            </div>
            <FilterChips
              multiple
              variant="pill"
              ariaLabel="Business categories"
              options={options.categories.map((c) => ({
                value: c.category,
                label: c.category,
                icon: c.recommended ? <Sparkles className="size-3.5 shrink-0 text-[#d9ccff]" aria-hidden="true" /> : undefined,
                disabled: running || (atMax && !categories.includes(c.category)),
              }))}
              value={categories}
              onChange={onCategoriesChange}
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className={LABEL}>RADIUS</span>
            <div className="flex flex-wrap items-center gap-3">
              <FilterChips
                variant="pill"
                ariaLabel="Radius"
                options={options.radiusOptions.map((r) => ({ value: String(r), label: `${r} miles`, disabled: running }))}
                value={String(radius)}
                onChange={(v) => onRadiusChange(Number(v))}
              />
              {origin && <span className="text-sm text-white/60">{origin}</span>}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
        {running && search.run ? (
          <RunProgress run={search.run} />
        ) : (
          <>
            <AgentNotice tone="error" items={failed} />
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="cta"
                label={search.starting ? "Starting…" : "Find Sponsors"}
                icon={<Search className="size-5" strokeWidth={2} />}
                onClick={onFind}
                disabled={!canFind}
                className="px-8"
              />
              <span className="flex flex-col gap-1 text-sm text-white/60">
                {sender && <span>{`Emails are signed by ${sender}.`}</span>}
                <span>Your sponsorship packages are added to every message automatically.</span>
              </span>
            </div>
          </>
        )}
        {pendingCount > 0 && (
          <Button
            variant="text"
            size="sm"
            label={`Review ${pendingCount} waiting ${pendingCount === 1 ? "draft" : "drafts"}`}
            icon={<ArrowRight className="size-4" />}
            iconPosition="end"
            onClick={onReview}
            className="self-start text-sm font-semibold text-[#c4b5fd] hover:text-[#ddd6fe]"
          />
        )}
      </div>
    </SectionCard>
  );
}
