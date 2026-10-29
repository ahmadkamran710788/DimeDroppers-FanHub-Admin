"use client";

import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";

const LINK_BUTTON = "h-[52px] px-[22px] rounded-[12px] text-base inline-flex items-center";

interface DoneStepProps {
  contact: string;
  brandName: string;
}

// After "Create sponsor account": the sponsor is signed in, and their store lookup has started.
export default function DoneStep({ contact, brandName }: DoneStepProps) {
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
        We’re finding {brandName}’s locations now, so we can show organizations near you. Check them in your
        sponsor profile, and upload your brand assets.
      </p>
      {/* Full page loads (not client navigation): the sponsor panel then loads the new session from scratch. */}
      <div className="flex gap-3 flex-wrap">
        <a href={routes.ui.sponsor.profile} className={cn(PRIMARY_BUTTON, LINK_BUTTON)}>
          Check your locations
        </a>
        <a href={routes.ui.sponsor.brandAssets} className={cn(OUTLINE_BUTTON, LINK_BUTTON, "font-semibold")}>
          Upload brand assets
        </a>
      </div>
    </section>
  );
}
