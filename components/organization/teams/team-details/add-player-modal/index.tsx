"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import PhoneInput from "@/components/common/phone-input";
import { addPlayerSchema, editPlayerSchema } from "@/components/organization/teams/team-details/add-player-modal/schema";
import type { RosterPlayer } from "@/components/organization/teams/team-details/use-team-players";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

const INITIAL = { firstName: "", lastName: "", number: "", position: "", email: "", phone: "" };
type Form = typeof INITIAL;

const formFor = (p: RosterPlayer): Form => ({
  firstName: p.firstName,
  lastName: p.lastName,
  number: p.number,
  position: p.position,
  email: p.email,
  phone: p.phone,
});

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // The school team the player is on (its schoolTeamId).
  teamId: string;
  // Set to edit this player instead of adding one.
  player?: RosterPlayer | null;
  // Called after the player is saved, so the roster can reload.
  onSaved: (name: string) => void;
}

// Popup for adding a player to a school team's roster (name and jersey number; the add call takes
// nothing else), or editing one (also position, email and phone). Inviting to Fan Hub is a separate step.
export default function AddPlayerModal({ isOpen, onClose, teamId, player, onSaved }: AddPlayerModalProps) {
  // Mount it per open (the Players tab does) so an edit starts from its player.
  const [form, setForm] = useState<Form>(() => (player ? formFor(player) : INITIAL));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const close = () => {
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  const name = () => [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");

  const add = async () => {
    if (!(await validateAndSetErrors(addPlayerSchema, form, setErrors))) return;
    const lastName = form.lastName.trim();
    const number = form.number.trim();
    setSaving(true);
    // Errors (e.g. the jersey number is taken) are toasted by apiCall.
    const result = await apiCall({
      endpoint: routes.api.rosterSchoolTeamPlayers(teamId),
      method: "POST",
      data: { firstName: form.firstName.trim(), ...(lastName && { lastName }), ...(number && { number }) },
      showSuccessToast: true,
      successMessage: "Player added",
    });
    setSaving(false);
    if (!result.success) return;
    onSaved(name());
    close();
  };

  // Sends only what changed; a cleared optional field is sent as null.
  const edit = async (p: RosterPlayer) => {
    if (!(await validateAndSetErrors(editPlayerSchema, form, setErrors))) return;
    const before = formFor(p);
    const changes: Record<string, string | null> = {};
    for (const key of Object.keys(INITIAL) as (keyof Form)[]) {
      const value = form[key].trim();
      if (value !== before[key].trim()) changes[key] = value || (key === "firstName" ? value : null);
    }
    if (Object.keys(changes).length === 0) return close();
    setSaving(true);
    const result = await apiCall({
      endpoint: routes.api.rosterSchoolPlayer(teamId, p.id),
      method: "PATCH",
      data: changes,
      showSuccessToast: true,
      successMessage: `${name()} updated`,
    });
    setSaving(false);
    if (!result.success) return;
    onSaved(name());
    close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={player ? "Edit Player" : "Add Player"}
      className="max-w-[min(520px,calc(100vw-2rem))] items-stretch"
    >
      <div className="w-full flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="playerFirstName"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="Jordan"
            error={errors.firstName}
          />
          <Input
            label="Last Name (Optional)"
            name="playerLastName"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Taylor"
            error={errors.lastName}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Jersey # (Optional)"
            name="playerNumber"
            value={form.number}
            onChange={(e) => update("number", e.target.value)}
            placeholder="14"
            error={errors.number}
          />
          {player && (
            <Input
              label="Position (Optional)"
              name="playerPosition"
              value={form.position}
              onChange={(e) => update("position", e.target.value)}
              placeholder="Guard"
              error={errors.position}
            />
          )}
        </div>
        {player && (
          <>
            <Input
              label="Email (Optional)"
              name="playerEmail"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.com"
              error={errors.email}
            />
            <PhoneInput
              label="Phone (Optional)"
              name="playerPhone"
              value={form.phone}
              onValueChange={(v) => update("phone", v)}
              error={errors.phone}
              labelClassName="text-midnight-navy"
            />
          </>
        )}
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={close} fullWidth />
        <Button
          label={saving ? (player ? "Saving…" : "Adding…") : player ? "Save Changes" : "Add Player"}
          variant="cta"
          onClick={() => void (player ? edit(player) : add())}
          disabled={saving}
          fullWidth
        />
      </div>
    </Modal>
  );
}
