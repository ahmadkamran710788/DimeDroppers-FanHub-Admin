"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DateField from "@/components/common/date-field";
import CheckboxGroup from "@/components/common/checkbox-group";
import Input from "@/components/common/input";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import WizardFooter from "@/components/common/wizard-footer";
import {
  IMPACT_OPTIONS,
  createCampaignSchema,
  DESCRIPTION_MAX,
  type CampaignImpact,
} from "@/components/organization/fundraising/create-campaign/schema";
import { useOrgTeams } from "@/components/organization/teams/use-org-teams";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { Campaign, CreateCampaignPayload, UpdateCampaignPayload } from "@/utils/types/campaign";
import { validateAndSetErrors } from "@/utils/validation";

const INITIAL_FORM = {
  name: "",
  teamId: "",
  goal: "",
  startDate: "",
  endDate: "",
  sponsorName: "",
  description: "",
  impact: [] as CampaignImpact[],
};
type Form = typeof INITIAL_FORM;

// "2026-11-30T23:59:59.000Z" → "2026-11-30" for the date fields.
const datePart = (iso: string) => iso.slice(0, 10);

// The campaign runs through the end of the chosen day.
const endOfDay = (date: string) => `${date}T23:59:59.000Z`;

const formFor = (c: Campaign): Form => ({
  name: c.title,
  teamId: c.teamId,
  goal: String(c.goalAmount),
  // The API has no start date; a campaign starts when it is created.
  startDate: datePart(c.createdAt),
  endDate: datePart(c.endDate),
  sponsorName: c.sponsorName ?? "",
  description: c.description ?? "",
  impact: [],
});

// Only what changed; a cleared description or sponsor is sent as null.
const changesFrom = (before: Form, form: Form): UpdateCampaignPayload => {
  const description = form.description.trim();
  const sponsorName = form.sponsorName.trim();
  return {
    ...(form.name.trim() !== before.name && { title: form.name.trim() }),
    ...(form.teamId !== before.teamId && { teamId: form.teamId }),
    ...(Number(form.goal) !== Number(before.goal) && { goalAmount: Number(form.goal) }),
    ...(form.endDate !== before.endDate && { endDate: endOfDay(form.endDate) }),
    ...(description !== before.description && { description: description || null }),
    ...(sponsorName !== before.sponsorName && { sponsorName: sponsorName || null }),
  };
};

const LABEL = "text-white";
// Design fields are white with a 2px hairline border.
const FIELD = "bg-white border-2 border-[rgba(11,28,45,0.11)]";

interface CampaignFormProps {
  // Set to edit that campaign instead of creating one.
  campaignId?: string;
}

