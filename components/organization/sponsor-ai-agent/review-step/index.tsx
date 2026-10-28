"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import Button from "@/components/common/button";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import FollowUpCard from "@/components/organization/sponsor-ai-agent/follow-up-card";
import type { AgentSponsor, FollowUpStatus } from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorAgent } from "@/context/sponsor-agent";

type Filter = "all" | FollowUpStatus;

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Drafts" },
  { value: "sent", label: "Approved & sent" },
  { value: "rejected", label: "Rejected" },
];

interface ReviewStepProps {
  // The businesses the search found.
  matched: AgentSponsor[];
  radius: number;
  onChangeSearch: () => void;
}

// Step 2: the agent's follow-up for each match, to approve, edit or reject. Approved ones move to
// Sponsor Messages.
export default function ReviewStep({ matched, radius, onChangeSearch }: ReviewStepProps) {
  const { event, statusOf, approveAll } = useSponsorAgent();
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const drafts = matched.filter((s) => statusOf(s.id) === "draft");
  const shown = matched.filter((s) => filter === "all" || statusOf(s.id) === filter);
  const count = matched.length;

  return (
    <SectionCard>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-black text-xl lg:text-[28px] uppercase text-white leading-tight">Follow-up Messages</h3>
          <p className="text-sm text-white/70">
            {`${event.name} · ${count} ${count === 1 ? "sponsor" : "sponsors"} matched within ${radius} miles · approved messages move to Sponsor Messages`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="text"
            size="sm"
            label="Change search"
            icon={<ArrowLeft className="size-4" />}
            onClick={onChangeSearch}
            className="text-sm"
          />
          <Select
            label="Filter by status"
            name="follow-up-status"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            options={FILTER_OPTIONS}
            variant="dark"
            className="w-[200px]"
            labelClassName="sr-only"
          />
          <Button
            variant="cta"
            label={`Approve all drafts (${drafts.length})`}
            icon={<Check className="size-5" strokeWidth={2.4} />}
            onClick={() => approveAll(drafts.map((s) => s.id))}
            disabled={drafts.length === 0}
            className="px-5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {shown.map((s) => (
          <FollowUpCard
            key={s.id}
            sponsor={s}
            editing={editingId === s.id}
            onEditingChange={(editing) => setEditingId(editing ? s.id : null)}
          />
        ))}
        {shown.length === 0 && (
          <p className="py-8 text-center text-sm text-white/60">
            {count === 0
              ? `No businesses in these categories within ${radius} miles. Change the search to look wider.`
              : "No messages match this filter."}
          </p>
        )}
      </div>
    </SectionCard>
  );
}
