"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CreditCard, DollarSign, Lock, Star } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Loader from "@/components/common/loader";
import PageHeading from "@/components/common/page-heading";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import WizardFooter from "@/components/common/wizard-footer";
import GamePicker from "@/components/organization/fundable-needs/game-picker";
import NeedPreview from "@/components/organization/fundable-needs/need-preview";
import {
  COMING_SOON,
  DESCRIPTION_MAX,
  TITLE_MAX,
  WHY_MAX,
  categoryLook,
  eventOptionLabel,
  forLabel,
  gameTime,
  gameTitle,
} from "@/components/organization/fundable-needs/data";
import { FIELD, HINT, LABEL, amountInput } from "@/components/organization/fundable-needs/field-styles";
import { needSchema } from "@/components/organization/fundable-needs/schema";
import { sponsorList, sponsorRequest } from "@/components/sponsor/sponsor-api";
import { centsToInput, dollars, dollarsToCents } from "@/utils/needs";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import type {
  CreateNeedRequest,
  NeedGame,
  NeedOptions,
  NeedTeam,
  OrgNeedDetail,
  OrgNeedListItem,
  UpdateNeedRequest,
} from "@/utils/types/needs";

// What's typed so far. The goal is the dollars as typed; it's sent as cents.
interface Draft {
  categoryCode: string;
  eventId: string;
  teamId: string;
  game: NeedGame | null;
  title: string;
  description: string;
  whyItMatters: string;
  goal: string;
}

const EMPTY: Draft = {
  categoryCode: "",
  eventId: "",
  teamId: "",
  game: null,
  title: "",
  description: "",
  whyItMatters: "",
  goal: "",
};

// The API's field names; a 400 naming one of them is shown under that field (scheduleEventId is the game).
const FIELD_PATHS = ["categoryCode", "eventId", "scheduleEventId", "teamId", "title", "description", "whyItMatters", "goalCents"];

// The form's fields → the error each one clears when it changes.
const ERROR_KEY: Partial<Record<keyof Draft, string>> = { game: "scheduleEventId", goal: "goalCents" };

// A new need starts on the category it was created from when that one is switched on, or on the only one
// that is.
function newDraft(options: NeedOptions, initialCategory?: string): Draft {
  const enabled = options.categories.filter((c) => c.isEnabled);
  const start = enabled.find((c) => c.code === initialCategory) ?? (enabled.length === 1 ? enabled[0] : undefined);
  return { ...EMPTY, categoryCode: start?.code ?? "" };
}

const draftOf = (need: OrgNeedDetail): Draft => ({
  ...EMPTY,
  categoryCode: need.category.code,
  eventId: need.event?.id ?? "",
  teamId: need.team?.id ?? "",
  title: need.title,
  description: need.description,
  whyItMatters: need.whyItMatters ?? "",
  goal: centsToInput(need.money.goalCents),
});

interface Loaded {
  key: number;
  options?: NeedOptions;
  need?: OrgNeedDetail;
  error?: string;
}

interface NeedFormProps {
  // Set to edit that need instead of creating one.
  needId?: string;
  // Create: the category code to start on (from the list's type filter).
  initialCategory?: string;
}

