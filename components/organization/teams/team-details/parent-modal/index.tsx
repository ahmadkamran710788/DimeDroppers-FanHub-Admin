"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import PhoneInput from "@/components/common/phone-input";
import Select from "@/components/common/select";
import { addParentSchema, editParentSchema } from "@/components/organization/teams/team-details/parent-modal/schema";
import type { RosterParent, RosterPlayer } from "@/components/organization/teams/team-details/use-team-players";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

const INITIAL = { playerId: "", firstName: "", lastName: "", email: "", phone: "" };
type Form = typeof INITIAL;

const formFor = (p: RosterParent): Form => ({
  playerId: p.playerId,
  firstName: p.firstName,
  lastName: p.lastName,
  email: p.email,
  phone: p.phone,
});

// Once invited or on the team, the API won't change the email.
export const emailLocked = (p: RosterParent) => p.invitationStatus === "INVITED" || p.invitationStatus === "ACTIVE";

interface ParentModalProps {
  onClose: () => void;
  // The school team (its schoolTeamId).
  teamId: string;
  // The team's players, to choose whose parent this is.
  players: RosterPlayer[];
  // Set to edit this parent instead of inviting a new one.
  parent?: RosterParent | null;
  // Called after a change, so the roster can reload.
  onSaved: () => void;
}

// Popup for inviting a parent of a school team player: adds the parent under the player (name, phone),
// then emails the invitation. Editing changes the name, email and phone.
export default function ParentModal({ onClose, teamId, players, parent, onSaved }: ParentModalProps) {
  const [form, setForm] = useState<Form>(() => (parent ? formFor(parent) : INITIAL));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locked = !!parent && emailLocked(parent);

  const update = (key: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // Adds the parent, then emails the invitation. The parent only stays when the invitation goes: if it fails
  // (e.g. 409, that email already has a role on this team) the parent just added is taken off again, and the
  // popup stays open to change the email and send again.
  const invite = async () => {
    if (!(await validateAndSetErrors(addParentSchema, form, setErrors))) return;
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    setSaving(true);
    // apiCall toasts the API's errors.
    const result = await apiCall<{ data: { id: string } | { id: string }[] }>({
      endpoint: routes.api.rosterSchoolPlayerParents(teamId, form.playerId),
      method: "POST",
      data: { firstName: form.firstName.trim(), ...(lastName && { lastName }), ...(form.phone && { phone: form.phone }) },
    });
    // The API wraps the new parent in an array (data[0]); the doc shows a bare object, so take either.
    const body = result.success ? result.data?.data : undefined;
    const parentId = (Array.isArray(body) ? body[0] : body)?.id;
    if (!parentId) return setSaving(false);
    const sent = await apiCall({
      endpoint: routes.api.rosterSchoolParentInvite(teamId, form.playerId, parentId),
      method: "POST",
      data: { email },
      showSuccessToast: true,
      successMessage: `Invitation sent to ${email}`,
    });
    if (!sent.success) {
      await apiCall({ endpoint: routes.api.rosterSchoolParent(teamId, form.playerId, parentId), method: "DELETE" });
      setSaving(false);
      setErrors((prev) => ({ ...prev, email: "The invitation didn't go to this email. Try another one." }));
      return;
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  // Sends only what changed; a cleared optional field is sent as null.
  const edit = async (p: RosterParent) => {
    if (!(await validateAndSetErrors(editParentSchema, form, setErrors))) return;
    const before = formFor(p);
    const changes: Record<string, string | null> = {};
    for (const key of ["firstName", "lastName", "email", "phone"] as const) {
      const value = form[key].trim();
      if (value === before[key].trim()) continue;
      // The API can change an email but not clear it.
      if (key === "email" && !value) continue;
      changes[key] = value || (key === "firstName" ? value : null);
    }
    if (Object.keys(changes).length === 0) return onClose();
    setSaving(true);
    const result = await apiCall({
      endpoint: routes.api.rosterSchoolParent(teamId, p.playerId, p.id),
      method: "PATCH",
      data: changes,
      showSuccessToast: true,
      successMessage: "Parent updated",
    });
    setSaving(false);
    if (!result.success) return;
    onSaved();
    onClose();
  };

  const note = !parent
    ? "They get an email and an invitation in the Fan Hub app, valid for 7 days. They don't need an account yet."
    : locked
      ? "The email can't be changed while an invitation is pending or the parent is on the team."
      : null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={parent ? "Edit Parent" : "Invite Parent"}
      className="max-w-[min(520px,calc(100vw-2rem))] items-stretch"
    >
      <div className="w-full flex flex-col gap-5">
        {!parent && (
          <Select
            label="Player"
            name="parentPlayer"
            required
            value={form.playerId}
            onChange={(e) => update("playerId", e.target.value)}
            options={players.map((p) => ({ label: [p.number && `#${p.number}`, p.name].filter(Boolean).join(" "), value: p.id }))}
            placeholder={players.length ? "Choose the player" : "This team has no players yet"}
            error={errors.playerId}
            disabled={!players.length}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="parentFirstName"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="Sara"
            error={errors.firstName}
          />
          <Input
            label="Last Name (Optional)"
            name="parentLastName"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Khan"
            error={errors.lastName}
          />
        </div>
        <Input
          label={parent ? "Email (Optional)" : "Email"}
          name="parentEmail"
          type="email"
          required={!parent}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="name@example.com"
          error={errors.email}
          disabled={locked}
        />
        <PhoneInput
          label="Phone (Optional)"
          name="parentPhone"
          value={form.phone}
          onValueChange={(v) => update("phone", v)}
          error={errors.phone}
          labelClassName="text-midnight-navy"
        />
        {note && <p className="text-sm text-midnight-navy/60">{note}</p>}
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button
          label={saving ? (parent ? "Saving…" : "Sending…") : parent ? "Save Changes" : "Send Invite"}
          variant="cta"
          onClick={() => void (parent ? edit(parent) : invite())}
          disabled={saving}
          fullWidth
        />
      </div>
    </Modal>
  );
}
