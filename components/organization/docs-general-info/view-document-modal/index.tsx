"use client";

import { FileText } from "lucide-react";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import { formatStamp, type EventDocument } from "@/components/organization/docs-general-info/data";

interface ViewDocumentModalProps {
  document: EventDocument | null;
  onClose: () => void;
}

// A document in a popup: the PDF itself, or a note when there is no file (the sample documents).
export default function ViewDocumentModal({ document, onClose }: ViewDocumentModalProps) {
  return (
    <Modal isOpen={!!document} onClose={onClose} title={document?.name} className="max-w-[min(900px,calc(100vw-2rem))] items-stretch">
      {document && (
        <>
          <span className="-mt-4 text-sm text-midnight-navy/60">{formatStamp(document.uploadedAt)}</span>
          {document.url ? (
            <iframe src={document.url} title={document.name} className="w-full h-[70vh] rounded-[12px] border border-midnight-navy/10" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 rounded-[12px] bg-midnight-navy/5 text-midnight-navy/60">
              <FileText className="size-10" strokeWidth={1.5} />
              <p className="text-sm">No file to preview for this sample document.</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            {document.url && (
              <Button variant="secondary" label="Open in new tab" onClick={() => window.open(document.url, "_blank", "noopener")} />
            )}
            <Button variant="cta" label="Close" onClick={onClose} />
          </div>
        </>
      )}
    </Modal>
  );
}
