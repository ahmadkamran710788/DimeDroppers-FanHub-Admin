"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import FileUpload from "@/components/common/file-upload";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import { NAME_MAX, documentSchema } from "@/components/organization/docs-general-info/schema";
import { validateAndSetErrors } from "@/utils/validation";

interface AddDocumentModalProps {
  onClose: () => void;
  // The name and the picked PDF.
  onAdd: (name: string, file: File) => void;
}

// "Add Document": a name and a PDF. No upload endpoint yet, so the file stays in this browser.
export default function AddDocumentModal({ onClose, onAdd }: AddDocumentModalProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const add = async () => {
    if (!(await validateAndSetErrors(documentSchema, { name, fileName: file?.name ?? "" }, setErrors))) return;
    onAdd(name.trim(), file!);
    toast.success("Document added");
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Document" className="max-w-[min(560px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-5">
        <Input
          label="Document Name"
          name="documentName"
          required
          value={name}
          maxLength={NAME_MAX}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          placeholder="Entry Packet"
          error={errors.name}
        />
        <div className="flex flex-col gap-2">
          <FileUpload
            variant="csv"
            tone="light"
            accept=".pdf,application/pdf"
            prompt="Drag & Drop your PDF here."
            helperText="PDF files only"
            onFile={(f) => {
              setFile(f);
              if (errors.fileName) setErrors((prev) => ({ ...prev, fileName: "" }));
            }}
            onClear={() => setFile(null)}
          />
          {errors.fileName && <p className="text-sm text-error">{errors.fileName}</p>}
        </div>
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button label="Add Document" variant="cta" onClick={add} fullWidth />
      </div>
    </Modal>
  );
}
