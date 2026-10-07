"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import { inviteSchema } from "@/components/teams/team-details/invite-modal/schema";
import { validateAndSetErrors } from "@/utils/validation";

interface InviteModalProps {
  // Who is being invited; null closes the popup.
  invitee: { name: string; email: string } | null;
  onClose: () => void;
  onSend: (email: string) => void;
}

// Popup that asks for an email address and sends a team invite to it.
// Keyed by the caller per invitee, so the email field starts from that person's email.
export default function InviteModal({ invitee, onClose, onSend }: InviteModalProps) {
  const [email, setEmail] = useState(invitee?.email ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const send = async () => {
    if (!(await validateAndSetErrors(inviteSchema, { email }, setErrors))) return;
    onSend(email.trim());
    onClose();
  };

  return (
    <Modal isOpen={!!invitee} onClose={onClose} title="Send Invite" className="items-stretch">
      <p className="text-sm text-midnight-navy/70">
        {`Enter the email address to send ${invitee?.name ?? "this person"} an invite to the team.`}
      </p>
      <Input
        label="Email"
        name="inviteEmail"
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors({});
        }}
        placeholder="name@example.com"
        error={errors.email}
      />
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button label="Send Invite" variant="cta" icon={<Send className="size-4" strokeWidth={2} />} onClick={send} fullWidth />
      </div>
    </Modal>
  );
}
