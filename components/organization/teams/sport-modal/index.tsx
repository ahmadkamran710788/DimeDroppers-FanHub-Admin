"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import { sportSchema } from "@/components/organization/teams/sport-modal/schema";
import type { Department } from "@/components/organization/teams/use-org-teams";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

interface SportModalProps {
  // Set to rename this sport; otherwise a new one is added.
  sport?: Department | null;
  onClose: () => void;
  // Called after the API saved it, so the page can reload.
  onSaved: () => void;
}

// Add Sport / Rename Sport. apiCall toasts a refusal, e.g. 409 "A department with this name already exists".
// Mount it per open.
export default function SportModal({ sport, onClose, onSaved }: SportModalProps) {
  const [name, setName] = useState(sport?.name ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!(await validateAndSetErrors(sportSchema, { name }, setErrors))) return;
    setSaving(true);
    const result = await apiCall({
      endpoint: sport ? routes.api.orgDepartment(sport.id) : routes.api.orgDepartments,
      method: sport ? "PATCH" : "POST",
      data: { name: name.trim() },
      showSuccessToast: true,
      successMessage: sport ? "Activity renamed" : "Activity added",
    });
    setSaving(false);
    if (!result.success) return;
    onSaved();
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={sport ? "Rename Activity" : "Add Activity"} className="max-w-[min(480px,calc(100vw-2rem))] items-stretch">
      <div className="w-full flex flex-col gap-5">
        <Input
          label="Activity Name"
          name="sportName"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({});
          }}
          placeholder="Track and Field"
          error={errors.name}
        />
      </div>
      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button
          label={saving ? "Saving…" : sport ? "Save" : "Add Activity"}
          variant="cta"
          onClick={save}
          disabled={saving}
          fullWidth
        />
      </div>
    </Modal>
  );
}
