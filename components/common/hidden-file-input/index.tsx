"use client";

import { type Ref } from "react";

interface HiddenFileInputProps {
  // Opens the picker: call `ref.current?.click()` from a visible button.
  ref: Ref<HTMLInputElement>;
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

// Invisible file input behind a custom upload button or drop zone.
export default function HiddenFileInput({ ref, accept, multiple = false, onFiles }: HiddenFileInputProps) {
  return (
    <input
      ref={ref}
      type="file"
      accept={accept}
      multiple={multiple}
      tabIndex={-1}
      aria-hidden="true"
      className="sr-only"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        // Cleared so picking the same file again still fires onChange.
        e.target.value = "";
        if (files.length > 0) onFiles(files);
      }}
    />
  );
}
