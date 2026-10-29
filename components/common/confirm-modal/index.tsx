"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  // Label shown on the confirm button while `onConfirm` runs, e.g. "Removing…".
  busyLabel: string;
  // Resolves true when the action succeeded; the modal then closes itself.
  onConfirm: () => Promise<boolean>;
  destructive?: boolean;
  // Extra content under the message, e.g. a checklist (a paragraph can't hold one).
  children?: ReactNode;
  // The confirm button waits, e.g. until something in `children` is picked.
  confirmDisabled?: boolean;
}

// Yes/no popup for an action that needs a second look (remove, withdraw, delete…).
export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel,
  busyLabel,
  onConfirm,
  destructive = false,
  children,
  confirmDisabled = false,
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    const ok = await onConfirm();
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="w-full flex flex-col gap-6">
        <p className="text-midnight-navy/80 text-base leading-6">{message}</p>
        {children}
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
          <Button
            label={busy ? busyLabel : confirmLabel}
            variant={destructive ? "danger" : "cta"}
            onClick={confirm}
            disabled={busy || confirmDisabled}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
