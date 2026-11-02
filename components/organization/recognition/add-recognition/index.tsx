"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import toast from "react-hot-toast";
import StepIndicator from "@/components/common/step-indicator";
import WizardFooter from "@/components/common/wizard-footer";
import type { MediaGame } from "@/components/organization/media/data";
import CustomizeStep, { type CustomizeForm } from "@/components/organization/recognition/add-recognition/customize-step";
import { customizeRecognitionSchema } from "@/components/organization/recognition/add-recognition/schema";
import TemplateStep, { type TemplateKind } from "@/components/organization/recognition/add-recognition/template-step";
import { useGamePeople } from "@/components/organization/recognition/add-recognition/use-game-people";
import WhoStep, { type Audience } from "@/components/organization/recognition/add-recognition/who-step";
import DonorCard, { SAMPLE_DONOR, type DonorTemplate } from "@/components/organization/recognition/donor-card";
import PlayerCard, { SAMPLE_PLAYER, type PlayerTemplate } from "@/components/organization/recognition/player-card";
import RecognitionPreview from "@/components/organization/recognition/recognition-preview";
import type { RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

const STEPS = ["who", "template", "details"] as const;
type Step = (typeof STEPS)[number];

const INITIAL_FORM: CustomizeForm = {
  playerId: "",
  message: "",
  giverId: "",
};

// Add Recognition wizard: pick who to recognize, then one of the six templates (donor and player),
// then write the details with a live preview.
export default function AddRecognitionPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("who");
  const [audience, setAudience] = useState<Audience | "">("");
  const [audienceError, setAudienceError] = useState("");
  // The award badge, picked in Details.
  const [badge, setBadge] = useState<RecognitionTemplate>("Hustle");
  const [donorTemplate, setDonorTemplate] = useState<DonorTemplate>("Profile & Campaign");
  const [playerTemplate, setPlayerTemplate] = useState<PlayerTemplate>("Profile & Game");
  // Every template is offered whoever is recognized (for now); this is the group the picked one is from.
  const [kind, setKind] = useState<TemplateKind>("donor");
  const isDonor = kind === "donor";
  // The Game step is out of the flow for now, so Details has no game (and no players or givers) yet.
  const game = null as MediaGame | null;
  const [form, setForm] = useState<CustomizeForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { players, givers, loading: peopleLoading } = useGamePeople(game);

  // Recognized By starts on the first staff member / parent until the admin picks someone.
  const giverIdOf = (id: string) => (givers.some((p) => p.id === id) ? id : (givers[0]?.id ?? ""));
  const shown = { ...form, giverId: giverIdOf(form.giverId) };
  const teamOf = (giverId: string) => givers.find((p) => p.id === giverId)?.teamKey;

  const update = <K extends keyof CustomizeForm>(key: K, value: CustomizeForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      // A giver only shouts out their own team's players: another team's giver clears the player.
      ...(key === "giverId" && teamOf(value as string) !== teamOf(giverIdOf(prev.giverId)) && { playerId: "" }),
    }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const giver = givers.find((p) => p.id === shown.giverId);
  // The players of the giver's team; none until a giver is chosen.
  const teamPlayers = giver ? players.filter((p) => p.teamKey === giver.teamKey) : [];

  const index = STEPS.indexOf(step);
  const steps = [
    { title: "Recognize", subtitle: index > 0 && audience ? audience : "Choose who" },
    { title: "Template", subtitle: index > 1 ? (isDonor ? donorTemplate : playerTemplate) : "Choose template" },
    { title: "Details", subtitle: "Write shout-out" },
  ];

  const next = () => {
    if (step === "who") {
      if (!audience) return setAudienceError("Choose who you want to recognize");
      return setStep("template");
    }
    setStep("details");
  };

  const publish = async () => {
    if (!(await validateAndSetErrors(customizeRecognitionSchema, shown, setErrors))) return;
    // No recognitions endpoint yet — wire the create call here once the backend exposes it.
    toast("Publishing recognitions is coming soon.");
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="flex items-start gap-4">
        <Link href={routes.ui.recognitionPosts} aria-label="Back to Recognitions" className="mt-0.5 text-white hover:opacity-80">
          <ArrowLeft className="size-6" strokeWidth={1.5} />
        </Link>
        <div className="flex flex-col gap-1 text-white">
          <Link href={routes.ui.recognitionPosts} className="text-sm text-white/75 hover:text-white">
            Back to Recognitions
          </Link>
          <h2 className="text-[28px] lg:text-[32px] font-bold leading-tight">Add Recognition</h2>
          <p className="text-base text-white/85">Give a shout-out to a player, coach or the whole team for one of your games.</p>
        </div>
      </div>

      <StepIndicator steps={steps} current={index} className="pb-6 border-b border-white/10" />

      {step === "who" ? (
        <WhoStep
          audience={audience}
          onAudience={(a) => {
            setAudience(a);
            setAudienceError("");
          }}
          error={audienceError}
        />
      ) : step === "template" ? (
        <TemplateStep
          kind={kind}
          onKind={setKind}
          donorTemplate={donorTemplate}
          onDonorTemplate={setDonorTemplate}
          playerTemplate={playerTemplate}
          onPlayerTemplate={setPlayerTemplate}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-8 items-start">
          <CustomizeStep
            badge={badge}
            onBadge={setBadge}
            players={teamPlayers}
            giverChosen={!!giver}
            givers={givers}
            peopleLoading={peopleLoading}
            form={shown}
            errors={errors}
            update={update}
          />
          <div className="xl:sticky xl:top-6">
            <RecognitionPreview
              recognition={null}
              card={
                isDonor ? (
                  <DonorCard template={donorTemplate} data={SAMPLE_DONOR} />
                ) : (
                  <PlayerCard template={playerTemplate} data={SAMPLE_PLAYER} />
                )
              }
              description="This is how it will appear on the fan app."
            />
          </div>
        </div>
      )}

      {step === "details" ? (
        <WizardFooter
          onBack={() => setStep("template")}
          backLabel="Back"
          secondaryLabel="Save Draft"
          onSecondary={() => toast("Saving drafts is coming soon.")}
          primaryLabel="Publish Recognition"
          primaryIcon={<Send className="size-5" strokeWidth={2} />}
          onPrimary={publish}
        />
      ) : (
        <WizardFooter
          onBack={step === "who" ? () => router.push(routes.ui.recognitionPosts) : () => setStep("who")}
          backLabel={step === "who" ? "Cancel" : "Back"}
          primaryLabel={step === "template" ? "Use This Template" : "Continue"}
          primaryIcon={<ArrowRight className="size-5" strokeWidth={2} />}
          primaryIconPosition="end"
          onPrimary={next}
        />
      )}
    </div>
  );
}
