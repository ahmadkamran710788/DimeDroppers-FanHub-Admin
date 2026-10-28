"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Button from "@/components/common/button";
import StepIndicator from "@/components/common/step-indicator";
import SearchStep from "@/components/organization/sponsor-ai-agent/search-step";
import ReviewStep from "@/components/organization/sponsor-ai-agent/review-step";
import { DEFAULT_CATEGORIES, DEFAULT_RADIUS, SAMPLE_SPONSORS } from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorAgent } from "@/context/sponsor-agent";
import { routes } from "@/utils/routes";

// Sponsor AI Agent: pick an event, business categories and a radius; the agent finds local businesses
// and drafts a follow-up for each, which the organiser approves, edits or rejects.
export default function SponsorAiAgentPage() {
  const router = useRouter();
  const { event, statusOf, sentSponsors } = useSponsorAgent();
  const [step, setStep] = useState<"search" | "review">("search");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  const matched = useMemo(
    () => SAMPLE_SPONSORS.filter((s) => categories.includes(s.category) && s.miles <= radius),
    [categories, radius]
  );
  const draftCount = matched.filter((s) => statusOf(s.id) === "draft").length;
  const threads = sentSponsors.length;

  const steps = [
    { title: "Choose event, category & radius", subtitle: `${event.name} · ${categories.length} categories · ${radius} mi` },
    { title: "Review & approve follow-ups", subtitle: `${draftCount} ${draftCount === 1 ? "draft" : "drafts"} waiting` },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2 text-white max-w-[720px]">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Sponsor AI Agent
          </h2>
          <p className="text-base leading-[26px]">
            Pick the event you need sponsors for, then the kinds of businesses you want and how far to look. The
            agent finds local matches and drafts a follow-up for each one with your sponsorship packages inside.
          </p>
        </div>
        <Button
          size="sm"
          label={`Agent active · ${threads} ${threads === 1 ? "thread" : "threads"} in Sponsor Messages`}
          icon={<span className="size-2 rounded-full bg-success" />}
          onClick={() => router.push(routes.ui.sponsorMessages)}
          className="shrink-0 h-10 px-4 text-sm border border-success/40 bg-[#1d3a1e] text-[#a3e3a5] hover:bg-[#244a26]"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <StepIndicator steps={steps} current={step === "search" ? 0 : 1} />

      {step === "search" ? (
        <SearchStep
          categories={categories}
          onCategoriesChange={setCategories}
          radius={radius}
          onRadiusChange={setRadius}
          onFind={() => setStep("review")}
        />
      ) : (
        <ReviewStep matched={matched} radius={radius} onChangeSearch={() => setStep("search")} />
      )}
    </div>
  );
}