// Create a fundable need (POST /fanhub/org/needs) or edit one (PATCH, while spending is open). A tournament's
// need is for one of its events, a school's for one game; either can name a team. The need ends by itself
// when its event or game is over. The preview beside the form shows it as sponsors will see it.
export default function NeedForm({ needId, initialCategory }: NeedFormProps) {
  const router = useRouter();
  const editing = needId !== undefined;
  // Bumped to load again (Try again, or after a 409 on save).
  const [reloads, setReloads] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<{ key: string; items?: NeedTeam[]; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      sponsorRequest<NeedOptions>("GET", routes.api.orgNeedOptions),
      needId ? sponsorRequest<OrgNeedDetail>("GET", routes.api.orgNeed(needId)) : Promise.resolve(null),
    ]).then(([o, n]) => {
      if (cancelled) return;
      const error = !o.view ? o.message : n && !n.view ? n.message : undefined;
      setLoaded({ key: reloads, options: o.view, need: n?.view, error: error ?? undefined });
    });
    return () => {
      cancelled = true;
    };
  }, [needId, reloads]);

  const current = loaded?.key === reloads ? loaded : null;
  const options = current?.options;
  const need = current?.need;
  // The draft starts once everything it needs has loaded (again after a reload).
  if (!draft && options && !current?.error && (!editing || need)) {
    setDraft(editing && need ? draftOf(need) : newDraft(options, initialCategory));
  }

  const scope = need?.scope ?? options?.scope;
  // Creating: a tournament's teams follow the chosen event; a school's are its own.
  const teamsKey =
    !draft || editing || !scope ? null : scope === "EVENT" ? (draft.eventId ? `event:${draft.eventId}` : null) : "school";
  useEffect(() => {
    if (!teamsKey) return;
    let cancelled = false;
    const eventId = teamsKey.startsWith("event:") ? teamsKey.slice("event:".length) : undefined;
    sponsorList<NeedTeam>(routes.api.orgNeedTeams, { eventId }).then((r) => {
      if (!cancelled) setTeams({ key: teamsKey, items: r.items, error: r.items ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [teamsKey]);
  const currentTeams = teamsKey && teams?.key === teamsKey ? teams : null;

  const back = () => router.push(routes.ui.fundableNeeds);
  // Editing a need whose event or game is over: shown, but nothing can change.
  const readOnly = editing && !!need && !need.spendingOpen;

  const update = (patch: Partial<Draft>) => {
    setDraft((prev) => prev && { ...prev, ...patch });
    const keys = (Object.keys(patch) as (keyof Draft)[]).map((k) => ERROR_KEY[k] ?? k);
    if (keys.some((k) => errors[k])) setErrors((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, ""])) }));
  };

  async function save() {
    if (!draft || !options || saving || readOnly) return;
    const goalCents = dollarsToCents(draft.goal);
    const schema = needSchema({
      scope: scope ?? options.scope,
      editing,
      goalMinCents: options.limits.goalCentsMin,
      goalMaxCents: options.limits.goalCentsMax,
      raisedCents: need?.money.raisedCents,
    });
    const values = {
      categoryCode: draft.categoryCode,
      eventId: draft.eventId,
      scheduleEventId: draft.game?.id ?? "",
      title: draft.title,
      description: draft.description,
      whyItMatters: draft.whyItMatters,
      goalCents,
    };
    if (!(await validateAndSetErrors(schema, values, setErrors))) return;

    const title = draft.title.trim();
    const description = draft.description.trim();
    const why = draft.whyItMatters.trim();
    let request: Promise<{ status: number; view?: OrgNeedListItem; message?: string; errors?: { path: string; message: string }[] }>;
    if (editing && need) {
      // Only what changed; an emptied "why it matters" clears it.
      const body: UpdateNeedRequest = {};
      if (title !== need.title) body.title = title;
      if (description !== need.description) body.description = description;
      if (why !== (need.whyItMatters ?? "")) body.whyItMatters = why || null;
      if (goalCents !== need.money.goalCents) body.goalCents = goalCents;
      if (Object.keys(body).length === 0) {
        toast("No changes to save.");
        return;
      }
      request = sponsorRequest<OrgNeedListItem>("PATCH", routes.api.orgNeed(need.id), { body });
    } else {
      const body: CreateNeedRequest = {
        categoryCode: draft.categoryCode,
        ...(options.scope === "EVENT" ? { eventId: draft.eventId } : { scheduleEventId: draft.game?.id ?? "" }),
        teamId: draft.teamId || null,
        title,
        description,
        ...(why && { whyItMatters: why }),
        goalCents,
      };
      request = sponsorRequest<OrgNeedListItem>("POST", routes.api.orgNeeds, { body });
    }

    setSaving(true);
    const r = await request;
    setSaving(false);
    if (r.view) {
      toast.success(editing ? `Saved changes to “${title}”.` : `Need published: “${title}”. Sponsors can fund it now.`);
      back();
      return;
    }
    const fieldErrors = Object.fromEntries(
      (r.errors ?? []).filter((e) => FIELD_PATHS.includes(e.path)).map((e) => [e.path, e.message])
    );
    if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
    toast.error(r.message ?? "Couldn't save the need, please try again.");
    // 409: it can't be changed any more (its event or game is over); show it as it is now.
    if (editing && r.status === 409) {
      setDraft(null);
      setReloads((n) => n + 1);
    }
  }

  const category = options?.categories.find((c) => c.code === draft?.categoryCode);
  const event = options?.events.find((e) => e.id === draft?.eventId);
  const goalCents = draft ? dollarsToCents(draft.goal) : NaN;
  const raised = need?.money.raisedCents ?? 0;
  const teamName = editing ? need?.team?.name : currentTeams?.items?.find((t) => t.id === draft?.teamId)?.name;
  const forText =
    editing && need
      ? forLabel(need)
      : scope === "EVENT"
        ? [teamName ?? (event ? "Whole event" : ""), event?.name ?? ""].filter(Boolean).join(" · ")
        : [teamName, draft?.game ? `${gameTitle(draft.game)} · ${gameTime(draft.game.utcTime)}` : ""].filter(Boolean).join(" · ");
  const teamOptions = (noTeamLabel: string) => [
    { label: noTeamLabel, value: "" },
    ...(currentTeams?.items ?? []).map((t) => ({ label: t.name, value: t.id })),
  ];

  return (
    <div className="flex flex-col gap-10 pb-24">
      <Link
        href={routes.ui.fundableNeeds}
        className="self-start flex items-center gap-3 text-base leading-6 font-medium text-white hover:opacity-80 transition-opacity"
      >
        <ArrowLeft className="size-6" strokeWidth={1.5} />
        Back to Fundable Needs
      </Link>

      <PageHeading
        title={editing ? "Edit need" : "Create a fundable need"}
        description={
          editing
            ? "Change the name, what it covers, why it matters or the goal. Who it's for and its type stay as published."
            : "Tell sponsors what you need funded. It ends by itself when its event or game is over."
        }
      />

      {!current ? (
        <Loader className="py-16" />
      ) : current.error || !draft || !options ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-white/60">
            {current.error ? `Couldn't load the form: ${current.error}` : "This need could not be found."}
          </p>
          <Button variant="outline" label="Try again" onClick={() => setReloads((n) => n + 1)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,639fr)_minmax(0,445fr)] gap-6 lg:gap-10 items-start">
          <div className="flex min-w-0 flex-col gap-6">
            {readOnly && (
              <p
                role="status"
                className="flex items-center gap-3 rounded-[8px] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                <Lock className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                This need can no longer be changed: its event or game is over.
              </p>
            )}

            <SectionCard title="Who is this need for?">
              {editing && need ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Select
                    label={need.scope === "EVENT" ? "Event" : "Game"}
                    name="target"
                    value="target"
                    onChange={() => {}}
                    options={[
                      {
                        label: need.event
                          ? need.event.name || "Event"
                          : need.game
                            ? `${gameTitle(need.game)} · ${gameTime(need.game.utcTime)}`
                            : "—",
                        value: "target",
                      },
                    ]}
                    disabled
                    labelClassName={LABEL}
                    selectClassName={FIELD}
                  />
                  <Select
                    label="Team"
                    name="team"
                    value="team"
                    onChange={() => {}}
                    options={[{ label: need.team?.name ?? "No specific team", value: "team" }]}
                    disabled
                    labelClassName={LABEL}
                    selectClassName={FIELD}
                  />
                  <p className={`${HINT} sm:col-span-2`}>Who a need is for can&apos;t change after it&apos;s published.</p>
                </div>
              ) : scope === "EVENT" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Select
                      label="Event"
                      name="eventId"
                      required
                      value={draft.eventId}
                      onChange={(e) => update({ eventId: e.target.value, teamId: "" })}
                      options={options.events.map((ev) => ({ label: eventOptionLabel(ev), value: ev.id }))}
                      placeholder={options.events.length ? "Choose an event" : "No upcoming events"}
                      disabled={options.events.length === 0}
                      error={errors.eventId}
                      labelClassName={LABEL}
                      selectClassName={FIELD}
                    />
                    {options.events.length === 0 && (
                      <p className={HINT}>Only events that haven&apos;t ended can have a need.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Select
                      label="Team (optional)"
                      name="teamId"
                      value={draft.teamId}
                      onChange={(e) => update({ teamId: e.target.value })}
                      options={draft.eventId && currentTeams?.items ? teamOptions("No specific team (whole event)") : []}
                      placeholder={!draft.eventId ? "Choose an event first" : "Loading teams…"}
                      disabled={!draft.eventId || !currentTeams?.items}
                      error={errors.teamId}
                      labelClassName={LABEL}
                      selectClassName={FIELD}
                    />
                    {!errors.teamId && (
                      <p className={HINT}>
                        {!draft.eventId
                          ? "Teams load after you pick an event."
                          : currentTeams?.items
                            ? `${currentTeams.items.length} teams registered for this event`
                            : currentTeams?.error
                              ? `Couldn't load the teams: ${currentTeams.error}`
                              : "Loading teams…"}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <Select
                      label="Team (optional)"
                      name="teamId"
                      value={draft.teamId}
                      onChange={(e) => update({ teamId: e.target.value, game: null })}
                      options={currentTeams?.items ? teamOptions("All teams") : []}
                      placeholder="Loading teams…"
                      disabled={!currentTeams?.items}
                      error={errors.teamId}
                      labelClassName={LABEL}
                      selectClassName={FIELD}
                    />
                    {!errors.teamId && (
                      <p className={HINT}>
                        {currentTeams?.error
                          ? `Couldn't load your teams: ${currentTeams.error}`
                          : "Pick a team to name it on the need and see only its games."}
                      </p>
                    )}
                  </div>
                  <GamePicker
                    value={draft.game}
                    onChange={(game) => update({ game })}
                    teamId={draft.teamId}
                    error={errors.scheduleEventId}
                  />
                </div>
              )}
            </SectionCard>

            <SectionCard title="About the need">
              <div className="flex flex-col gap-2">
                <Select
                  label="What kind of need is this?"
                  name="categoryCode"
                  required
                  value={draft.categoryCode}
                  onChange={(e) => update({ categoryCode: e.target.value })}
                  // Only the types switched on; when editing, the need's own type too (the field is locked
                  // then, and it may have been switched off since).
                  options={options.categories
                    .filter((c) => c.isEnabled || c.code === draft.categoryCode)
                    .map((c) => ({ label: c.name, value: c.code }))}
                  placeholder="Choose a type"
                  disabled={editing}
                  error={errors.categoryCode}
                  labelClassName={LABEL}
                  selectClassName={FIELD}
                />
                {!errors.categoryCode && (
                  <p className={HINT}>
                    {(category && categoryLook(category.name).description) || "Sponsors browse needs by type."}
                  </p>
                )}
              </div>
              <Input
                label="Name of the need"
                name="title"
                required
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. Bus and hotel for the 17U Boys at Nationals"
                maxLength={TITLE_MAX}
                disabled={readOnly}
                error={errors.title}
                labelClassName={LABEL}
                inputClassName={FIELD}
              />
              <Input
                label="Goal amount"
                name="goalCents"
                required
                value={draft.goal}
                onChange={(e) => {
                  const next = amountInput(e.target.value);
                  if (next !== null) update({ goal: next });
                }}
                placeholder="e.g. 1500"
                icon={<DollarSign className="h-5 w-5" />}
                inputMode="decimal"
                disabled={readOnly}
                error={errors.goalCents}
                hint={
                  raised > options.limits.goalCentsMin
                    ? `At least the ${dollars(raised)} already raised, up to ${dollars(options.limits.goalCentsMax)}.`
                    : `Between ${dollars(options.limits.goalCentsMin)} and ${dollars(options.limits.goalCentsMax)}. Sponsors can fund it until it's reached.`
                }
                labelClassName={LABEL}
                inputClassName={FIELD}
              />
              <Textarea
                label="What does this cover?"
                name="description"
                required
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="List exactly what the money pays for, e.g. charter bus round trip and two hotel nights for 12 players and 3 coaches"
                maxLength={DESCRIPTION_MAX}
                rows={3}
                counterInLabel
                disabled={readOnly}
                error={errors.description}
              />
              <Textarea
                label="Why it matters (optional)"
                name="whyItMatters"
                value={draft.whyItMatters}
                onChange={(e) => update({ whyItMatters: e.target.value })}
                placeholder="A sentence or two on the impact for players and families"
                maxLength={WHY_MAX}
                rows={3}
                counterInLabel
                disabled={readOnly}
                error={errors.whyItMatters}
              />
            </SectionCard>

            <SectionCard title="Virtual card for this need">
              <p className="flex items-start gap-3 text-sm leading-[1.5] text-white/80">
                <CreditCard className="size-5 shrink-0 text-[#638BFE]" strokeWidth={1.8} aria-hidden="true" />
                {`Sponsor money for this need loads onto your Stripe virtual card for ${category ? category.name.toLowerCase() : "this kind of need"}: one card per kind of need, reused for your next one after this need ends. It only works at the merchant categories below; other purchases are declined.`}
              </p>
              <div className="flex flex-col gap-3">
                <span className="text-base font-medium text-white">
                  {`Allowed merchant categories${category ? ` · ${category.allowedCategories.length}` : ""}`}
                </span>
                {category ? (
                  <ul className="flex flex-wrap gap-2">
                    {category.allowedCategories.map((mc) => (
                      <li
                        key={mc.stripeCategory}
                        className="flex min-w-0 flex-col gap-0.5 rounded-[8px] border border-[#638BFE]/60 bg-[#638BFE]/10 px-3 py-2"
                      >
                        <span className="text-sm font-medium text-white">{mc.label}</span>
                        <span className="font-mono text-[11px] text-white/60">{mc.mcc ? `MCC ${mc.mcc}` : mc.stripeCategory}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={HINT}>Choose a type of need first to see where the card works.</p>
                )}
                {category && (
                  <p className={HINT}>{`Set for this kind of need. Choosing your own categories: ${COMING_SOON.toLowerCase()}.`}</p>
                )}
              </div>
              <Input
                label="Lock to one merchant (optional)"
                name="merchant"
                value=""
                onChange={() => {}}
                placeholder="e.g. Coastal Charter Bus Co."
                disabled
                hint={COMING_SOON}
                labelClassName={LABEL}
                inputClassName={FIELD}
              />
            </SectionCard>

            <SectionCard title="What the sponsor gets in return">
              <div className="flex items-center gap-3 rounded-[8px] border border-white/15 bg-white/5 px-4 py-3 opacity-80">
                <Star className="size-5 shrink-0 text-success" strokeWidth={1.8} aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                    Instant spot on your Recognition &amp; Fan Wall
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                      {COMING_SOON}
                    </span>
                  </span>
                  <span className="text-[13px] leading-[1.5] text-white/75">
                    The moment a sponsor funds this need, they&apos;ll be shown on your Fan Wall. This is the only sponsor
                    benefit for fundable needs.
                  </span>
                </span>
              </div>
            </SectionCard>
          </div>

          <NeedPreview
            data={{
              categoryName: category?.name ?? "",
              forText,
              title: draft.title,
              description: draft.description,
              whyItMatters: draft.whyItMatters,
              goal: Number.isFinite(goalCents) && goalCents > 0 ? dollars(goalCents) : "",
              allowedCategories: category?.allowedCategories ?? [],
            }}
          />
        </div>
      )}

      <WizardFooter
        onBack={back}
        backLabel="Cancel"
        primaryLabel={saving ? "Saving…" : editing ? "Save changes" : "Publish need"}
        onPrimary={() => void save()}
        primaryDisabled={!draft || saving || readOnly}
      />
    </div>
  );
}
