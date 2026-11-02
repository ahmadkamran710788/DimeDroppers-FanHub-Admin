"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import Select from "@/components/common/select";
import { inviteRoleSchema } from "@/components/organization/teams/tournament-team-details/invite-role-modal/schema";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposurePlayer } from "@/utils/types/exposure-event";
import { validateAndSetErrors } from "@/utils/validation";

// A role choice: the API role plus, for coaches, the title.
export const STAFF_CHOICES = [
  { label: "Head Coach", value: "HEAD_COACH" },
  { label: "Assistant Coach", value: "ASSISTANT_COACH" },
  { label: "Coach", value: "COACH" },
  { label: "Scorekeeper", value: "SCOREKEEPER" },
  { label: "Videographer", value: "VIDEOGRAPHER" },
];

// The invite body for a choice: HEAD_COACH / ASSISTANT_COACH are the COACH role with a staffTitle.
export const roleBody = (choice: string) =>
  choice === "HEAD_COACH" || choice === "ASSISTANT_COACH" ? { role: "COACH", staffTitle: choice } : { role: choice };

export const playerName = (p: ExposurePlayer) => [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed player";

const INITIAL = { role: "", email: "", playerId: "" };
type Form = typeof INITIAL;

interface InviteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fanHubTeamId: string;
  // "staff": coach / scorekeeper / videographer. "parent": a parent of a roster player.
  kind: "staff" | "parent";
  players: ExposurePlayer[];
  onSent: () => void;
}

// Popup that emails someone an invitation to a role on a tournament team (POST /team-roles).
export default function InviteRoleModal({ isOpen, onClose, fanHubTeamId, kind, players, onSent }: InviteRoleModalProps) {
  const [form, setForm] = useState<Form>(() => ({ ...INITIAL, role: kind === "parent" ? "PARENT" : "" }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const send = async () => {
    if (!(await validateAndSetErrors(inviteRoleSchema, form, setErrors))) return;
    setSending(true);
    // apiCall toasts the API's errors (e.g. 409 already invited or holding another role).
    const result = await apiCall({
      endpoint: routes.api.teamRoles,
      method: "POST",
      data: {
        email: form.email.trim(),
        fanHubTeamId,
        ...roleBody(form.role),
        ...(form.playerId && { fanHubPlayerId: form.playerId }),
      },
      showSuccessToast: true,
      successMessage: `Invitation sent to ${form.email.trim()}`,
    });
    setSending(false);
    if (!result.success) return;
    onSent();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={kind === "parent" ? "Invite Parent" : "Invite Staff"}
      className="max-w-[min(520px,calc(100vw-2rem))] items-stretch"
    >
      <div className="w-full flex flex-col gap-5">
        {kind === "staff" ? (
          <Select
            label="Role"
            name="teamRole"
            required
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            options={STAFF_CHOICES}
            placeholder="Choose a role"
            error={errors.role}
          />
        ) : (
          <Select
            label="Player"
            name="teamRolePlayer"
            required
            value={form.playerId}
            onChange={(e) => update("playerId", e.target.value)}
            options={players.map((p) => ({ label: playerName(p), value: p.id }))}
            placeholder={players.length ? "Choose the player" : "This team has no players yet"}
            error={errors.playerId}
            disabled={!players.length}
          />
        )}
        <Input
          label="Email"
          name="teamRoleEmail"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="name@example.com"
          error={errors.email}
        />
        <p className="text-sm text-midnight-navy/60">
          They get an email and an invitation in the Fan Hub app, valid for 7 days. They don&apos;t need an account yet.
        </p>
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button label={sending ? "Sending…" : "Send Invite"} variant="cta" onClick={send} disabled={sending} fullWidth />
      </div>
    </Modal>
  );
}
