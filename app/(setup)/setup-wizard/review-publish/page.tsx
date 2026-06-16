/* eslint-disable @next/next/no-img-element */
"use client";

import FanHubPhonePreview from "@/components/setup/FanHubPhonePreview";
import CheckCircle from "@/components/common/CheckCircle";
import SectionCard from "@/components/common/SectionCard";
import StepIndicator from "@/components/common/StepIndicator";
import WizardFooter from "@/components/common/WizardFooter";
import { routes } from "@/utils/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const REVIEW_SECTIONS = [
  {
    id: "organization-details",
    title: "Organization Details",
    lines: ["Twin Lakes High School", "Varsity Basketball"],
    href: routes.ui.setupWizard.organizationDetails,
  },
  {
    id: "schedule",
    title: "Schedule",
    lines: ["2024 - 2025 Season", "42 Events Imported"],
    href: routes.ui.setupWizard.importSchedule,
  },
  {
    id: "activations",
    title: "Activations",
    lines: ["17 Activations Selected across 3 categories."],
    href: routes.ui.setupWizard.chooseActivations,
  },
];

const CHECKLIST = [
  "Organization details are complete",
  "Schedule imported successfully",
  "Activations configured",
  "Hub branding and logo added",
  "All settings look good to go!",
];

export default function ReviewPublishPage() {
  const router = useRouter();

  const handlePublish = () => {
    toast.success("Your Fan Hub has been published!");
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <StepIndicator currentStep={4} />

      <div className="flex flex-col gap-2">
        <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
          Review & Publish
        </h2>
        <p className="text-base text-white/80">
          Review your Fan Hub settings and preview how it will look for your fans.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        {/* LEFT — two configuration summary cards */}
        <div className="w-full lg:w-[348px] lg:shrink-0 flex flex-col gap-6 lg:gap-10">
          {/* Card 1 — sections */}
          <SectionCard title="Configuration Summary" className="bg-surface-07">
            <div className="flex flex-col gap-4">
              {REVIEW_SECTIONS.map((section, i) => (
                <div key={section.id} className="flex flex-col gap-4">
                  {i > 0 && <div className="h-px bg-border-divider" />}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <p className="text-base font-semibold text-white leading-none">
                        {section.title}
                      </p>
                      {section.lines.map((line) => (
                        <p key={line} className="text-sm text-white/40 leading-tight">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-col items-end gap-4 shrink-0">
                      <span className="flex items-center gap-2 text-xs text-success">
                        <CheckCircle size={24} />
                        Complete
                      </span>
                      <Link
                        href={section.href}
                        className="h-6 px-3 rounded-[4px] flex items-center justify-center text-xs text-white backdrop-blur-[48px] hover:brightness-110 transition"
                        style={{ background: "rgba(235,235,235,0.25)" }}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Card 2 — checklist + secure footer */}
          <SectionCard title="Configuration Summary" className="bg-surface-07">
            <div className="flex flex-col gap-4">
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle size={24} />
                  <span className="text-base text-success leading-none">{item}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-border-divider" />

            <div className="flex items-start gap-2">
              <img
                src="/icons/icon-shield-check.svg"
                alt=""
                width={24}
                height={24}
                className="shrink-0"
              />
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold text-white leading-none">
                  Your Fan Hub is Secure
                </p>
                <p className="text-xs text-white leading-tight">
                  We use enterprise-grade security to keep your data and your fans protected.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* RIGHT — fan hub preview (light panel) */}
        <div className="flex-1 min-w-0 flex justify-center">
          <div
            className="w-full rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] items-center"
            style={{ background: "rgba(255,255,255,0.9)" }}
          >
            <div className="w-full flex flex-col gap-2">
              <h3 className="font-display font-black text-[28px] uppercase leading-tight text-midnight-navy">
                Fan Hub Preview
              </h3>
              <p className="text-xs text-midnight-navy">
                This is how your Fan Hub will look to your fans.
              </p>
              <div className="h-px bg-[rgba(0,0,0,0.1)] mt-1" />
            </div>

            <FanHubPhonePreview />
          </div>
        </div>
      </div>

      <WizardFooter
        onBack={() => router.push(routes.ui.setupWizard.chooseActivations)}
        onSaveExit={() => {}}
        primaryLabel="Publish"
        onPrimary={handlePublish}
      />
    </div>
  );
}
