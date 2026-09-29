"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import type { StaffPoolConfig } from "@/components/staff-pool/config";
import apiCall from "@/utils/api-call";
import type { StaffPoolMember } from "@/utils/types/staff-pool";

export type StaffPoolAction = "accept" | "reject" | "revoke";

interface ConfirmActionModalProps {
  config: StaffPoolConfig;
  /** The member being acted on; null = closed. */
  target: StaffPoolMember | null;
  action: StaffPoolAction;
  onClose: () => void;
  onDone: () => void;
}

const COPY: Record<StaffPoolAction, { title: string; button: string; busy: string; toast: string }> = {
  accept: { title: "Accept Request", button: "Accept", busy: "Accepting…", toast: "Request accepted" },
  reject: { title: "Reject Request", button: "Reject", busy: "Rejecting…", toast: "Request rejected" },
  revoke: { title: "Revoke Access", button: "Revoke", busy: "Revoking…", toast: "Access revoked" },
};

// Confirms accept / reject (REQUESTED rows) or revoke (ACTIVE rows) for a staff pool member.
export default function ConfirmActionModal({ config, target, action, onClose, onDone }: ConfirmActionModalProps) {
  const [loading, setLoading] = useState(false);
  const copy = COPY[action];
  const pool = `${config.role.toLowerCase()} pool`;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (!target) return;
    const { endpoints } = config;
    const isRevoke = action === "revoke";
    if (isRevoke && !endpoints.revoke) return;

    setLoading(true);
    const result = await apiCall({
      endpoint:
        action === "accept"
          ? endpoints.accept(target.id)
          : action === "reject"
            ? endpoints.reject(target.id)
            : endpoints.revoke!(target.id),
      method: isRevoke ? "DELETE" : "POST",
      showSuccessToast: true,
      successMessage: copy.toast,
      invalidates: [config.cacheTag],
    });
    setLoading(false);

    if (result.success) {
      onClose();
      onDone();
    }
  };

  const name = target?.fan?.name?.trim() || target?.fan?.email || target?.email || "this fan";

  return (
    <Modal isOpen={!!target} onClose={handleClose} title={copy.title}>
      <div className="w-full flex flex-col gap-6">
        <p className="text-midnight-navy/80 text-base leading-6">
          {action === "accept" && (
            <>
              Add <span className="font-semibold">{name}</span> to your {pool}? They&apos;ll become eligible
              to be assigned to games.
            </>
          )}
          {action === "reject" && (
            <>
              Reject <span className="font-semibold">{name}</span>&apos;s request to join your {pool}? This
              cannot be undone.
            </>
          )}
          {action === "revoke" && (
            <>
              Remove <span className="font-semibold">{name}</span> from your {pool}? They&apos;ll no longer be
              eligible to be assigned to games.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={handleClose} disabled={loading} fullWidth />
          <Button
            label={loading ? copy.busy : copy.button}
            variant={action === "accept" ? "cta" : "danger"}
            onClick={handleConfirm}
            disabled={loading}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
