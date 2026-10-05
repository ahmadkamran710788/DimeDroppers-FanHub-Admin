"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import toast from "react-hot-toast";
import StepIndicator from "@/components/common/step-indicator";
import WizardFooter from "@/components/common/wizard-footer";
import ChooseStep from "@/components/recognition/add-recognition/choose-step";
import CustomizeStep, { type CustomizeForm } from "@/components/recognition/add-recognition/customize-step";
import { DEFAULT_MESSAGE, SAMPLE_GAMES, SAMPLE_RECIPIENTS } from "@/components/recognition/add-recognition/data";
import { customizeRecognitionSchema } from "@/components/recognition/add-recognition/schema";
import type { RecognitionCardData } from "@/components/recognition/recognition-card";
import RecognitionPreview from "@/components/recognition/recognition-preview";
import type { RecognitionCategory, RecognitionTemplate } from "@/components/recognition/recognitions-data";
import { CATEGORIES } from "@/components/recognition/templates";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";

type Step = "choose" | "customize";

const initialForm = (category: RecognitionCategory): CustomizeForm => ({
  gameId: SAMPLE_GAMES[0].id,
  recipientId: SAMPLE_RECIPIENTS[category][0].id,
  message: DEFAULT_MESSAGE[category],
  recognizedBy: "Coach Mike",
  role: "Head Coach",
  showTimestamp: true,
  pinToTop: false,
  allowComments: true,
});

// Add Recognition wizard: choose category + template, then customize, with a live preview.
export default function AddRecognitionPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [category, setCategory] = useState<RecognitionCategory>("Player");
  const [template, setTemplate] = useState<RecognitionTemplate>("Hustle");
  const [form, setForm] = useState<CustomizeForm>(() => initialForm("Player"));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof CustomizeForm>(key: K, value: CustomizeForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const pickCategory = (c: RecognitionCategory) => {
    setCategory(c);
    // Keep the template if the new category offers it, else fall back to its first one.
    if (!CATEGORIES[c].templates.includes(template)) setTemplate(CATEGORIES[c].templates[0]);
    // Recipients are per category; swap the starter message unless the admin already edited it.
    setForm((prev) => ({
      ...prev,
      recipientId: SAMPLE_RECIPIENTS[c][0].id,
      message: prev.message === DEFAULT_MESSAGE[category] ? DEFAULT_MESSAGE[c] : prev.message,
    }));
  };

  const recipient = SAMPLE_RECIPIENTS[category].find((r) => r.id === form.recipientId);
  const game = SAMPLE_GAMES.find((g) => g.id === form.gameId);
  const preview: RecognitionCardData = {
    template,
    message: form.message || "Your recognition message will appear here.",
    postedBy: form.recognizedBy || "Recognized by",
    postedByRole: form.role || "Role",
    recipient: recipient?.name ?? `Select a ${category.toLowerCase()}`,
    number: recipient?.number,
    date: game?.date ?? new Date().toISOString(),
    event: game?.label ?? "Select a game or event",
    opponent: game?.opponent,
  };

  const steps = [
    { title: "Category", subtitle: step === "customize" ? category : "Select category" },
    { title: "Template", subtitle: step === "customize" ? template : "Choose template" },
    { title: "Customize", subtitle: "Add details" },
  ];

  const backToPosts = () => router.push(routes.ui.recognitionPosts);
  const publish = async () => {
    if (!(await validateAndSetErrors(customizeRecognitionSchema, form, setErrors))) return;
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
          <p className="text-base text-white/85">Create a recognition post for players, coaches, parents, sponsors, donors or fans.</p>
        </div>
      </div>

      <StepIndicator steps={steps} current={step === "customize" ? 2 : 0} className="pb-6 border-b border-white/10" />

      {step === "choose" ? (
        <ChooseStep category={category} template={template} onCategory={pickCategory} onTemplate={setTemplate} />
      ) : (
        // The live preview only appears once there are details to customize.
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-8 items-start">
          <CustomizeStep
            category={category}
            template={template}
            onCategory={pickCategory}
            onTemplate={setTemplate}
            form={form}
            errors={errors}
            update={update}
          />
          <div className="xl:sticky xl:top-6">
            <RecognitionPreview
              recognition={preview}
              description="This is how it will appear on the fan app."
              showTimestamp={form.showTimestamp}
            />
          </div>
        </div>
      )}

      {step === "choose" ? (
        <WizardFooter
          onBack={backToPosts}
          backLabel="Cancel"
          primaryLabel="Use This Template"
          primaryIcon={<ArrowRight className="size-5" strokeWidth={2} />}
          primaryIconPosition="end"
          onPrimary={() => setStep("customize")}
        />
      ) : (
        <WizardFooter
          onBack={() => setStep("choose")}
          backLabel="Back"
          secondaryLabel="Save Draft"
          onSecondary={() => toast("Saving drafts is coming soon.")}
          primaryLabel="Publish Recognition"
          primaryIcon={<Send className="size-5" strokeWidth={2} />}
          onPrimary={publish}
        />
      )}
    </div>
  );
}
