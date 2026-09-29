"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import Textarea from "@/components/common/textarea";
import type { GameRequestConfig } from "@/components/requests/config";
import { reviewNoteSchema } from "@/components/requests/schema";
import apiCall from "@/utils/api-call";
import type { GameRequest } from "@/utils/types/game-request";
import { validateAndSetErrors } from "@/utils/validation";

export type ReviewAction = "accept" | "reject";

interface ReviewRequestModalProps {
  config: GameRequestConfig;
  /** The PENDING request being reviewed; null = closed. */
  target: GameRequest | null;
  action: ReviewAction;
  onClose: () => void;
  onDone: () => void;
}

// Accept or reject a per-game scorekeeper / videographer request, with an optional note
// (shown to the fan).
export default function ReviewRequestModal({ config, target, action, onClose, onDone }: ReviewRequestModalProps) {
  const role = config.role.toLowerCase();
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isAccept = action === "accept";

  const handleClose = () => {
    if (loading) return;
    setNote("");
    setErrors({});
    onClose();
  };

  const handleConfirm = async () => {
    if (!target) return;
    if (!(await validateAndSetErrors(reviewNoteSchema, { reviewNote: note }, setErrors))) return;

    setLoading(true);
    const result = await apiCall({
      endpoint: isAccept ? config.endpoints.accept(target.id) : config.endpoints.reject(target.id),
      method: "POST",
      data: note.trim() ? { reviewNote: note.trim() } : {},
      showSuccessToast: true,
      successMessage: isAccept ? "Request accepted" : "Request rejected",
      invalidates: config.cacheTags,
    });
    setLoading(false);

    if (result.success) {
      setNote("");
      setErrors({});
      onClose();
      onDone();
    }
  };

  const name = target?.fan.name?.trim() || target?.fan.email || "this fan";
  const game = target?.game.title ?? "this game";

  return (
    <Modal isOpen={!!target} onClose={handleClose} title={isAccept ? "Accept Request" : "Reject Request"}>
      <div className="w-full flex flex-col gap-6">
        <p className="text-midnight-navy/80 text-base leading-6">
          {isAccept ? (
            <>
              Make <span className="font-semibold">{name}</span> the official {role} for{" "}
              <span className="font-semibold">{game}</span>?
              {target && !target.inPool && ` They'll also be added to your ${role} pool.`} This replaces any {role}{" "}
              already assigned to the game.
            </>
          ) : (
            <>
              Reject <span className="font-semibold">{name}</span>&apos;s request to {config.duty} for{" "}
              <span className="font-semibold">{game}</span>? They can ask again later.
            </>
          )}
        </p>
        <Textarea
          variant="onLight"
          label={isAccept ? "Note (optional)" : "Note to the fan (optional)"}
          name="reviewNote"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (errors.reviewNote) setErrors((prev) => ({ ...prev, reviewNote: "" }));
          }}
          placeholder={isAccept ? "e.g. Thanks, see you at the gym" : "e.g. Already covered by our staff"}
          maxLength={500}
          rows={3}
          error={errors.reviewNote}
        />
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={handleClose} disabled={loading} fullWidth />
          <Button
            label={loading ? (isAccept ? "Accepting…" : "Rejecting…") : isAccept ? "Accept" : "Reject"}
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
