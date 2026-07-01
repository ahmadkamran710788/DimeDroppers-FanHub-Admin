"use client";

import { Fragment } from "react";
import { cn } from "@/utils/cn";

const STEPS = [
  { number: 1, label: "Organization Details" },
  { number: 2, label: "Import Schedule" },
  { number: 3, label: "Choose Activations" },
  { number: 4, label: "Review & Publish" },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  className?: string;
}

export default function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-4 w-full overflow-x-auto", className)}>
      {STEPS.map((step, idx) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <Fragment key={step.number}>
            {/* Pill: flex-1 so pills fill available space equally */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-2 py-2 backdrop-blur-[48px] flex-1",
                (isActive || isCompleted) ? "bg-steel-blue" : "bg-border-subtle"
              )}
            >
              {/* Number circle — 40×40 with 20% white ellipse behind */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-border-subtle" />
                <span className="relative z-10 text-base font-semibold text-white leading-none">
                  {step.number}
                </span>
              </div>
              <span className="text-base font-semibold text-white whitespace-nowrap pr-2">
                {step.label}
              </span>
            </div>
            {/* Connector — fixed 50px per Figma spec */}
            {idx < STEPS.length - 1 && (
              <div className="w-6 sm:w-[50px] h-[2px] bg-border-subtle shrink-0" />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