// Create a campaign (live, or as a draft only the organisation sees), or edit one.
export default function CreateCampaignPage({ campaignId }: CampaignFormProps) {
  const router = useRouter();
  const { teams } = useOrgTeams();
  const [form, setForm] = useState<Form>(INITIAL_FORM);
  // The loaded campaign's values, to send only what changed.
  const [original, setOriginal] = useState<Form | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<"DRAFT" | "ACTIVE" | "SAVE" | null>(null);
  const editing = !!campaignId;

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    apiCall<{ data: Campaign[] }>({ endpoint: routes.api.campaign(campaignId), method: "GET" }).then((result) => {
      if (cancelled) return;
      const campaign = result.success ? result.data?.data?.[0] : undefined;
      if (!campaign) {
        setLoadFailed(true);
        return;
      }
      const values = formFor(campaign);
      setOriginal(values);
      setForm(values);
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const teamOptions = teams.map((t) => ({ label: `${t.name} · ${t.sport}`, value: t.id }));

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const back = () => router.push(routes.ui.fundraising);

  // An ACTIVE creation goes live and notifies the school's followers; a DRAFT stays private.
  const handleCreate = async (status: "DRAFT" | "ACTIVE") => {
    if (!(await validateAndSetErrors(createCampaignSchema, form, setErrors))) return;

    // startDate and impact are UI-only until the backend supports them.
    const payload: CreateCampaignPayload = {
      title: form.name.trim(),
      goalAmount: Number(form.goal),
      endDate: endOfDay(form.endDate),
      teamId: form.teamId,
      status,
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.sponsorName.trim() && { sponsorName: form.sponsorName.trim() }),
    };

    setSubmitting(status);
    const { success } = await apiCall({
      endpoint: routes.api.campaigns,
      method: "POST",
      data: { ...payload },
      invalidates: [routes.api.campaigns],
      showSuccessToast: true,
      successMessage: status === "DRAFT" ? "Draft saved" : "Campaign created",
    });
    setSubmitting(null);
    if (success) back();
  };

  const handleSave = async () => {
    if (!campaignId || !original) return;
    if (!(await validateAndSetErrors(createCampaignSchema, form, setErrors))) return;
    const changes = changesFrom(original, form);
    if (Object.keys(changes).length === 0) return back();

    setSubmitting("SAVE");
    const { success } = await apiCall({
      endpoint: routes.api.campaign(campaignId),
      method: "PATCH",
      data: { ...changes },
      invalidates: [routes.api.campaigns],
      showSuccessToast: true,
      successMessage: "Campaign updated",
    });
    setSubmitting(null);
    if (success) back();
  };

  const title = editing ? "Edit Campaign" : "Create Campaign";

  return (
    <div className="flex flex-col gap-10 pb-24">
      <Link
        href={routes.ui.fundraising}
        className="self-start flex items-center gap-3 text-base leading-6 font-medium text-white hover:opacity-80 transition-opacity"
      >
        <ArrowLeft className="size-6" strokeWidth={1.5} />
        Back to Fundraising
      </Link>

      <div className="flex flex-col text-white">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          {title}
        </h2>
        <p className="text-base leading-[26px]">
          {editing ? "Update the details of this fundraising campaign." : "Set up a new fundraising campaign for your organization."}
        </p>
      </div>

      {editing && !original ? (
        <p className="py-16 text-center text-sm text-white/60">
          {loadFailed ? "This campaign could not be found." : "Loading campaign…"}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,639fr)_minmax(0,445fr)] gap-6 lg:gap-10 items-start">
          <SectionCard title="Campaign Information" className="lg:p-6">
            <Input
              label="Campaign Name"
              name="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Twin Lakes Boys Basketball"
              error={errors.name}
              labelClassName={LABEL}
              inputClassName={FIELD}
            />
            <Select
              label="Team"
              name="teamId"
              value={form.teamId}
              onChange={(e) => update("teamId", e.target.value)}
              options={teamOptions}
              placeholder="Select team"
              error={errors.teamId}
              labelClassName={LABEL}
              selectClassName={FIELD}
            />
            <Input
              label="Goal Amount"
              name="goal"
              value={form.goal}
              // Digits and one decimal point, max 2 decimals.
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, "");
                if (/^\d*(\.\d{0,2})?$/.test(v)) update("goal", v);
              }}
              placeholder="0.00"
              icon={<span className="text-base font-medium">$</span>}
              error={errors.goal}
              labelClassName={LABEL}
              inputClassName={`${FIELD} text-right`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DateField
                label="Start Date"
                name="startDate"
                value={form.startDate}
                onChange={(v) => update("startDate", v)}
                error={errors.startDate}
                // A campaign starts when it is created; the date can't be moved afterwards.
                disabled={editing}
              />
              <DateField
                label="End Date"
                name="endDate"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(v) => update("endDate", v)}
                error={errors.endDate}
              />
            </div>
            <Input
              label="Sponsor Name (Optional)"
              name="sponsorName"
              value={form.sponsorName}
              onChange={(e) => update("sponsorName", e.target.value)}
              placeholder="Local Sponsor Inc"
              error={errors.sponsorName}
              labelClassName={LABEL}
              inputClassName={FIELD}
            />
            {!editing && (
              <CheckboxGroup
                label="Purpose"
                options={IMPACT_OPTIONS}
                value={form.impact}
                onChange={(v) => update("impact", v)}
                error={errors.impact}
              />
            )}
            <Textarea
              label="Description (Optional)"
              name="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Help our team cover tournament entry fees, travel, and meals this season."
              maxLength={DESCRIPTION_MAX}
              rows={3}
              counterInLabel
              error={errors.description}
            />
          </SectionCard>
        </div>
      )}

      {editing ? (
        <WizardFooter
          onBack={back}
          backLabel="Cancel"
          primaryLabel={submitting ? "Saving…" : "Save Changes"}
          onPrimary={handleSave}
          primaryDisabled={!!submitting || !original}
        />
      ) : (
        <WizardFooter
          onBack={back}
          backLabel="Cancel"
          secondaryLabel={submitting === "DRAFT" ? "Saving…" : "Save as Draft"}
          onSecondary={submitting ? undefined : () => void handleCreate("DRAFT")}
          primaryLabel={submitting === "ACTIVE" ? "Creating…" : "Create Campaign"}
          onPrimary={() => void handleCreate("ACTIVE")}
          primaryDisabled={!!submitting}
        />
      )}
    </div>
  );
}
