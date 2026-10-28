import { FileText } from "lucide-react";
import { formatStamp, type EventDocument } from "@/components/organization/docs-general-info/data";

interface DocumentCardProps {
  document: EventDocument;
  onOpen: () => void;
}

// One document row: a PDF icon in a round badge, the name and when it was uploaded. Opens the document.
export default function DocumentCard({ document, onOpen }: DocumentCardProps) {
  return (
    // A clickable card, not an action button.
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-4 sm:gap-6 rounded-[12px] px-4 sm:px-6 py-5 bg-surface-07 text-left transition-colors hover:bg-white/10"
    >
      <span className="size-14 sm:size-16 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
        <FileText className="size-7 text-white" strokeWidth={1.5} />
      </span>
      <span className="flex flex-col gap-1 min-w-0">
        <span className="text-base sm:text-lg font-medium text-white truncate">{document.name}</span>
        <span className="text-sm text-white/60">{formatStamp(document.uploadedAt)}</span>
      </span>
    </button>
  );
}
