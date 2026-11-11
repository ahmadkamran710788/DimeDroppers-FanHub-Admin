import { cn } from "@/utils/cn";
import { FIELD } from "@/components/sponsor/styles";

// Class names shared by the sponsor sign-up steps: the sponsor pages' dark field at the mockup's 52px.

export const INPUT = cn(FIELD, "h-[52px] px-[14px] text-[16px] placeholder:text-[#8a8a8a]");

export const SELECT = cn(FIELD, "h-[52px] px-[14px] text-[16px]");

export const TEXTAREA = cn(FIELD, "px-[14px] py-3 text-[16px] leading-[1.5] placeholder:text-[#8a8a8a]");

// A heading inside a step that starts a new group of fields ("Sport & level", "Social networks").
export const GROUP_HEADING =
  "col-span-full mt-2 border-t border-[#1f1f1f] pt-[22px] font-display font-black uppercase text-[26px] leading-none";

// The muted "· optional" after a field label.
export const OPTIONAL_HINT = "font-normal tracking-normal text-[#a8a8a8]";
