"use client";

import { Search } from "lucide-react";
import Button from "@/components/common/button";
import FilterChips from "@/components/common/filter-chips";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import StatusPill from "@/components/common/status-pill";
import { SPONSOR_CATEGORY_OPTIONS } from "@/components/sponsor/data";
import { RADIUS_OPTIONS, SAMPLE_EVENTS } from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorAgent } from "@/context/sponsor-agent";
import { cn } from "@/utils/cn";

const LABEL = "text-xs font-bold tracking-[1.2px] text-white/80";
const EVENT_OPTIONS = SAMPLE_EVENTS.map((e) => ({ value: e.id, label: `${e.name} · ${e.dates}` }));
const RADIUS_CHIPS = RADIUS_OPTIONS.map((r) => ({ value: String(r), label: `${r} miles` }));

interface SearchStepProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onFind: () => void;
}

// Step 1: the event, the kinds of businesses and how far from the venue to look.
export default function SearchStep({ categories, onCategoriesChange, radius, onRadiusChange, onFind }: SearchStepProps) {
  const { event, setEventId } = useSponsorAgent();
  const allOn = categories.length === SPONSOR_CATEGORY_OPTIONS.length;

  return (
    <SectionCard title="Find sponsors for your event" className="gap-8">
      <div className="flex flex-col gap-3">
        <Select
          label="EVENT"
          name="agent-event"
          value={event.id}
          onChange={(e) => setEventId(e.target.value)}
          options={EVENT_OPTIONS}
          variant="dark"
          className="max-w-[560px]"
          labelClassName={LABEL}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
          <span>{event.venue}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{event.teams}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{event.divisions}</span>
          <StatusPill
            label={event.sponsorCount ? `${event.sponsorCount} ${event.sponsorCount === 1 ? "sponsor" : "sponsors"} so far` : "No sponsors yet"}
            color={event.sponsorCount ? "bg-[#1d3a1e]" : "bg-[#3d2a12]"}
            className="h-auto px-3 py-1"
            textClassName={cn("text-xs font-semibold", event.sponsorCount ? "text-[#a3e3a5]" : "text-[#ffc999]")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className={LABEL}>CATEGORY · SELECT ANY</span>
            <Button
              variant="text"
              size="sm"
              label={allOn ? "Clear all" : "Select all"}
              onClick={() => onCategoriesChange(allOn ? [] : SPONSOR_CATEGORY_OPTIONS.map((o) => o.value))}
              className="text-sm font-semibold text-[#c4b5fd] hover:text-[#ddd6fe]"
            />
          </div>
          <span className="text-sm text-white/60">{`${categories.length} selected`}</span>
        </div>
        <FilterChips
          multiple
          variant="pill"
          ariaLabel="Business categories"
          options={SPONSOR_CATEGORY_OPTIONS}
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
            options={RADIUS_CHIPS}
            value={String(radius)}
            onChange={(v) => onRadiusChange(Number(v))}
          />
          <span className="text-sm text-white/60">{`from your venue in ${event.city}`}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
        <Button
          variant="cta"
          label="Find Sponsors"
          icon={<Search className="size-5" strokeWidth={2} />}
          onClick={onFind}
          disabled={categories.length === 0}
          className="px-8"
        />
        <span className="text-sm text-white/60">Your sponsorship packages are added to every message automatically.</span>
      </div>
    </SectionCard>
  );
}
