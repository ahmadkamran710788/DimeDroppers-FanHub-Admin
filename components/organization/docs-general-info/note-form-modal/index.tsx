"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import RichTextEditor from "@/components/common/rich-text-editor";
import { DESCRIPTION_MAX, TITLE_MAX, noteSchema } from "@/components/organization/docs-general-info/schema";
import apiCall from "@/utils/api-call";
import { htmlToText } from "@/utils/rich-text";
import { routes } from "@/utils/routes";
import type { EventDocument, EventDocumentResponse } from "@/utils/types/event-document";
import { validateAndSetErrors } from "@/utils/validation";

interface NoteFormModalProps {
  eventId: string;
  eventName?: string;
  // The note being edited; absent when adding one.
  note?: EventDocument;
  onClose: () => void;
  // The note the API created or updated.
  onSaved: (note: EventDocument) => void;
}

// "Add Note" / "Edit Note": a title and a description. Adds with POST …/documents, edits with PATCH
// …/documents/{id} (only the fields that changed).
export default function NoteFormModal({ eventId, eventName, note, onClose, onSaved }: NoteFormModalProps) {
  const [title, setTitle] = useState(note?.name ?? "");
  // The description as HTML (what's saved) and as plain text (what's validated and counted).
  const [description, setDescription] = useState(note?.description ?? "");
  const [descriptionText, setDescriptionText] = useState(htmlToText(note?.description ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!(await validateAndSetErrors(noteSchema, { title, description: descriptionText }, setErrors))) return;
    const name = title.trim();
    const text = description;
    if (note && name === note.name && text === note.description) return onClose();
    setSaving(true);
    const changes = note
      ? { ...(name !== note.name && { name }), ...(text !== note.description && { description: text }) }
      : { name, description: text };
    const { success, data } = await apiCall<EventDocumentResponse>({
      endpoint: note ? routes.api.eventDocument(eventId, note.id) : routes.api.eventDocuments(eventId),
      method: note ? "PATCH" : "POST",
      data: changes,
      showSuccessToast: true,
      successMessage: note ? "Note updated" : "Note added",
    });
    setSaving(false);
    const saved = data?.data?.[0];
    if (!success || !saved) return;
    onSaved(saved);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={note ? "Edit Note" : "Add Note"} className="max-w-[min(560px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-5">
        {eventName && <p className="-mt-3 text-sm text-midnight-navy/60">{`For ${eventName}`}</p>}
        <Input
          label="Title"
          name="noteTitle"
          required
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
          }}
          placeholder="Team Check-In"
          error={errors.title}
        />
        <RichTextEditor
          label="Description"
          name="noteDescription"
          required
          value={description}
          maxLength={DESCRIPTION_MAX}
          onChange={(html, text) => {
            setDescription(html);
            setDescriptionText(text);
            if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
          }}
          placeholder="What fans and teams should know"
          error={errors.description}
        />
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button
          label={saving ? "Saving…" : note ? "Save Changes" : "Add Note"}
          variant="cta"
          onClick={save}
          disabled={saving}
          fullWidth
        />
      </div>
    </Modal>
  );
}
