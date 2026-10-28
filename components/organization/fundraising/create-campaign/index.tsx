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
  tournamentCampaignEditSchema,
  tournamentCampaignSchema,
  DESCRIPTION_MAX,
  NAME_MAX,
  type CampaignImpact,
} from "@/components/organization/fundraising/create-campaign/schema";
import EventSelect from "@/components/organization/event-select";
import { useEventTeams } from "@/components/organization/fundraising/use-event-teams";
import { useOrgTeams } from "@/components/organization/teams/use-org-teams";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { Campaign, CreateCampaignPayload, TournamentTeamRef, UpdateCampaignPayload } from "@/utils/types/campaign";
import { validateAndSetErrors } from "@/utils/validation";

const INITIAL_FORM = {
  name: "",
  teamId: "",
  // Tournament: the team of the event the campaign raises for, picked within a division ("" for
  // every division). Campaigns are per team for now, not per game.
  divisionId: "",
  fanHubTeamId: "",
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
  teamId: c.teamId ?? "",
  divisionId: "",
  fanHubTeamId: c.fanHubTeamId ?? "",
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
    // A tournament campaign's game and team are fixed once created (its teamId stays "").
    ...(form.teamId && form.teamId !== before.teamId && { teamId: form.teamId }),
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
  // Tournament: the team to start the new campaign with (from a team's "Create donation").
  initialTeamId?: string;
}

// Create a campaign (live, or as a draft only the organisation sees), or edit one.
export default function CreateCampaignPage({ campaignId, initialTeamId }: CampaignFormProps) {
  const router = useRouter();
  // A tournament raises on one game of an event (the event shared with the other pages); only a school
  // picks one of its own teams.
  const { org } = useAuth();
  const kind = orgKindOf(org);
  const isTournament = kind === "tournament";
  const { teams } = useOrgTeams(kind === "school");
  const { event, setEvent } = useSelectedEvent();
  // An edited tournament campaign's team, division and event (shown, not changed).
  const [tournamentTeam, setTournamentTeam] = useState<TournamentTeamRef | null>(null);
  const [form, setForm] = useState<Form>(() => ({ ...INITIAL_FORM, fanHubTeamId: initialTeamId ?? "" }));
  const pickingFromEvent = isTournament && !campaignId ? (event?.id ?? "") : "";
  const { teams: eventTeams, loading: teamsLoading } = useEventTeams(pickingFromEvent);
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
      setTournamentTeam(campaign.tournamentTeam ?? null);
      setOriginal(values);
      setForm(values);
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const teamOptions = teams.map((t) => ({ label: `${t.name} · ${t.sport}`, value: t.id }));
  // The event's divisions (from its teams), and the teams of the picked one.
  const divisionOptions = [
    { label: "All divisions", value: "" },
    ...[...new Map(eventTeams.filter((t) => t.division).map((t) => [t.division!.id, t.division!.name ?? "Division"])).entries()].map(
      ([value, label]) => ({ label, value })
    ),
  ];
  const teamPickOptions = eventTeams
    .filter((t) => !form.divisionId || t.division?.id === form.divisionId)
    .map((t) => ({
      label: [t.name, t.division?.name, t.activeCampaignCount ? `${t.activeCampaignCount} active` : null].filter(Boolean).join(" · "),
      value: t.id,
    }));

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const back = () => router.push(routes.ui.fundraising);

  // An ACTIVE creation goes live and notifies the school's followers; a DRAFT stays private.
  const handleCreate = async (status: "DRAFT" | "ACTIVE") => {
    if (!(await validateAndSetErrors(isTournament ? tournamentCampaignSchema : createCampaignSchema, form, setErrors))) return;

    // startDate and impact are UI-only until the backend supports them.
    const payload: CreateCampaignPayload = {
      title: form.name.trim(),
      goalAmount: Number(form.goal),
      endDate: endOfDay(form.endDate),
      // A school raises for one of its teams; a tournament for one team of an event (no game).
      ...(isTournament ? { eventId: event?.id, fanHubTeamId: form.fanHubTeamId } : { teamId: form.teamId }),
      status,
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.sponsorName.trim() && { sponsorName: form.sponsorName.trim() }),
    };

    setSubmitting(status);
    const { success } = await apiCall({
      // A tournament team campaign has its own create endpoint.
      endpoint: isTournament ? routes.api.tournamentCampaigns : routes.api.campaigns,
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
    if (!(await validateAndSetErrors(isTournament ? tournamentCampaignEditSchema : createCampaignSchema, form, setErrors))) return;
    const changes = changesFrom(original, form);
    if (Object.keys(changes).length === 0) return back();

    setSubmitting("SAVE");
    const { success } = await apiCall({
      endpoint: isTournament ? routes.api.tournamentCampaign(campaignId) : routes.api.campaign(campaignId),
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
              placeholder={isTournament ? "Ballhawks game-day fund" : "Twin Lakes Boys Basketball: new uniforms"}
              maxLength={NAME_MAX}
              error={errors.name}
              labelClassName={LABEL}
              inputClassName={FIELD}
            />
            {!isTournament ? (
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
            ) : editing ? (
              // A tournament campaign's team can't change once created.
              <div className="flex flex-col gap-1 text-white">
                <span className="text-sm font-medium">Team</span>
                <span className="text-sm text-white/80">
                  {tournamentTeam
                    ? [tournamentTeam.name, tournamentTeam.division?.name, tournamentTeam.event.name].filter(Boolean).join(" · ")
                    : "—"}
                </span>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white">Event</span>
                  <EventSelect
                    value={event?.id ?? ""}
                    onChange={(id, name) => {
                      setEvent(id ? { id, name } : null);
                      // Teams belong to one event.
                      update("divisionId", "");
                      update("fanHubTeamId", "");
                    }}
                    allowAll={false}
                    selectedName={event?.name}
                  />
                </div>
                <Select
                      label="Division"
                      name="divisionId"
                      value={form.divisionId}
                      onChange={(e) => {
                        update("divisionId", e.target.value);
                        update("fanHubTeamId", "");
                      }}
                      options={divisionOptions}
                      labelClassName={LABEL}
                      selectClassName={FIELD}
                    />
                    <Select
                      label="Team"
                      name="fanHubTeamId"
                      value={form.fanHubTeamId}
                      onChange={(e) => update("fanHubTeamId", e.target.value)}
                      options={teamPickOptions}
                      placeholder={teamsLoading ? "Loading teams…" : teamPickOptions.length ? "Select team" : "No teams in this event"}
                      error={errors.fanHubTeamId}
                      labelClassName={LABEL}
                      selectClassName={FIELD}
                    />
              </>
            )}
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
