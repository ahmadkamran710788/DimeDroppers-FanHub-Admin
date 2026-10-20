"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import Select from "@/components/common/select";
import { editTeamSchema } from "@/components/organization/teams/edit-team-modal/schema";
import { TEAM_GENDER_OPTIONS, TEAM_LEVEL_OPTIONS, withCurrent } from "@/components/organization/teams/team-options";
import type { Department, DepartmentTeam } from "@/components/organization/teams/use-org-teams";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

interface EditTeamModalProps {
  team: DepartmentTeam;
  // The sport the team is in now.
  sport: string;
  departments: Department[];
  onClose: () => void;
  // Called after the API saved it, so the page can reload.
  onSaved: () => void;
}

// Edit Team: name, level, gender and sport (picking another sport moves the team there). Only the
// changed fields are sent; an emptied level / gender is sent as null to clear it. apiCall toasts a
// refusal, e.g. 409 "A team with this name already exists in this sport". Mount it per open.
export default function EditTeamModal({ team, sport, departments, onClose, onSaved }: EditTeamModalProps) {
  const initial = { name: team.name, sport, level: team.level ?? "", gender: team.gender ?? "" };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const update = (key: keyof typeof initial, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const save = async () => {
    if (!(await validateAndSetErrors(editTeamSchema, form, setErrors))) return;
    const changes = {
      ...(form.name.trim() !== initial.name && { name: form.name.trim() }),
      ...(form.sport !== initial.sport && { sport: form.sport }),
      ...(form.level !== initial.level && { level: form.level || null }),
      ...(form.gender !== initial.gender && { gender: form.gender || null }),
    };
    if (Object.keys(changes).length === 0) return onClose();
    setSaving(true);
    const result = await apiCall({
      endpoint: routes.api.orgTeam(team.id),
      method: "PATCH",
      data: changes,
      invalidates: [routes.api.orgDepartments],
      showSuccessToast: true,
      successMessage: "Team updated",
    });
    setSaving(false);
    if (!result.success) return;
    onSaved();
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Team" className="max-w-[min(560px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-5">
        <Input
          label="Team Name"
          name="teamName"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          error={errors.name}
        />
        <Select
          label="Activity"
          name="sport"
          value={form.sport}
          onChange={(e) => update("sport", e.target.value)}
          options={departments.map((d) => ({ label: d.name, value: d.name }))}
          error={errors.sport}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            label="Level"
            name="level"
            value={form.level}
            onChange={(e) => update("level", e.target.value)}
            options={withCurrent(TEAM_LEVEL_OPTIONS, initial.level)}
            placeholder="No level"
          />
          <Select
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            options={withCurrent(TEAM_GENDER_OPTIONS, initial.gender)}
            placeholder="Not set"
          />
        </div>
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button label={saving ? "Saving…" : "Save Changes"} variant="cta" onClick={save} disabled={saving} fullWidth />
      </div>
    </Modal>
  );
}
