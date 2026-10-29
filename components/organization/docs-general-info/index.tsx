"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import Tabs from "@/components/common/tabs";
import { TABS, type DocsTab } from "@/components/organization/docs-general-info/format";
import NoteCard from "@/components/organization/docs-general-info/note-card";
import NoteFormModal from "@/components/organization/docs-general-info/note-form-modal";
import { useEventNotes } from "@/components/organization/docs-general-info/use-event-notes";
import ViewNoteModal from "@/components/organization/docs-general-info/view-note-modal";
import EventSelect from "@/components/organization/event-select";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { EventDocument } from "@/utils/types/event-document";

// The note form: a new note, or the note being edited.
type FormState = { note?: EventDocument } | null;

// Docs & General Info (tournament only): the picked event's notes, which fans see in the Fan Hub app.
// A note opens in a popup (and is edited from there); Add Note adds one (a title and a description);
// the bin deletes one. General Info is coming soon.
export default function DocsGeneralInfoPage() {
  const router = useRouter();
  const { org } = useAuth();
  const orgKind = orgKindOf(org);
  const { event, setEvent, noEvents } = useSelectedEvent();
  const eventId = event?.id ?? "";
  const notes = useEventNotes(eventId);
  const [tab, setTab] = useState<DocsTab>("Notes");
  const [opened, setOpened] = useState<EventDocument | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<EventDocument | null>(null);

  // A school opening the URL goes back to its Command Center.
  useEffect(() => {
    if (orgKind === "school") router.replace(routes.ui.commandCenter);
  }, [orgKind, router]);
  if (orgKind === "school") return null;

  const remove = async () => {
    if (!deleting) return false;
    const { success } = await apiCall({
      endpoint: routes.api.eventDocument(eventId, deleting.id),
      method: "DELETE",
      showSuccessToast: true,
      successMessage: "Note deleted",
    });
    if (success) notes.removed(deleting.id);
    return success;
  };

  const notesTab =
    noEvents && !eventId ? (
      <p className="py-12 text-center text-sm text-white/60">Pick an event to see its notes.</p>
    ) : notes.loading || !eventId ? (
      <div className="py-12">
        <Loader />
      </div>
    ) : notes.error ? (
      <p className="py-12 text-center text-sm text-error">{notes.error}</p>
    ) : notes.notes.length === 0 ? (
      <p className="py-12 text-center text-sm text-white/40">No notes for this event yet.</p>
    ) : (
      <div className="flex flex-col items-center gap-6">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {notes.notes.map((n) => (
            <NoteCard key={n.id} note={n} onOpen={() => setOpened(n)} onDelete={() => setDeleting(n)} />
          ))}
        </div>
        {notes.hasMore && (
          <Button
            variant="secondary"
            label={notes.loadingMore ? "Loading…" : "Load more"}
            onClick={notes.loadMore}
            disabled={notes.loadingMore}
          />
        )}
      </div>
    );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-white">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Docs &amp; General Info
          </h2>
          <p className="text-base leading-[26px]">Notes and general info fans and teams see in the app.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <EventSelect
            value={eventId}
            onChange={(id, name) => setEvent(id ? { id, name } : null)}
            allowAll={false}
            selectedName={event?.name}
          />
          <Button
            variant="cta"
            label="Add Note"
            icon={<Plus className="size-5" />}
            className="shrink-0 whitespace-nowrap"
            onClick={() => setForm({})}
            disabled={!eventId}
          />
        </div>
      </div>

      <div className="rounded-[8px] p-4 sm:p-6 flex flex-col gap-8 backdrop-blur-[24px] bg-surface-06">
        <Tabs tabs={TABS} active={tab} onChange={setTab} counts={eventId && !notes.loading ? { Notes: notes.total } : undefined} />
        {tab === "Notes" ? notesTab : <p className="py-12 text-center text-sm text-white/40">{tab} is coming soon.</p>}
      </div>

      <ViewNoteModal
        note={opened}
        onClose={() => setOpened(null)}
        onEdit={() => {
          setForm({ note: opened ?? undefined });
          setOpened(null);
        }}
      />
      {form && eventId && (
        <NoteFormModal
          eventId={eventId}
          eventName={event?.name}
          note={form.note}
          onClose={() => setForm(null)}
          onSaved={form.note ? notes.updated : notes.added}
        />
      )}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Note"
        message={`Delete “${deleting?.name}”? Fans won't see it in the app any more.`}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        onConfirm={remove}
        destructive
      />
    </div>
  );
}
