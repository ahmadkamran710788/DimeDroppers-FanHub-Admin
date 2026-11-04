"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import Loader from "@/components/common/loader";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import StatusPill from "@/components/common/status-pill";
import EventSelect from "@/components/organization/event-select";
import PlayerCard from "@/components/organization/recognition/player-card";
import { badgeLabelOf, cardOf, playerTemplateOf, roleLabelOf } from "@/components/organization/recognition/recognition-api";
import { useRecognitions } from "@/components/organization/recognition/use-recognitions";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import { routes } from "@/utils/routes";
import type { Recognition, RecognitionStatus } from "@/utils/types/recognition";

const STATUS_OPTIONS: { label: string; value: RecognitionStatus | "" }[] = [
  { label: "All Status", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Recognition Posts: every recognition (GET /fanhub/org/recognitions) as its card, in rows, newest
// first. Each card has a ⋮ menu (edit, publish / unpublish, delete) at its top right, and its status and
// who gave it under it. The search narrows the loaded page here (the API has no search).
export default function RecognitionPosts() {
  const router = useRouter();
  const [status, setStatus] = useState<RecognitionStatus | "">("");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<Recognition | null>(null);
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  // A tournament lists one event's recognitions: the one in the shared event picker.
  const { event, setEvent } = useSelectedEvent();
  const { recognitions, loading, failed, reload, setStatus: setRecognitionStatus, remove } = useRecognitions(
    status,
    isTournament ? event?.id : undefined
  );

  const q = query.trim().toLowerCase();
  const shown = recognitions.filter(
    (r) =>
      !q ||
      [r.player.name, badgeLabelOf(r.awardBadge), r.recognizedBy.name, r.description].some((v) => v.toLowerCase().includes(q))
  );

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          variant="dark"
          placeholder="Search recognitions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search recognitions"
          className="w-full sm:w-56"
        />
        {isTournament && (
          <EventSelect
            value={event?.id ?? ""}
            onChange={(id, name) => setEvent(id ? { id, name } : null)}
            allowAll={false}
            selectedName={event?.name}
          />
        )}
        <FilterChipMenu
          label={STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "All Status"}
          ariaLabel="Filter by status"
          items={STATUS_OPTIONS.map((o) => ({ label: o.label, onSelect: () => setStatus(o.value) }))}
        />
        <Button
          variant="cta"
          label="Add Recognition"
          icon={<Plus className="size-5" strokeWidth={2} />}
          className="h-12 ml-auto"
          onClick={() => router.push(routes.ui.addRecognition)}
        />
      </div>

      {loading ? (
        <Loader className="m-10" />
      ) : failed ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-white/50">Couldn&apos;t load the recognitions.</p>
          <Button label="Try again" onClick={reload} className="h-10 min-w-0 px-4 text-sm border border-white/15 bg-white/[0.06]" />
        </div>
      ) : shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/50">
          {recognitions.length || status ? "No recognitions match these filters." : "No recognitions yet. Add one to celebrate a player."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 items-start">
          {shown.map((r) => (
            <div key={r.id} className="flex flex-col gap-2">
              <div className="relative">
                <PlayerCard template={playerTemplateOf(r.template)} data={cardOf(r)} />
                <RowActionsMenu
                  ariaLabel={`Actions for ${r.player.name}'s recognition`}
                  className="absolute top-3 right-3 size-9 bg-black/30"
                  items={[
                    { label: "Edit Recognition", onSelect: () => router.push(routes.ui.editRecognition(r.id)) },
                    r.status === "DRAFT"
                      ? { label: "Publish", onSelect: () => void setRecognitionStatus(r, "PUBLISHED") }
                      : { label: "Unpublish", onSelect: () => void setRecognitionStatus(r, "DRAFT") },
                    { label: "Delete", variant: "destructive", onSelect: () => setDeleting(r) },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-1 text-xs text-white/60">
                <span className="truncate">{`By ${r.recognizedBy.name} · ${roleLabelOf(r.recognizedBy.role)} · ${fmtDate(r.createdAt)}`}</span>
                <StatusPill
                  label={r.status === "PUBLISHED" ? "Published" : "Draft"}
                  color={r.status === "PUBLISHED" ? "bg-[#1F5F3A]" : "bg-[#5C4A12]"}
                  textClassName={r.status === "PUBLISHED" ? "text-[#7BE39A]" : "text-[#F2C94C]"}
                  className="h-7 px-2.5 shrink-0"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Recognition"
        message={`${deleting?.player.name}'s recognition will be removed from the fan wall.`}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        destructive
        onConfirm={() => (deleting ? remove(deleting) : Promise.resolve(false))}
      />
    </div>
  );
}
