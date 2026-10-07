"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Mars } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/common/input";
import SectionCard from "@/components/common/section-card";
import Select from "@/components/common/select";
import WizardFooter from "@/components/common/wizard-footer";
import AthletesTab from "@/components/teams/add-team/athletes-tab";
import { addTeamSchema } from "@/components/teams/add-team/schema";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";
import { GENDER_OPTIONS, LEVEL_OPTIONS, SPORTS_OPTIONS } from "@/utils/constants/schedule";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

const TABS = ["Team Info", "Staff", "Athletes", "Settings"] as const;
type Tab = (typeof TABS)[number];

// Teams can be middle-school grades too, so extend the schedule levels.
const TEAM_LEVEL_OPTIONS = [
  { label: "6th Grade", value: "6th Grade" },
  { label: "7th Grade", value: "7th Grade" },
  { label: "8th Grade", value: "8th Grade" },
  ...LEVEL_OPTIONS,
];

const INITIAL_FORM = {
  teamName: "",
  nickname: "",
  level: "",
  sport: "",
  gender: "",
};
type Form = typeof INITIAL_FORM;

const LABEL = "text-white text-sm font-medium";

export default function AddTeamPage() {
  const router = useRouter();
  const { savedSchool } = useSetup();
  const [tab, setTab] = useState<Tab>("Team Info");
  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set =
    (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    };

  const handleSaveContinue = async () => {
    if (tab !== "Team Info") {
      toast("Coming soon.");
      return;
    }
    if (!(await validateAndSetErrors(addTeamSchema, form, setErrors))) return;
    // No teams create endpoint yet — the form validates and moves on to the Staff step.
    toast.success("Team info saved.");
    setTab("Staff");
  };

  const summaryTitle = savedSchool?.name || form.teamName || "Your Team";
  const crest = savedSchool?.logoUrl || "/images/preview-crest.png";

  return (
    <div className="flex flex-col gap-10 pb-24">
      {/* Title */}
      <div className="flex flex-col gap-4">
        <Link
          href={routes.ui.teams}
          className="self-start flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
            Add Team
          </h2>
          <p className="text-base text-white/80">
            Create a new team and add team details, assign staff, and configure team settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,638fr)_minmax(0,446fr)] gap-6 lg:gap-10 items-start">
        {/* Form column */}
        <div className="flex flex-col gap-6">
          <SectionCard>
            {/* Tabs */}
            <div role="tablist" className="flex items-end gap-2 border-b border-border-divider">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "relative px-4 pb-3 text-sm font-medium transition-colors",
                    tab === t ? "text-white" : "text-white/70 hover:text-white"
                  )}
                >
                  {t}
                  {tab === t && (
                    <span
                      className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full"
                      style={{ background: "var(--gradient-cta)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {tab === "Team Info" ? (
              <div className="flex flex-col gap-6">
                <h3 className="font-display font-black text-xl lg:text-2xl uppercase text-white leading-tight">
                  Basic Information
                </h3>
                <Input label="Team Name" name="teamName" value={form.teamName} onChange={set("teamName")} placeholder="Twin Lakes Boys Basketball" error={errors.teamName} labelClassName={LABEL} />
                <Input label="Nickname (Optional)" name="nickname" value={form.nickname} onChange={set("nickname")} placeholder="TLAM" error={errors.nickname} labelClassName={LABEL} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Select label="Level" name="level" value={form.level} onChange={set("level")} options={TEAM_LEVEL_OPTIONS} placeholder="Select level" error={errors.level} labelClassName={LABEL} />
                  <Select label="Sport" name="sport" value={form.sport} onChange={set("sport")} options={SPORTS_OPTIONS} placeholder="Select sport" icon={<Image src="/icons/icon-dribbble.svg" alt="" width={20} height={20} className="w-5 h-5 invert" />} error={errors.sport} labelClassName={LABEL} />
                  <Select label="Gender" name="gender" value={form.gender} onChange={set("gender")} options={GENDER_OPTIONS} placeholder="Select gender" icon={<Mars className="w-5 h-5" />} error={errors.gender} labelClassName={LABEL} />
                </div>
              </div>
            ) : tab === "Athletes" ? (
              <AthletesTab />
            ) : (
              <p className="py-12 text-center text-sm text-white/60">{tab} — coming soon.</p>
            )}
          </SectionCard>

        </div>

        {/* Summary */}
        <SectionCard>
          <h3 className="font-display font-black text-xl lg:text-2xl uppercase text-white leading-tight">
            Summary
          </h3>
          <div className="relative overflow-hidden rounded-[8px] min-h-[184px] p-4 flex flex-col justify-between gap-6 bg-teal">
            <Image
              src="/images/preview-hero.png"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover opacity-30 mix-blend-luminosity"
            />
            <Image
              src={crest}
              alt=""
              width={64}
              height={64}
              // The school logo may be an uploaded remote URL with no configured image host.
              unoptimized={crest.startsWith("http")}
              className="relative size-16 rounded-full object-cover bg-black/40 border-2 border-white/60"
            />
            <p className="relative font-display font-black text-[32px] lg:text-[40px] uppercase text-white leading-[1.05]">
              {summaryTitle}
            </p>
            <div className="relative flex items-center gap-2 pt-3 border-t border-white/20 text-xs text-white">
              <Image src="/icons/icon-dribbble.svg" alt="" width={16} height={16} />
              {form.sport || "Sport"}
            </div>
          </div>
          <div className="h-px bg-border-divider" />
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Info className="w-4 h-4" />
              Information
            </span>
            <span className="pl-6 text-xs text-white/60">
              You can edit all team information after the team is created.
            </span>
          </div>
        </SectionCard>
      </div>

      <WizardFooter
        onBack={() => router.push(routes.ui.teams)}
        backLabel="Cancel"
        primaryLabel="Save & Continue"
        onPrimary={handleSaveContinue}
      />
    </div>
  );
}
