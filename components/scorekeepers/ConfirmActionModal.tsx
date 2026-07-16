"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ScorekeeperPoolMember } from "@/utils/types/scorekeeper";

export type ScorekeeperAction = "accept" | "reject";

interface ConfirmActionModalProps {
  /** The REQUESTED member being acted on; null = closed. */
  target: ScorekeeperPoolMember | null;
  action: ScorekeeperAction;
  onClose: () => void;
  onDone: () => void;
}

export default function ConfirmActionModal({
  target,
  action,
  onClose,
  onDone,
}: ConfirmActionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (!target) return;

    setLoading(true);
    const result = await apiCall({
      endpoint:
        action === "accept"
          ? routes.api.proxyAcceptScorekeeper(target.id)
          : routes.api.proxyRejectScorekeeper(target.id),
      method: "POST",
      showSuccessToast: true,
      successMessage: action === "accept" ? "Request accepted" : "Request rejected",
      invalidates: ["scorekeeper-pool"],
    });
    setLoading(false);

    if (result.success) {
      onClose();
      onDone();
    }
  };

  const name = target?.fan?.name?.trim() || target?.fan?.email || target?.email || "this fan";
  const isAccept = action === "accept";

  return (
    <Modal
      isOpen={!!target}
      onClose={handleClose}
      title={isAccept ? "Accept Request" : "Reject Request"}
    >
      <div className="w-full flex flex-col gap-6">
        <p className="text-midnight-navy/80 text-base leading-6">
          {isAccept ? (
            <>
              Add <span className="font-semibold">{name}</span> to your scorekeeper pool? They&apos;ll
              become eligible to be assigned to games.
            </>
          ) : (
            <>
              Reject <span className="font-semibold">{name}</span>&apos;s request to join your
              scorekeeper pool? This cannot be undone.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={handleClose} disabled={loading} fullWidth />
          <Button
            label={
              loading
                ? isAccept
                  ? "Accepting…"
                  : "Rejecting…"
                : isAccept
                  ? "Accept"
                  : "Reject"
            }
            variant={isAccept ? "cta" : "danger"}
            onClick={handleConfirm}
            disabled={loading}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
