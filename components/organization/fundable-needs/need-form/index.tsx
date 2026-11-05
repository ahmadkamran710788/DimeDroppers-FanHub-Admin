"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CreditCard, Star } from "lucide-react";
import FilterChips from "@/components/common/filter-chips";
import Input from "@/components/common/input";
import PageHeading from "@/components/common/page-heading";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import WizardFooter from "@/components/common/wizard-footer";
import NeedPreview from "@/components/organization/fundable-needs/need-preview";
import {
  MCC_CATEGORIES,
  MOCK_EVENTS,
  NEED_TYPES,
  NEED_TYPE_OPTIONS,
  TYPE_MCC,
  mccLabel,
} from "@/components/organization/fundable-needs/data";
import { FIELD, HINT, LABEL } from "@/components/organization/fundable-needs/field-styles";
import { COVERS_MAX, TITLE_MAX, WHY_MAX, needSchema } from "@/components/organization/fundable-needs/schema";
import { useFundableNeeds } from "@/context/fundable-needs";
import { toOptions } from "@/utils/helper";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import type { FundableNeed, NeedDraft, NeedType } from "@/utils/types/fundable-need";

const EMPTY: NeedDraft = { event: "", team: "", type: "", title: "", covers: "", why: "", mccs: [], merchant: "" };

const EVENT_OPTIONS = MOCK_EVENTS.map((e) => ({ label: `${e.name} · ${e.dates}`, value: e.name }));

const isNeedType = (value?: string): value is NeedType => NEED_TYPES.some((t) => t.name === value);

// A new need starts with the type it was created from (if any) and that type's first two categories.
const newDraft = (type?: string): NeedDraft =>
  isNeedType(type) ? { ...EMPTY, type, mccs: TYPE_MCC[type].slice(0, 2) } : EMPTY;

const draftOf = (n: FundableNeed): NeedDraft => ({
  event: n.event,
  team: n.team,
  type: n.type,
  title: n.title,
  covers: n.covers,
  why: n.why,
  mccs: n.mccs,
  merchant: n.merchant,
});

interface NeedFormProps {
  // Set to edit that need instead of creating one.
  needId?: string;
  // Create: the type to start on (from the list's type filter).
  initialType?: string;
}

