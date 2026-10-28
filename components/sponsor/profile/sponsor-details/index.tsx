"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatFileSize } from "@/utils/helper";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import StatusPill from "@/components/common/status-pill";
import { SPONSOR_CATEGORY_OPTIONS, isLogoFile } from "@/components/sponsor/data";
import { OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import { sponsorBrandSchema } from "@/components/auth/schema";
import LogoRow from "@/components/sponsor/profile/logo-row";
import { PROFILE_DETAILS, type ProfileDetails } from "@/components/sponsor/profile/data";
import { CARD_TITLE, INPUT, PROFILE_CARD, SELECT, SMALL_BUTTON } from "@/components/sponsor/profile/styles";

interface DetailRowProps {
  label: string;
  // While editing, the field carries its own (screen reader) label, so this one is hidden from them.
  hideLabel?: boolean;
  children: React.ReactNode;
}

// One row of the card: the label column and the value (or its field).
function DetailRow({ label, hideLabel, children }: DetailRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-5 border-t border-[#222]">
      <div aria-hidden={hideLabel || undefined} className={cn(SECTION_LABEL, "flex-[0_0_200px]")}>
        {label}
      </div>
      <div className="flex-[1_1_280px] min-w-0">{children}</div>
    </div>
  );
}

// The details the sponsor gave at sign-up (logo, name, category), editable in place. Saved in memory
// until the sponsor API is integrated.
export default function SponsorDetails() {
  const [details, setDetails] = useState<ProfileDetails>(PROFILE_DETAILS);
  // The values being edited; null while viewing.
  const [draft, setDraft] = useState<ProfileDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Object URLs of picked logos, revoked when the page closes.
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const live = urls.current;
    return () => live.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const editing = draft !== null;
  const shown = draft ?? details;

  const setField = (field: "name" | "category") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value } = e.target;
    setDraft((prev) => prev && { ...prev, [field]: value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  function pickLogo(file: File) {
    if (!isLogoFile(file)) {
      toast.error("Upload your logo as an SVG or PNG");
      return;
    }
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    const ext = file.name.split(".").pop()?.toUpperCase();
    setDraft((prev) => prev && { ...prev, logo: { name: file.name, spec: `${ext} · ${formatFileSize(file.size)}`, url } });
  }

  function cancel() {
    setDraft(null);
    setErrors({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !(await validateAndSetErrors(sponsorBrandSchema, draft, setErrors))) return;
    setDetails({ ...draft, name: draft.name.trim() });
    setDraft(null);
    toast.success("Sponsor details saved");
  }

  return (
    <section aria-label="Sponsor details" className={cn(PROFILE_CARD, "pb-1 sm:pb-[6px]")}>
      <form onSubmit={save} noValidate>
        <div className="flex justify-between items-center gap-3 flex-wrap pb-5">
          <div>
            <div className="flex items-center gap-[10px] flex-wrap">
              <h3 className={CARD_TITLE}>Sponsor details</h3>
              <StatusPill
                label="FROM SIGN-UP"
                color="bg-[#1f1f1f] border border-[#333]"
                className="h-auto px-[9px] py-1"
                textClassName="text-[11px] font-bold tracking-[1px] text-[#d4d4d4]"
              />
            </div>
            <p className="text-sm text-[#a8a8a8] mt-1">Filled in when you registered. You can change them anytime.</p>
          </div>
          {!editing && (
            <Button
              label="Edit details"
              icon={<Pencil className="size-4" strokeWidth={1.8} />}
              onClick={() => setDraft(details)}
              className={cn(SMALL_BUTTON, "bg-transparent border border-[#8b6dff] text-white font-semibold")}
            />
          )}
        </div>

        <DetailRow label="SPONSOR LOGO">
          <LogoRow
            logo={shown.logo}
            editing={editing}
            onPick={pickLogo}
            onRemove={() => setDraft((prev) => prev && { ...prev, logo: null })}
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
            <div className="text-lg font-semibold break-words">{details.name}</div>
          )}
        </DetailRow>

        <DetailRow label="SPONSOR CATEGORY" hideLabel={editing}>
          {draft ? (
            <Select
              label="Sponsor category"
              name="profile-category"
              value={draft.category}
              onChange={setField("category")}
              options={SPONSOR_CATEGORY_OPTIONS}
              placeholder="Choose a category"
              error={errors.category}
              variant="dark"
              className="max-w-[480px]"
              labelClassName="sr-only"
              selectClassName={SELECT}
            />
          ) : (
            <div className="text-lg font-semibold">{details.category}</div>
          )}
        </DetailRow>

        {editing && (
          <div className="flex justify-end gap-[10px] flex-wrap py-5 border-t border-[#222]">
            <Button label="Cancel" onClick={cancel} className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")} />
            <Button type="submit" label="Save details" className={cn(PRIMARY_BUTTON, SMALL_BUTTON, "px-5")} />
          </div>
        )}
      </form>
    </section>
  );
}
