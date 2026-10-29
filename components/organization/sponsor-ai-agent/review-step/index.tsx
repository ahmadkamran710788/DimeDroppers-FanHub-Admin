"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import ConfirmModal from "@/components/common/confirm-modal";
import AgentNotice from "@/components/organization/sponsor-ai-agent/agent-notice";
import FollowUpCard from "@/components/organization/sponsor-ai-agent/follow-up-card";
import { STATUS_FILTERS } from "@/components/organization/sponsor-ai-agent/data";
import type { useSponsorDrafts } from "@/components/organization/sponsor-ai-agent/use-sponsor-drafts";
import type { DraftStatusFilter, SponsorAiRun } from "@/utils/types/sponsor-ai";

interface ReviewStepProps {
  drafts: ReturnType<typeof useSponsorDrafts>;
  status: DraftStatusFilter;
  onStatusChange: (status: DraftStatusFilter) => void;
  page: number;
  onPageChange: (page: number) => void;
  // A tournament's event.
  eventName?: string;
  // The latest search, for its summary and warnings.
  run: SponsorAiRun | null;
  onChangeSearch: () => void;
}

// Step 2: the agent's follow-ups, kept across searches, to edit, approve (which sends them and moves the
// thread to Sponsor Messages) or reject.
export default function ReviewStep({ drafts, status, onStatusChange, page, onPageChange, eventName, run, onChangeSearch }: ReviewStepProps) {
  const { list } = drafts;
  const [confirmAll, setConfirmAll] = useState(false);
  // The drafts on screen still waiting for review.
  const pendingIds = list?.items.filter((d) => d.reviewStatus === "PENDING").map((d) => d.id) ?? [];
  const counts = list?.counts;
  const pending = counts?.PENDING ?? 0;
  const lastSearch =
    run?.status === "COMPLETED"
      ? `last search wrote ${run.draftedCount} ${run.draftedCount === 1 ? "email" : "emails"} within ${run.radiusMiles} miles`
      : null;

  return (
    <SectionCard>
      <ConfirmModal
        isOpen={confirmAll}
        onClose={() => setConfirmAll(false)}
        title="Send all these emails?"
        message={`This sends ${pendingIds.length} real ${pendingIds.length === 1 ? "email" : "emails"} to the businesses listed on this page. It can't be undone.`}
        confirmLabel={`Send ${pendingIds.length}`}
        busyLabel="Sending…"
        onConfirm={() => drafts.approve(pendingIds)}
      />
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-black text-xl lg:text-[28px] uppercase text-white leading-tight">Follow-up Messages</h3>
          <p className="text-sm text-white/70">
            {[eventName, lastSearch, "approved messages move to Sponsor Messages"].filter(Boolean).join(" · ")}
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
            value={status}
            onChange={(e) => onStatusChange(e.target.value as DraftStatusFilter)}
            options={STATUS_FILTERS.map((f) => ({ value: f.value, label: counts ? `${f.label} (${counts[f.value]})` : f.label }))}
            variant="dark"
            className="w-[220px]"
            labelClassName="sr-only"
          />
          <Button
            variant="cta"
            label={`Approve all drafts (${pending})`}
            icon={<Check className="size-5" strokeWidth={2.4} />}
            onClick={() => setConfirmAll(true)}
            disabled={pendingIds.length === 0}
            className="px-5"
          />
        </div>
      </div>

      {run?.status === "COMPLETED" && <AgentNotice tone="warning" items={run.warnings} />}

      {!list ? (
        drafts.loading ? <Loader /> : <p className="py-8 text-center text-sm text-white/60">Couldn’t load the drafts.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {list.items.map((d) => (
            <FollowUpCard key={d.id} draft={d} onEdit={drafts.edit} onReject={(id) => drafts.reject([id])} onApprove={(id) => drafts.approve([id])} />
          ))}
          {list.items.length === 0 && (
            <p className="py-8 text-center text-sm text-white/60">
              {list.counts.ALL === 0
                ? "No drafts yet. Run a search in Step 1 and the agent’s emails appear here."
                : "No messages match this filter."}
            </p>
          )}
          <Pagination page={page} pageCount={list.pagination.totalPages} onChange={onPageChange} className="self-center" />
        </div>
      )}
    </SectionCard>
  );
}