// Create a fundable need (publishing it issues its virtual card) or edit one. The preview beside the
// form shows the need as sponsors will see it.
export default function NeedForm({ needId, initialType }: NeedFormProps) {
  const router = useRouter();
  const { needs, ready, saveNeed } = useFundableNeeds();
  const editing = needId !== undefined;
  const original = editing ? needs.find((n) => n.id === needId) : undefined;
  // Editing: filled from the need once it's found (one saved in this browser arrives after hydration).
  const [draft, setDraft] = useState<NeedDraft | null>(editing ? null : newDraft(initialType));
  if (draft === null && original) setDraft(draftOf(original));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const back = () => router.push(routes.ui.fundableNeeds);

  const clearError = (...keys: string[]) => {
    if (keys.some((k) => errors[k])) setErrors((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, ""])) }));
  };

  const update = (patch: Partial<NeedDraft>) => {
    setDraft((prev) => prev && { ...prev, ...patch });
    clearError(...Object.keys(patch));
  };

  async function save() {
    if (!draft || !(await validateAndSetErrors(needSchema, draft, setErrors)) || !draft.type) return;
    const title = draft.title.trim();
    saveNeed(
      {
        type: draft.type,
        title,
        covers: draft.covers.trim(),
        why: draft.why.trim(),
        event: draft.event,
        team: draft.team,
        mccs: draft.mccs,
        merchant: draft.merchant.trim(),
      },
      needId
    );
    toast.success(editing ? `Saved changes to “${title}”.` : `Need created: “${title}”. The Sponsor AI Agent can now pitch it.`);
    back();
  }

  const event = draft ? MOCK_EVENTS.find((e) => e.name === draft.event) : undefined;
  const teamOptions = event ? [{ label: "No specific team (whole event)", value: "" }, ...toOptions(event.teams)] : [];
  const typeInfo = draft?.type ? NEED_TYPES.find((t) => t.name === draft.type) : undefined;

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
            ? "Update what this need is for and where its card can be used. Its funding and card stay as they are."
            : "Tell sponsors what you need funded. Publishing it issues the need its own virtual card."
        }
      />

      {!draft ? (
        <p className="py-16 text-center text-sm text-white/60">{ready ? "This need could not be found." : "Loading need…"}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,639fr)_minmax(0,445fr)] gap-6 lg:gap-10 items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <SectionCard title="Who is this need for?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select
                  label="Event"
                  name="event"
                  required
                  value={draft.event}
                  onChange={(e) => {
                    const next = MOCK_EVENTS.find((x) => x.name === e.target.value);
                    // A team belongs to one event: keep it only if it plays in the new one.
                    update({ event: e.target.value, team: next?.teams.includes(draft.team) ? draft.team : "" });
                  }}
                  options={EVENT_OPTIONS}
                  placeholder="Choose an event"
                  error={errors.event}
                  labelClassName={LABEL}
                  selectClassName={FIELD}
                />
                <div className="flex flex-col gap-2">
                  <Select
                    label="Team (optional)"
                    name="team"
                    value={draft.team}
                    onChange={(e) => update({ team: e.target.value })}
                    options={teamOptions}
                    placeholder="Choose an event first"
                    disabled={!event}
                    labelClassName={LABEL}
                    selectClassName={FIELD}
                  />
                  <p className={HINT}>
                    {event ? `${event.teams.length} teams registered for this event` : "Teams load after you pick an event."}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="About the need">
              <div className="flex flex-col gap-2">
                <Select
                  label="What kind of need is this?"
                  name="type"
                  required
                  value={draft.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    if (!isNeedType(type)) return;
                    // Keep the categories that still apply; otherwise start on the new type's first two.
                    const kept = draft.mccs.filter((slug) => TYPE_MCC[type].includes(slug));
                    update({ type, mccs: kept.length ? kept : TYPE_MCC[type].slice(0, 2) });
                  }}
                  options={NEED_TYPE_OPTIONS}
                  placeholder="Choose a type"
                  error={errors.type}
                  labelClassName={LABEL}
                  selectClassName={FIELD}
                />
                {!errors.type && <p className={HINT}>{typeInfo?.description ?? "Sponsors browse needs by type."}</p>}
              </div>
              <Input
                label="Name of the need"
                name="title"
                required
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. Bus and hotel for the 17U Boys at Nationals"
                maxLength={TITLE_MAX}
                error={errors.title}
                labelClassName={LABEL}
                inputClassName={FIELD}
              />
              <Textarea
                label="What does this cover?"
                name="covers"
                required
                value={draft.covers}
                onChange={(e) => update({ covers: e.target.value })}
                placeholder="List exactly what the money pays for, e.g. charter bus round trip and two hotel nights for 12 players and 3 coaches"
                maxLength={COVERS_MAX}
                rows={3}
                counterInLabel
                error={errors.covers}
              />
              <Textarea
                label="Why it matters (optional)"
                name="why"
                value={draft.why}
                onChange={(e) => update({ why: e.target.value })}
                placeholder="A sentence or two on the impact for players and families"
                maxLength={WHY_MAX}
                rows={3}
                counterInLabel
                error={errors.why}
              />
            </SectionCard>

            <SectionCard title="Virtual card for this need">
              <p className="flex items-start gap-3 text-sm leading-[1.5] text-white/80">
                <CreditCard className="size-5 shrink-0 text-[#638BFE]" strokeWidth={1.8} aria-hidden="true" />
                Publishing this need creates its own Stripe virtual card. Sponsor money loads onto it as it comes in, and it
                can only be used in the merchant categories you allow below.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-medium text-white">
                    Allowed merchant categories<span className="text-error"> *</span>
                  </span>
                  <span className="text-xs text-white/60">{`${draft.mccs.length} selected`}</span>
                </div>
                {draft.type ? (
                  <FilterChips
                    multiple
                    ariaLabel="Allowed merchant categories"
                    options={TYPE_MCC[draft.type].map((slug) => ({
                      value: slug,
                      label: `${mccLabel(slug)} · MCC ${MCC_CATEGORIES[slug].code}`,
                    }))}
                    value={draft.mccs}
                    onChange={(mccs) => update({ mccs })}
                  />
                ) : (
                  <p className={HINT}>Choose a type of need first to see matching categories.</p>
                )}
                {errors.mccs && <p className="text-sm text-error">{errors.mccs}</p>}
              </div>
              <Input
                label="Lock to one merchant (optional)"
                name="merchant"
                value={draft.merchant}
                onChange={(e) => update({ merchant: e.target.value })}
                placeholder="e.g. Coastal Charter Bus Co."
                hint="Leave empty to allow any merchant in these categories. Purchases outside them are declined."
                labelClassName={LABEL}
                inputClassName={FIELD}
              />
            </SectionCard>

            <SectionCard title="What the sponsor gets in return">
              <div className="flex items-center gap-3 rounded-[8px] border border-success/40 bg-success/10 px-4 py-3">
                <Star className="size-5 shrink-0 text-success" strokeWidth={1.8} aria-hidden="true" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">Instant spot on your Recognition &amp; Fan Wall</span>
                  <span className="text-[13px] leading-[1.5] text-white/75">
                    The moment a sponsor funds this need, they’re shown on your Fan Wall. This is the only sponsor benefit for
                    fundable needs.
                  </span>
                </span>
              </div>
            </SectionCard>
          </div>

          <NeedPreview draft={draft} />
        </div>
      )}

      <WizardFooter
        onBack={back}
        backLabel="Cancel"
        primaryLabel={editing ? "Save changes" : "Publish need"}
        onPrimary={() => void save()}
        primaryDisabled={!draft}
      />
    </div>
  );
}
