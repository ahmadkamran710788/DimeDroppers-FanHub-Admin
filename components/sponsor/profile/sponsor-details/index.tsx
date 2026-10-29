"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { formatFileSize } from "@/utils/helper";
import { validateAndSetErrors } from "@/utils/validation";
import { useAuth } from "@/context/auth";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import StatusPill from "@/components/common/status-pill";
import { checkLogo, isLogoFile } from "@/components/sponsor/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import { sponsorBrandSchema } from "@/components/auth/schema";
import DetailRow from "@/components/sponsor/profile/detail-row";
import LogoRow from "@/components/sponsor/profile/logo-row";
import { savedLogo, type ProfileLogo } from "@/components/sponsor/profile/data";
import { CARD_TITLE, INPUT, PROFILE_CARD, SELECT, SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type {
  SponsorBrandProfile,
  SponsorProfileUpdate,
  SponsorProfileView,
  SponsorSignupOptions,
  SponsorTypeCode,
} from "@/utils/types/sponsor-profile";

interface DetailsForm {
  name: string;
  category: string;
  sponsorType: SponsorTypeCode;
  logo: ProfileLogo | null;
  // A newly picked logo, sent as multipart on save.
  logoFile: File | null;
}

const formFromBrand = (brand: SponsorBrandProfile | null): DetailsForm => ({
  name: brand?.name ?? "",
  category: brand?.category ?? "",
  sponsorType: brand?.sponsorType ?? "LOCAL_BUSINESS",
  logo: brand?.logoUrl ? savedLogo(brand.logoUrl) : null,
  logoFile: null,
});

// The profile API's field names → the form's.
const BRAND_FIELDS: Record<string, string> = { sponsorName: "name", category: "category", sponsorType: "sponsorType" };

interface SponsorDetailsProps {
  // null for an account with no brand profile yet: the card opens in edit mode and saving creates it.
  brand: SponsorBrandProfile | null;
  // The sponsor types and categories; null while loading (or if they couldn't be loaded).
  options: SponsorSignupOptions | null;
  // The saved profile from the API's answer.
  onSaved: (profile: SponsorProfileView) => void;
}

// The details the sponsor gave at sign-up (logo, name, category, type), editable in place.
export default function SponsorDetails({ brand, options, onSaved }: SponsorDetailsProps) {
  const { refreshProfile } = useAuth();
  // The values being edited; null while viewing.
  const [draft, setDraft] = useState<DetailsForm | null>(brand ? null : formFromBrand(null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // Object URLs of picked logos, revoked when the page closes.
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const live = urls.current;
    return () => live.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const editing = draft !== null;
  const shownLogo = draft ? draft.logo : brand?.logoUrl ? savedLogo(brand.logoUrl) : null;

  // Until the options load, the saved values are the only choices, so the fields still show them.
  const categoryOptions = options
    ? options.categories.map((c) => ({ label: c.label, value: c.code }))
    : brand?.category
      ? [{ label: brand.category, value: brand.category }]
      : [];
  const typeOptions = options
    ? options.sponsorTypes.map((t) => ({ label: t.label, value: t.code }))
    : brand
      ? [{ label: brand.sponsorTypeLabel, value: brand.sponsorType }]
      : [];

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const setField =
    (field: "name" | "category" | "sponsorType") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = e.target;
      setDraft((prev) => prev && { ...prev, [field]: value });
      clearError(field);
    };

  async function pickLogo(file: File) {
    const problem = options
      ? await checkLogo(file, options.logo)
      : isLogoFile(file)
        ? null
        : "Logo must be an SVG or PNG image";
    if (problem) {
      setErrors((prev) => ({ ...prev, logo: problem }));
      return;
    }
    clearError("logo");
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    const ext = file.name.split(".").pop()?.toUpperCase();
    setDraft(
      (prev) => prev && { ...prev, logo: { name: file.name, spec: `${ext} · ${formatFileSize(file.size)}`, url }, logoFile: file }
    );
  }

  function cancel() {
    setDraft(null);
    setErrors({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !(await validateAndSetErrors(sponsorBrandSchema, draft, setErrors))) return;

    // Only what changed. The sponsor name is always sent when there's no brand yet: it creates one.
    const changes: Pick<SponsorProfileUpdate, "sponsorName" | "category" | "sponsorType"> = {};
    const name = draft.name.trim();
    if (!brand || name !== brand.name) changes.sponsorName = name;
    if (draft.category !== (brand?.category ?? "")) changes.category = draft.category;
    if (draft.sponsorType !== (brand?.sponsorType ?? "LOCAL_BUSINESS")) changes.sponsorType = draft.sponsorType;
    const removeLogo = !draft.logo && Boolean(brand?.logoUrl);
    if (Object.keys(changes).length === 0 && !draft.logoFile && !removeLogo) {
      cancel();
      return;
    }

    // Multipart only to upload a logo; JSON otherwise.
    let body: FormData | SponsorProfileUpdate;
    if (draft.logoFile) {
      const form = new FormData();
      Object.entries(changes).forEach(([field, value]) => value && form.append(field, value));
      form.append("logo", draft.logoFile);
      body = form;
    } else {
      body = { ...changes, ...(removeLogo && { removeLogo: true }) };
    }

    setSaving(true);
    const r = await sponsorRequest<SponsorProfileView>("PATCH", routes.api.sponsorProfile, { body });
    setSaving(false);
    if (!r.view) {
      const fields: Record<string, string> = {};
      for (const err of r.errors ?? []) {
        const field = BRAND_FIELDS[err.path];
        if (field && !fields[field]) fields[field] = err.message;
      }
      // The logo checks come without a field.
      if (r.message && /^logo\b/i.test(r.message)) fields.logo = r.message;
      if (Object.keys(fields).length) setErrors(fields);
      else toast.error(r.message ?? "Couldn't save your details. Try again.");
      return;
    }
    onSaved(r.view);
    setDraft(null);
    toast.success("Sponsor details saved");
    // The header and sidebar show the brand name and logo from /me.
    void refreshProfile();
  }

  return (
    <section aria-label="Sponsor details" className={cn(PROFILE_CARD, "pb-1 sm:pb-[6px]")}>
      <form onSubmit={save} noValidate>
        <div className="flex justify-between items-center gap-3 flex-wrap pb-5">
          <div>
            <div className="flex items-center gap-[10px] flex-wrap">
              <h3 className={CARD_TITLE}>Sponsor details</h3>
              {brand && (
                <StatusPill
                  label="FROM SIGN-UP"
                  color="bg-[#1f1f1f] border border-[#333]"
                  className="h-auto px-[9px] py-1"
                  textClassName="text-[11px] font-bold tracking-[1px] text-[#d4d4d4]"
                />
              )}
            </div>
            <p className="text-sm text-[#a8a8a8] mt-1">
              {brand
                ? "Filled in when you registered. You can change them anytime."
                : "Add your brand so organizations know who is sponsoring them."}
            </p>
          </div>
          {!editing && (
            <Button
              label="Edit details"
              icon={<Pencil className="size-4" strokeWidth={1.8} />}
              onClick={() => setDraft(formFromBrand(brand))}
              className={cn(SMALL_BUTTON, "bg-transparent border border-[#8b6dff] text-white font-semibold")}
            />
          )}
        </div>

        <DetailRow label="SPONSOR LOGO">
          <LogoRow
            logo={shownLogo}
            editing={editing}
            accept={options?.logo.types.join(",")}
            error={errors.logo}
            onPick={pickLogo}
            onRemove={() => {
              setDraft((prev) => prev && { ...prev, logo: null, logoFile: null });
              clearError("logo");
            }}
          />
        </DetailRow>

        <DetailRow label="SPONSOR NAME" hideLabel={editing}>
          {draft ? (
            <Input
              label="Sponsor name"
              name="profile-name"
              value={draft.name}
              onChange={setField("name")}
              autoComplete="organization"
              error={errors.name}
              variant="dark"
              className="max-w-[480px]"
              labelClassName="sr-only"
              inputClassName={INPUT}
            />
          ) : (
            <div className="text-lg font-semibold break-words">{brand?.name}</div>
          )}
        </DetailRow>

        <DetailRow label="SPONSOR TYPE" hideLabel={editing}>
          {draft ? (
            <Select
              label="Sponsor type"
              name="profile-type"
              value={draft.sponsorType}
              onChange={setField("sponsorType")}
              options={typeOptions}
              error={errors.sponsorType}
              variant="dark"
              className="max-w-[480px]"
              labelClassName="sr-only"
              selectClassName={SELECT}
            />
          ) : (
            <div className="text-lg font-semibold">{brand?.sponsorTypeLabel}</div>
          )}
        </DetailRow>

        <DetailRow label="SPONSOR CATEGORY" hideLabel={editing}>
          {draft ? (
            <Select
              label="Sponsor category"
              name="profile-category"
              value={draft.category}
              onChange={setField("category")}
              options={categoryOptions}
              placeholder="Choose a category"
              error={errors.category}
              variant="dark"
              className="max-w-[480px]"
              labelClassName="sr-only"
              selectClassName={SELECT}
            />
          ) : brand?.category ? (
            <div className="text-lg font-semibold">{brand.category}</div>
          ) : (
            // Some older accounts have none yet.
            <div className="text-[15px] text-[#a8a8a8]">Not set yet. Choose one with Edit details.</div>
          )}
        </DetailRow>

        {editing && (
          <div className="flex justify-end gap-[10px] flex-wrap py-5 border-t border-[#222]">
            {brand && (
              <Button
                label="Cancel"
                onClick={cancel}
                disabled={saving}
                className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")}
              />
            )}
            <Button
              type="submit"
              label={saving ? "Saving…" : "Save details"}
              disabled={saving}
              className={cn(PRIMARY_BUTTON, SMALL_BUTTON, "px-5")}
            />
          </div>
        )}
      </form>
    </section>
  );
}
