"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { formatPhone, toE164Phone, toNationalDigits } from "@/utils/helper";
import { validateAndSetErrors } from "@/utils/validation";
import { useAuth } from "@/context/auth";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import PhoneInput from "@/components/common/phone-input";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import DetailRow from "@/components/sponsor/profile/detail-row";
import { accountSchema } from "@/components/sponsor/profile/schema";
import { CARD_TITLE, INPUT, PROFILE_CARD, SMALL_BUTTON } from "@/components/sponsor/profile/styles";
import type { SponsorProfileAccount, SponsorProfileUpdate, SponsorProfileView } from "@/utils/types/sponsor-profile";

interface AccountForm {
  name: string;
  // As typed in the masked field, "(512) 555-0100".
  phone: string;
}

const digits = (phone: string) => phone.replace(/\D/g, "");

interface AccountDetailsProps {
  account: SponsorProfileAccount;
  // The saved profile from the API's answer.
  onSaved: (profile: SponsorProfileView) => void;
}

// The person who manages sponsorships: name and phone editable in place, email shown only (it's the sign-in).
export default function AccountDetails({ account, onSaved }: AccountDetailsProps) {
  const { refreshProfile } = useAuth();
  // The values being edited; null while viewing.
  const [draft, setDraft] = useState<AccountForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const clearError = (field: keyof AccountForm) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  function cancel() {
    setDraft(null);
    setErrors({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !(await validateAndSetErrors(accountSchema, draft, setErrors))) return;

    // Only what changed; an emptied phone is removed.
    const body: SponsorProfileUpdate = {};
    const name = draft.name.trim();
    if (name !== (account.name ?? "")) body.name = name;
    if (digits(draft.phone) !== digits(toNationalDigits(account.phone))) {
      body.phone = draft.phone ? toE164Phone(draft.phone) : null;
    }
    if (Object.keys(body).length === 0) {
      cancel();
      return;
    }

    setSaving(true);
    const r = await sponsorRequest<SponsorProfileView>("PATCH", routes.api.sponsorProfile, { body });
    setSaving(false);
    if (!r.view) {
      const fields = Object.fromEntries(
        (r.errors ?? []).filter((err) => err.path === "name" || err.path === "phone").map((err) => [err.path, err.message])
      );
      if (Object.keys(fields).length) setErrors(fields);
      else toast.error(r.message ?? "Couldn't save your details. Try again.");
      return;
    }
    onSaved(r.view);
    setDraft(null);
    toast.success("Account details saved");
    // The header shows the name from /me.
    void refreshProfile();
  }

  return (
    <section aria-label="Account" className={cn(PROFILE_CARD, "pb-1 sm:pb-[6px]")}>
      <form onSubmit={save} noValidate>
        <div className="flex justify-between items-center gap-3 flex-wrap pb-5">
          <div>
            <h3 className={CARD_TITLE}>Account</h3>
            <p className="text-sm text-[#a8a8a8] mt-1">The person who manages sponsorships for your brand.</p>
          </div>
          {!draft && (
            <Button
              label="Edit account"
              icon={<Pencil className="size-4" strokeWidth={1.8} />}
              onClick={() => setDraft({ name: account.name ?? "", phone: toNationalDigits(account.phone) })}
              className={cn(SMALL_BUTTON, "bg-transparent border border-[#8b6dff] text-white font-semibold")}
            />
          )}
        </div>

        <DetailRow label="FULL NAME" hideLabel={Boolean(draft)}>
          {draft ? (
            <Input
              label="Full name"
              name="account-name"
              value={draft.name}
              onChange={(e) => {
                const { value } = e.target;
                setDraft((prev) => prev && { ...prev, name: value });
                clearError("name");
              }}
              autoComplete="name"
              error={errors.name}
              variant="dark"
              className="max-w-[480px]"
              labelClassName="sr-only"
              inputClassName={INPUT}
            />
          ) : (
            <div className="text-lg font-semibold break-words">{account.name || "Not added"}</div>
          )}
        </DetailRow>

        <DetailRow label="WORK EMAIL">
          <div className="text-lg font-semibold break-words">{account.email}</div>
          {draft && <p className="text-sm text-[#a8a8a8] mt-1">Your email is how you sign in; it can’t be changed here.</p>}
        </DetailRow>

        <DetailRow label="PHONE" hideLabel={Boolean(draft)}>
          {draft ? (
            <PhoneInput
              label="Phone"
              name="account-phone"
              value={draft.phone}
              onValueChange={(value) => {
                setDraft((prev) => prev && { ...prev, phone: value });
                clearError("phone");
              }}
              placeholder="(555) 000-0000"
              error={errors.phone}
              variant="dark"
              className="max-w-[480px]"
              labelClassName="sr-only"
              inputClassName={INPUT}
            />
          ) : (
            <div className={cn("text-lg font-semibold", !account.phone && "text-[#a8a8a8] font-normal")}>
              {account.phone ? formatPhone(account.phone) : "Not added"}
            </div>
          )}
        </DetailRow>

        {draft && (
          <div className="flex justify-end gap-[10px] flex-wrap py-5 border-t border-[#222]">
            <Button
              label="Cancel"
              onClick={cancel}
              disabled={saving}
              className={cn(OUTLINE_BUTTON, SMALL_BUTTON, "font-semibold")}
            />
            <Button
              type="submit"
              label={saving ? "Saving…" : "Save account"}
              disabled={saving}
              className={cn(PRIMARY_BUTTON, SMALL_BUTTON, "px-5")}
            />
          </div>
        )}
      </form>
    </section>
  );
}
