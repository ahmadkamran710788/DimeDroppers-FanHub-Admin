"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import { inviteScorekeeperSchema } from "@/components/scorekeepers/schema";

interface InviteScorekeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export default function InviteScorekeeperModal({
  isOpen,
  onClose,
  onInvited,
}: InviteScorekeeperModalProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setEmail("");
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    if (!(await validateAndSetErrors(inviteScorekeeperSchema, { email }, setErrors))) return;

    setLoading(true);
    const result = await apiCall({
      endpoint: routes.api.proxyInviteScorekeeper,
      method: "POST",
      data: { email },
      showSuccessToast: true,
      successMessage: "Invite sent",
      invalidates: ["scorekeeper-pool"],
    });
    setLoading(false);

    if (result.success) {
      setEmail("");
      setErrors({});
      onClose();
      onInvited();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Scorekeeper">
      <div className="w-full flex flex-col gap-6">
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
          }}
          placeholder="fan@example.com"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email}
        />
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={handleClose} disabled={loading} fullWidth />
          <Button
            label={loading ? "Sending…" : "Send Invite"}
            variant="cta"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
