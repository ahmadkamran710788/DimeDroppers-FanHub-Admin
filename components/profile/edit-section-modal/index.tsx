"use client";

import type { ReactNode } from "react";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";

interface EditSectionModalProps {
  isOpen: boolean;
  title: string;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  // The section's field group (from components/organization/fields).
  children: ReactNode;
}

// Dark dialog that edits one Profile section with the same fields as the Setup Wizard.
export default function EditSectionModal({ isOpen, title, saving, onCancel, onSave, children }: EditSectionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onCancel()}
      className="max-w-[min(720px,calc(100vw-2rem))] items-stretch max-h-[calc(100vh-2rem)] overflow-y-auto bg-midnight-navy border border-white/10"
    >
      <h2 className="font-display font-black text-[28px] uppercase text-white leading-tight">Edit {title}</h2>
      {children}
      <div className="flex gap-3 pt-2">
        <Button label="Cancel" variant="ghost" onClick={onCancel} disabled={saving} fullWidth />
        <Button label={saving ? "Saving…" : "Save Changes"} variant="cta" onClick={onSave} disabled={saving} fullWidth />
      </div>
    </Modal>
  );
}
