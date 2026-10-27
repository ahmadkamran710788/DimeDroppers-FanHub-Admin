"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import Textarea from "@/components/common/textarea";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PackageActivation } from "@/utils/types/sponsor-packages";

interface CancelModalProps {
  // The active sponsorship being cancelled; null = closed.
  target: PackageActivation | null;
  onClose: () => void;
  // After it was cancelled, or turned out not to be active any more: the list reloads.
  onDone: () => void;
}

// Cancel one active sponsorship (POST /activations/:id/cancel), with an optional reason.
export default function CancelModal({ target, onClose, onDone }: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setReason("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!target) return;
    setLoading(true);
    const trimmed = reason.trim();
    const r = await sponsorRequest<PackageActivation>("POST", routes.api.sponsorActivationCancel(target.id), {
      body: trimmed ? { reason: trimmed } : {},
    });
    setLoading(false);
    if (r.view) toast.success(`${r.view.packageName} cancelled`);
    else toast.error(r.message ?? "Couldn't cancel, please try again.");
    // 409: it was already cancelled or has expired; the list shows it as it is now.
    if (r.view || r.status === 409) {
      setReason("");
      onClose();
      onDone();
    }
  };

  const name = target?.packageName ?? "this sponsorship";
  const org = target?.organization.name ?? "this organization";

  return (
    <Modal isOpen={!!target} onClose={handleClose} title="Cancel Sponsorship">
      <div className="w-full flex flex-col gap-6">
        <p className="text-midnight-navy/80 text-base leading-6">
          Cancel <span className="font-semibold">{name}</span> with <span className="font-semibold">{org}</span>
          {target?.event?.name ? ` for ${target.event.name}` : ""}? It stops right away. You can activate it again
          later from Find Organizations.
        </p>
        <Textarea
          variant="onLight"
          label="Reason (optional)"
          name="cancelReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Budget moved to next season"
          maxLength={500}
          rows={3}
        />
        <div className="flex gap-3">
          <Button label="Keep it" variant="secondary" onClick={handleClose} disabled={loading} fullWidth />
          <Button
            label={loading ? "Cancelling…" : "Cancel sponsorship"}
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
