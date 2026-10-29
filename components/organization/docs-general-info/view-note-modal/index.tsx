"use client";

import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import RichText from "@/components/common/rich-text";
import { formatStamp } from "@/components/organization/docs-general-info/format";
import type { EventDocument } from "@/utils/types/event-document";

interface ViewNoteModalProps {
  // The note clicked; null when the popup is closed.
  note: EventDocument | null;
  onClose: () => void;
  onEdit: () => void;
}

// A note in full: its title, when and by whom it was added, and the whole description.
export default function ViewNoteModal({ note, onClose, onEdit }: ViewNoteModalProps) {
  return (
    <Modal isOpen={!!note} onClose={onClose} title={note?.name} className="max-w-[min(640px,calc(100vw-2rem))] items-stretch">
      {note && (
        <>
          <span className="-mt-4 text-sm text-midnight-navy/60">
            {[formatStamp(note.createdAt), note.uploader?.name].filter(Boolean).join(" · ")}
          </span>
          <RichText value={note.description} className="w-full max-h-[60vh] overflow-y-auto text-base text-midnight-navy" />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" label="Edit" onClick={onEdit} />
            <Button variant="cta" label="Close" onClick={onClose} />
          </div>
        </>
      )}
    </Modal>
  );
}
