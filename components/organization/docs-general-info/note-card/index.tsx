import { Trash2 } from "lucide-react";
import Button from "@/components/common/button";
import { formatStamp } from "@/components/organization/docs-general-info/format";
import { htmlToText } from "@/utils/rich-text";
import type { EventDocument } from "@/utils/types/event-document";

interface NoteCardProps {
  note: EventDocument;
  onOpen: () => void;
  onDelete: () => void;
}

// One note, as in a notes app: the title, when it was added, and the start of its description. The card
// opens the full note; the bin deletes it.
export default function NoteCard({ note, onOpen, onDelete }: NoteCardProps) {
  return (
    <div className="flex items-start gap-2 rounded-[12px] pr-3 pt-4 bg-surface-07 transition-colors hover:bg-white/10">
      {/* A clickable card, not an action button. */}
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 flex flex-col gap-2 px-4 sm:px-6 pb-5 text-left">
        <span className="text-base sm:text-lg font-semibold text-white truncate">{note.name}</span>
        <span className="text-sm text-white/50">{formatStamp(note.createdAt)}</span>
        <span className="text-sm text-white/70 line-clamp-3 whitespace-pre-line wrap-break-word">{htmlToText(note.description)}</span>
      </button>
      <Button
        size="icon"
        icon={<Trash2 className="size-5" />}
        aria-label={`Delete ${note.name}`}
        title="Delete"
        onClick={onDelete}
        className="size-9 shrink-0 bg-transparent text-white/70 hover:bg-white/10 hover:text-error"
      />
    </div>
  );
}
