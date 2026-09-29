"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type * as yup from "yup";
import { useSetup } from "@/context/setup";
import {
  INITIAL_ORG_FORM,
  orgFormFromSchool,
  orgFormToFormData,
  orgSchema,
  type OrgFormState,
} from "@/components/organization/form";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

// Organization profile form state + save. Prefills from the saved school and creates or
// updates it. Used by the Setup Wizard step and the Profile page edit dialogs.
export function useOrganizationForm() {
  const { savedSchool, refreshSchool } = useSetup();
  const [form, setForm] = useState<OrgFormState>(INITIAL_ORG_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Prefill whenever the saved school (re)loads — React's "adjust state on prop change"
  // pattern, so a refreshSchool() after save shows the stored values.
  const [syncedSchool, setSyncedSchool] = useState<typeof savedSchool | undefined>(undefined);
  if (savedSchool !== syncedSchool) {
    setSyncedSchool(savedSchool);
    if (savedSchool) {
      setForm((prev) => orgFormFromSchool(savedSchool, prev));
      if (savedSchool.logoUrl) setLogoUrl(savedSchool.logoUrl);
    }
  }

  const clearError = (field: keyof OrgFormState) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const set =
    (field: keyof OrgFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      clearError(field);
    };

  const setValue = (field: keyof OrgFormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const setLogo = (file: File | null, url: string | null) => {
    setLogoFile(file);
    setLogoUrl(url ?? savedSchool?.logoUrl ?? null);
  };

  // Discard unsaved edits (e.g. a cancelled edit dialog) back to the saved school.
  const reset = () => {
    setForm(savedSchool ? orgFormFromSchool(savedSchool) : INITIAL_ORG_FORM);
    setLogoFile(null);
    setLogoUrl(savedSchool?.logoUrl ?? null);
    setErrors({});
  };

  // Validates `fields` (all fields when omitted), then creates the school on first save or
  // updates the existing one. Returns true on success.
  const save = async (fields?: (keyof OrgFormState)[]): Promise<boolean> => {
    // Only fields the schema knows (colours / logo have no rules).
    type SchemaField = keyof typeof orgSchema.fields;
    const picked = fields?.filter((f): f is SchemaField => f in orgSchema.fields);
    const schema = (picked ? orgSchema.pick(picked) : orgSchema) as yup.ObjectSchema<Record<string, unknown>>;
    if (!(await validateAndSetErrors(schema, form, setErrors))) return false;

    const existingSchoolId = sessionStorage.getItem("fanhub:schoolId");
    const body = orgFormToFormData(form, logoFile);

    setSaving(true);
    try {
      const res = existingSchoolId
        ? await fetch(`${routes.api.proxyUpdateSchool}?schoolId=${encodeURIComponent(existingSchoolId)}`, {
            method: "PUT",
            body,
          })
        : await fetch(routes.api.proxyCreateSchool, { method: "POST", body });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || `Failed to ${existingSchoolId ? "update" : "create"} school. Please try again.`);
        return false;
      }

      const schoolId = json?.data?.[0]?.school?.id ?? existingSchoolId;
      if (schoolId) sessionStorage.setItem("fanhub:schoolId", String(schoolId));
      if (form.teamName) sessionStorage.setItem("fanhub:teamName", form.teamName);

      setLogoFile(null);
      await refreshSchool();
      toast.success(existingSchoolId ? "Profile updated" : "School created");
      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { form, errors, logoUrl, saving, set, setValue, setLogo, reset, save, savedSchool };
}
