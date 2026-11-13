"use client";

import { useState } from "react";
import * as yup from "yup";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import { playerName } from "@/components/organization/teams/tournament-team-details/invite-role-modal";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposurePlayer } from "@/utils/types/exposure-event";
import { validateAndSetErrors } from "@/utils/validation";

const schema = yup.object({ email: yup.string().trim().required("Email is required").email("Enter a valid email address") });

interface InvitePlayerModalProps {
  onClose: () => void;
  fanHubTeamId: string;
  player: ExposurePlayer;
  onSent: () => void;
}

// Popup that emails a tournament team's synced player an invitation to the team
// (POST /roster/fanhub-teams/{id}/players/{playerId}/invite). The email is saved on the player.
export default function InvitePlayerModal({ onClose, fanHubTeamId, player, onSent }: InvitePlayerModalProps) {
  const [form, setForm] = useState({ email: player.email ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!(await validateAndSetErrors(schema, form, setErrors))) return;
    setSending(true);
    // apiCall toasts the API's errors (e.g. 409 already invited, or the email holds another role).
    const result = await apiCall({
      endpoint: routes.api.rosterFanHubPlayerInvite(fanHubTeamId, player.id),
      method: "POST",
      data: { email: form.email.trim() },
      showSuccessToast: true,
      successMessage: `Invitation sent to ${form.email.trim()}`,
    });
    setSending(false);
    if (!result.success) return;
    onSent();
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Invite ${playerName(player)}`} className="max-w-[min(520px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-5">
        <Input
          label="Email"
          name="invitePlayerEmail"
          type="email"
          required
          value={form.email}
          onChange={(e) => {
            setForm({ email: e.target.value });
            if (errors.email) setErrors({});
          }}
          placeholder="name@example.com"
          error={errors.email}
        />
        <p className="text-sm text-midnight-navy/60">
          They get an email and an invitation in the Fan Hub app, valid for 7 days. Accepting links them to this player.
        </p>
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button label={sending ? "Sending…" : "Send Invite"} variant="cta" onClick={send} disabled={sending} fullWidth />
      </div>
    </Modal>
  );
}
