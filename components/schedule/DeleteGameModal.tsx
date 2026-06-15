"use client";

import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ScheduleItem } from "@/utils/types/schedule";
import { useState } from "react";

interface DeleteGameModalProps {
  game: ScheduleItem | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteGameModal({ game, onClose, onDeleted }: DeleteGameModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!game) return;
    setLoading(true);
    const result = await apiCall({
      endpoint: routes.api.proxyDeleteSchedule(game.id),
      method: "DELETE",
      showSuccessToast: true,
      successMessage: "Game deleted",
    });
    setLoading(false);
    if (result.success) {
      onClose();
      onDeleted();
    }
  };

  return (
    <Modal isOpen={!!game} onClose={onClose} title="Delete Game">
      <div className="w-full flex flex-col gap-6">
        <p className="text-midnight-navy/80 text-base leading-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{game?.title ?? "this game"}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
          <Button
            label={loading ? "Deleting…" : "Delete"}
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
