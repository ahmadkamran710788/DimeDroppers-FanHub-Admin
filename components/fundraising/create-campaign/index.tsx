"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
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
} from "@/components/fundraising/create-campaign/schema";
import HelpCard from "@/components/fundraising/help-card";
import { TEAMS } from "@/components/teams/data";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { CreateCampaignPayload } from "@/utils/types/campaign";
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

// SAMPLE DATA — no teams list endpoint yet, so the dropdown uses the Teams page's sample
// teams. Their ids are NOT real SchoolTeam ids, so the backend will reject them on create.
// TODO: replace with the school's teams list API once the backend exposes it.
// The head coach is shown because several sample teams share a name.
const TEAM_OPTIONS = TEAMS.filter((t) => t.status === "Active").map((t) => ({
  label: `${t.name} · ${t.headCoach}`,
  value: t.id,
}));

const LABEL = "text-white";
// Design fields are white with a 2px hairline border.
const FIELD = "bg-white border-2 border-[rgba(11,28,45,0.11)]";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleCreate = async () => {
    if (!(await validateAndSetErrors(createCampaignSchema, form, setErrors))) return;

    // startDate and impact are UI-only until the backend supports them.
    const payload: CreateCampaignPayload = {
      title: form.name.trim(),
      goalAmount: Number(form.goal),
      // The campaign runs through the end of the chosen day.
      endDate: `${form.endDate}T23:59:59.000Z`,
      teamId: form.teamId,
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.sponsorName.trim() && { sponsorName: form.sponsorName.trim() }),
    };

    setSubmitting(true);
    const { success } = await apiCall({
      endpoint: routes.api.proxyCreateCampaign,
      method: "POST",
      data: { ...payload },
      showSuccessToast: true,
      successMessage: "Campaign created",
    });
    setSubmitting(false);
    if (success) router.push(routes.ui.fundraising);
  };

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
          Create Campaign
        </h2>
        <p className="text-base leading-[26px]">Set up a new fundraising campaign for your organization.</p>
      </div>

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
            options={TEAM_OPTIONS}
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
          <CheckboxGroup
            label="Your Impact"
            options={IMPACT_OPTIONS}
            value={form.impact}
            onChange={(v) => update("impact", v)}
            error={errors.impact}
          />
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

        <HelpCard onLearnMore={() => toast("Coming soon.")} />
      </div>

      <WizardFooter
        onBack={() => router.push(routes.ui.fundraising)}
        backLabel="Cancel"
        primaryLabel={submitting ? "Creating…" : "Create Campaign"}
        onPrimary={handleCreate}
        primaryDisabled={submitting}
      />
    </div>
  );
}
