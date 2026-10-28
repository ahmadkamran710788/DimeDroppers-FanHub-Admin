"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";

const LINK_BUTTON = "h-[52px] px-[22px] rounded-[12px] text-base inline-flex items-center";

interface DoneStepProps {
  contact: string;
  email: string;
  onRestart: () => void;
}

// After "Create sponsor account": what to set up next.
export default function DoneStep({ contact, email, onRestart }: DoneStepProps) {
  const firstName = contact.trim().split(/\s+/)[0]?.toUpperCase() || "WELCOME";

  return (
    <section aria-label="Account created" className="flex flex-col gap-[22px] items-start pt-10">
      <div className="size-[72px] rounded-[20px] bg-[#1d3a1e] flex items-center justify-center">
        <Check className="size-9 text-[#a3e3a5]" strokeWidth={2.4} aria-hidden />
      </div>
      <h2 tabIndex={-1} className="font-display font-black uppercase text-[44px] md:text-[60px] leading-[0.95] outline-none break-words max-w-full">
        You’re all set, {firstName}
      </h2>
      <p className="text-[17px] text-[#d4d4d4] leading-[1.55] max-w-[520px] break-words">
        We sent a confirmation link to {email}. Next, add your locations in your sponsor profile so we can show
        organizations near you, and upload your brand assets.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link href={routes.ui.sponsor.profile} className={cn(PRIMARY_BUTTON, LINK_BUTTON)}>
          Add your locations
        </Link>
        <Link href={routes.ui.sponsor.brandAssets} className={cn(OUTLINE_BUTTON, LINK_BUTTON, "font-semibold")}>
          Upload brand assets
        </Link>
      </div>
      <Button
        variant="text"
        size="sm"
        label="Start over"
        onClick={onRestart}
        className="h-11 text-sm text-[#a8a8a8] hover:text-white"
      />
    </section>
  );
}
